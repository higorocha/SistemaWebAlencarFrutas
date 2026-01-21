import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CobrancaAuthService } from './cobranca-auth.service';
import { BoletoLogService } from './boleto-log.service';
import { createCobrancaApiClient } from '../utils/bb-cobranca-client';
import { getBBAPIConfigByEnvironment } from '../../config/bb-api.config';
import {
  formatarDataBB,
  formatarValorBB,
  formatarCPFCNPJ,
  formatarCEP,
  formatarTelefone,
  formatarTextoBB
} from '../utils/formatadores-bb';
import { validarClienteParaBoleto } from '../utils/cliente-boleto-validator';
import { gerarNumeroTituloBeneficiario } from '../utils/gerador-numero-titulo';
import { gerarNumeroTituloCliente } from '../utils/gerador-nosso-numero';
import { validarPayloadCriacaoBoleto } from '../utils/validador-payload';
import {
  CriarBoletoDto,
  AlterarBoletoDto,
  ListarBoletosDto,
  ConsultarBoletoDto,
  BaixarBoletoDto,
  BaixaOperacionalDto,
  RetornoMovimentoDto,
  BoletoResponseDto,
  ListarBoletosResponseDto
} from '../dto';
import { StatusBoleto, TipoOperacaoBoletoLog, MetodoPagamento, StatusPedido, ContaDestino } from '@prisma/client';
import { NotificacoesService } from '../../notificacoes/notificacoes.service';
import { TipoNotificacao, PrioridadeNotificacao } from '../../notificacoes/dto';

/**
 * Service principal para integração com API de Cobrança do Banco do Brasil
 * 
 * Implementa todas as operações de boletos:
 * - Criação
 * - Consulta individual
 * - Listagem com filtros
 * - Alteração
 * - Baixa/Cancelamento
 * - Baixa Operacional
 * - Retorno de Movimento
 * - Notificações de pagamento
 */
@Injectable()
export class CobrancaService {
  constructor(
    private prisma: PrismaService,
    private authService: CobrancaAuthService,
    private logService: BoletoLogService,
    private notificacoesService: NotificacoesService
  ) {}

  /**
   * Cria um novo boleto
   * @param dto Dados do boleto a ser criado
   * @param usuarioId ID do usuário que está criando o boleto
   * @param ipAddress IP do usuário (para auditoria)
   * @returns Boleto criado
   */
  async criarBoleto(
    dto: CriarBoletoDto,
    usuarioId: number,
    ipAddress?: string
  ): Promise<BoletoResponseDto> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🆕 [CRIAR-BOLETO-SERVICE] Iniciando criação de boleto`);
    console.log(`${'='.repeat(80)}`);
    console.log(`   📋 Pedido ID: ${dto.pedidoId}`);
    console.log(`   💰 Valor: R$ ${dto.valorOriginal}`);
    console.log(`   📅 Vencimento: ${dto.dataVencimento}`);
    console.log(`   🏦 Conta Corrente ID: ${dto.contaCorrenteId}`);
    console.log(`   👤 Usuário ID: ${usuarioId}`);
    console.log(`   🌐 IP: ${ipAddress || 'N/A'}`);
    
    try {
      // 1. Buscar ConvenioCobranca e CredenciaisAPI
      console.log(`\n   🔍 [PASSO 1] Buscando convênio de cobrança...`);
      const convenio = await this.prisma.convenioCobranca.findUnique({
      where: { contaCorrenteId: dto.contaCorrenteId },
      include: {
        contaCorrente: {
          include: {
            credenciaisAPI: {
              where: {
                banco: '001',
                modalidadeApi: '001 - Cobrança'
              }
            }
          }
        }
      }
    });

      if (!convenio) {
        console.error(`   ❌ [ERRO] Convênio não encontrado para conta ${dto.contaCorrenteId}`);
        // Buscar conta corrente para formatar mensagem de erro
        const contaCorrente = await this.prisma.contaCorrente.findUnique({
          where: { id: dto.contaCorrenteId }
        });
        const contaInfo = contaCorrente 
          ? `${contaCorrente.agencia}/${contaCorrente.contaCorrente}`
          : dto.contaCorrenteId.toString();
        throw new NotFoundException(
          `Convênio de cobrança não encontrado para a conta ${contaInfo}`
        );
      }
      
      console.log(`   ✅ Convênio encontrado: ${convenio.convenio}`);

      const credenciais = convenio.contaCorrente.credenciaisAPI[0];
      if (!credenciais) {
        console.error(`   ❌ [ERRO] Credenciais não encontradas`);
        const contaInfo = `${convenio.contaCorrente.agencia}/${convenio.contaCorrente.contaCorrente}`;
        throw new NotFoundException(
          `Credenciais de API de Cobrança não encontradas para a conta ${contaInfo}`
        );
      }
      
      console.log(`   ✅ Credenciais encontradas`);

      // 2. Buscar Pedido e Cliente (pagador)
      console.log(`\n   🔍 [PASSO 2] Buscando pedido e cliente...`);
      const pedido = await this.prisma.pedido.findUnique({
      where: { id: dto.pedidoId },
      include: { cliente: true }
    });

      if (!pedido) {
        console.error(`   ❌ [ERRO] Pedido ${dto.pedidoId} não encontrado`);
        throw new NotFoundException(`Pedido ${dto.pedidoId} não encontrado`);
      }

      if (!pedido.cliente) {
        console.error(`   ❌ [ERRO] Cliente não encontrado para o pedido ${dto.pedidoId}`);
        throw new NotFoundException(`Cliente não encontrado para o pedido ${dto.pedidoId}`);
      }

      const cliente = pedido.cliente;
      console.log(`   ✅ Pedido encontrado: ${pedido.numeroPedido || dto.pedidoId}`);
      console.log(`   ✅ Cliente encontrado: ${cliente.nome}`);

      // 2.1 Validar se o cliente possui dados mínimos para emissão de boleto
      // Fazemos aqui para retornar erro amigável (com lista de campos faltantes)
      // antes de montar payload do BB / criar boleto local.
      const validacaoCliente = validarClienteParaBoleto(cliente as any);
      if (!validacaoCliente.ok) {
        throw new BadRequestException({
          message:
            'Cadastro do cliente incompleto para gerar boleto. Atualize o cadastro e tente novamente.',
          code: 'CLIENTE_INCOMPLETO_BOLETO',
          // Dados mínimos para o frontend abrir o modal de edição do cliente
          clienteId: cliente.id,
          clienteNome: cliente.nome,
          pedidoId: pedido.id,
          missingFields: validacaoCliente.missingFields,
        });
      }

      // 3. Gerar numeroTituloBeneficiario
      console.log(`\n   🔍 [PASSO 3] Gerando número do título beneficiário...`);
      const numeroTituloBeneficiario = await gerarNumeroTituloBeneficiario(
      this.prisma,
      dto.pedidoId
    );

      console.log(`   ✅ Número título beneficiário: ${numeroTituloBeneficiario}`);

      // 4. Gerar numeroTituloCliente (nosso número)
      console.log(`\n   🔍 [PASSO 4] Gerando número do título cliente (Nosso Número)...`);
      const tipoConvenio = convenio.tipoConvenio || 3; // Default 3 se não informado
      console.log(`   📋 Tipo de convênio: ${tipoConvenio} (${tipoConvenio === 4 ? 'Cliente numera' : 'Banco numera'})`);
      
      const numeroTituloCliente = await gerarNumeroTituloCliente(
        this.prisma,
        dto.contaCorrenteId,
        convenio.convenio,
        tipoConvenio
      );
      
      if (numeroTituloCliente) {
        console.log(`   ✅ Nosso número gerado: ${numeroTituloCliente}`);
      } else {
        console.log(`   ✅ Nosso número: será gerado pelo Banco do Brasil (tipo 3 em produção)`);
      }

      // 5. Preparar dados do pagador
      console.log(`\n   🔍 [PASSO 5] Preparando dados do pagador...`);
    // IMPORTANTE: numeroInscricao mantém zeros à esquerda (regra específica do BB para este campo)
    // OBS: aqui já validamos que existe cpf/cnpj (validação acima), então é seguro formatar.
    const cpfCnpjLimpo = formatarCPFCNPJ(cliente.cpf || cliente.cnpj || '');
    const isCNPJ = cpfCnpjLimpo.length > 11;

      if (!cpfCnpjLimpo) {
        console.error(`   ❌ [ERRO] CPF/CNPJ do cliente não encontrado`);
        throw new BadRequestException('CPF/CNPJ do cliente é obrigatório para gerar boleto');
      }
      
      console.log(`   ✅ CPF/CNPJ: ${cpfCnpjLimpo} (${isCNPJ ? 'CNPJ' : 'CPF'})`);

    const pagador = {
      tipoInscricao: isCNPJ ? '2' : '1',
      numeroInscricao: cpfCnpjLimpo, // Mantém zeros à esquerda (regra específica)
      nome: formatarTextoBB(cliente.nome || '', 60),
      endereco: formatarTextoBB(cliente.logradouro || '', 60),
      cep: formatarCEP(cliente.cep || ''),
      cidade: formatarTextoBB(cliente.cidade || '', 30),
      bairro: formatarTextoBB(cliente.bairro || '', 30),
      uf: formatarTextoBB(cliente.estado || '', 2),
      telefone: formatarTelefone(cliente.telefone1 || cliente.telefone2 || ''),
      // Email omitido para evitar emails duplicados do BB
      // O sistema já envia os emails internamente
      email: undefined
    };

      // 6. Preparar payload do BB
      console.log(`\n   🔍 [PASSO 6] Preparando payload para o Banco do Brasil...`);
      const dataEmissao = new Date();
      const dataVencimento = new Date(dto.dataVencimento);

    const payloadBB: any = {
      numeroConvenio: convenio.convenio,
      numeroCarteira: convenio.carteira,
      numeroVariacaoCarteira: convenio.variacao,
      codigoModalidade: '1', // Simples
      dataEmissao: formatarDataBB(dataEmissao),
      dataVencimento: formatarDataBB(dataVencimento),
      valorOriginal: formatarValorBB(dto.valorOriginal),
      numeroTituloBeneficiario: numeroTituloBeneficiario,
      pagador: pagador,
      indicadorPermissaoRecebimentoParcial: 'N',
      codigoTipoTitulo: '2', // Boleto de Cobrança
      descricaoTipoTitulo: 'DM',
      codigoAceite: 'N',
      indicadorAceiteTituloVencido: convenio.diasAberto > 0 ? 'S' : 'N',
      numeroDiasLimiteRecebimento: convenio.diasAberto > 0 ? convenio.diasAberto : undefined,
      indicadorPix: convenio.boletoPix ? 'S' : 'N'
    };

    // Adicionar juros se configurado
    if (convenio.juros > 0) {
      payloadBB.jurosMora = {
        tipo: '2', // Taxa mensal
        porcentagem: formatarValorBB(convenio.juros)
      };
    }

    // Adicionar multa se configurado
    if (convenio.multaAtiva && convenio.valorMulta) {
      payloadBB.multa = {
        tipo: convenio.valorMulta > 0 ? '2' : '0', // Percentual ou dispensar
        porcentagem: convenio.valorMulta > 0 ? formatarValorBB(convenio.valorMulta) : undefined,
        data: formatarDataBB(new Date(dataVencimento.getTime() + (convenio.carenciaMulta || 0) * 24 * 60 * 60 * 1000))
      };
    }

    // Adicionar mensagem se informada
    if (dto.mensagemBloquetoOcorrencia) {
      payloadBB.mensagemBloquetoOcorrencia = formatarTextoBB(dto.mensagemBloquetoOcorrencia, 165);
    }

    // Adicionar numeroTituloCliente (Nosso Número)
    // Tipo 4: obrigatório sempre | Tipo 3: apenas em desenvolvimento
    if (numeroTituloCliente) {
      payloadBB.numeroTituloCliente = numeroTituloCliente;
      console.log(`   ✅ numeroTituloCliente incluído no payload: ${numeroTituloCliente}`);
    } else if (tipoConvenio === 4) {
      // Tipo 4 sempre requer nosso número - erro se não foi gerado
      throw new BadRequestException(
        'Convênio tipo 4 requer nosso número (numeroTituloCliente). ' +
        'Erro ao gerar nosso número para o convênio.'
      );
    } else {
      console.log(`   ℹ️  numeroTituloCliente não incluído (BB gerará automaticamente para tipo 3)`);
    }

      // 7. Validar payload
      console.log(`   🔍 [PASSO 7] Validando payload...`);
      const errosValidacao = validarPayloadCriacaoBoleto(payloadBB);
      if (errosValidacao.length > 0) {
        console.error(`   ❌ [ERRO] Erros de validação:`, errosValidacao);
        throw new BadRequestException({
          message: 'Erros de validação no payload',
          erros: errosValidacao
        });
      }
      console.log(`   ✅ Payload validado com sucesso`);

      // 8. Obter token OAuth2
      console.log(`\n   🔍 [PASSO 8] Obtendo token OAuth2...`);
      const token = await this.authService.obterTokenDeAcesso(dto.contaCorrenteId);
      console.log(`   ✅ Token obtido com sucesso`);

      // 9. Registrar no BB
      console.log(`\n   🔍 [PASSO 9] Registrando boleto no Banco do Brasil...`);
      try {
      const config = getBBAPIConfigByEnvironment('COBRANCA');
      const apiClient = createCobrancaApiClient(credenciais.developerAppKey);

      const response = await apiClient.post('/boletos', payloadBB, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          'gw-dev-app-key': credenciais.developerAppKey
        }
      });

        const respostaBB = response.data as any;
        console.log(`   ✅ Boleto registrado com sucesso no Banco do Brasil`);
        console.log(`\n   📋 [RESPOSTA BB] Dados retornados pelo banco:`);
        console.log(`      - Nosso Número: ${respostaBB.numero || respostaBB.numeroTituloCliente || respostaBB.nossoNumero || 'N/A'}`);
        console.log(`      - Linha Digitável: ${respostaBB.linhaDigitavel || 'N/A'}`);
        console.log(`      - Código de Barras: ${respostaBB.codigoBarraNumerico || respostaBB.codigoBarras || 'N/A'}`);
        console.log(`      - Seu Número: ${respostaBB.numeroTituloBeneficiario || 'N/A'}`);
        if (respostaBB.qrCode) {
          console.log(`      - PIX: TxID ${respostaBB.qrCode.txId || 'N/A'}`);
        }
        console.log(`   📋 [RESPOSTA BB] Payload completo:`, JSON.stringify(respostaBB, null, 2));

        // 10. Criar boleto no banco local com resposta do BB
        console.log(`\n   🔍 [PASSO 10] Criando boleto no banco local com resposta do BB...`);
        const nossoNumeroRetornado =
          respostaBB.numero || respostaBB.numeroTituloCliente || respostaBB.nossoNumero || null;
        const nossoNumeroEnviado = numeroTituloCliente || null;
        const nossoNumeroFinal = nossoNumeroRetornado || nossoNumeroEnviado;
        const nossoNumeroMatch =
          Boolean(nossoNumeroEnviado && nossoNumeroRetornado && nossoNumeroEnviado === nossoNumeroRetornado);

        console.log(
          `   🧾 [NOSSO NUMERO] Enviado: ${nossoNumeroEnviado || 'N/A'} | ` +
          `Retornado: ${nossoNumeroRetornado || 'N/A'} | ` +
          `Match: ${nossoNumeroMatch ? 'SIM' : 'NAO'}`
        );

        if (!nossoNumeroFinal) {
          throw new InternalServerErrorException(
            'Boleto registrado no BB, mas o nosso número não foi retornado.'
          );
        }

        const boleto = await this.prisma.boleto.create({
          data: {
            convenioCobrancaId: convenio.id,
            pedidoId: dto.pedidoId,
            contaCorrenteId: dto.contaCorrenteId,
            valorOriginal: dto.valorOriginal,
            dataVencimento: dataVencimento,
            dataEmissao: dataEmissao,
            statusBoleto: StatusBoleto.ABERTO,
            nossoNumero: nossoNumeroFinal,
            numeroTituloBeneficiario: numeroTituloBeneficiario,
            numeroTituloCliente: numeroTituloCliente,
            linhaDigitavel: respostaBB.linhaDigitavel || 'N/A',
            codigoBarras: respostaBB.codigoBarraNumerico || respostaBB.codigoBarras || 'N/A',
            qrCodePix: respostaBB.qrCode?.url || null,
            txidPix: respostaBB.qrCode?.txId || null,
            urlPix: respostaBB.qrCode?.emv || null,
            numeroConvenio: convenio.convenio,
            numeroCarteira: convenio.carteira,
            numeroVariacaoCarteira: convenio.variacao,
            usuarioCriacaoId: usuarioId,
            requestPayloadBanco: payloadBB as any,
            responsePayloadBanco: respostaBB,
            metadata: {
              nossoNumeroEnviado,
              nossoNumeroRetornado,
              nossoNumeroMatch,
              tipoConvenio,
            } as any,
            pagadorTipoInscricao: pagador.tipoInscricao,
            pagadorNumeroInscricao: pagador.numeroInscricao,
            pagadorNome: pagador.nome,
            pagadorEndereco: pagador.endereco,
            pagadorCep: pagador.cep,
            pagadorCidade: pagador.cidade,
            pagadorBairro: pagador.bairro,
            pagadorUf: pagador.uf,
            pagadorTelefone: pagador.telefone || null,
            pagadorEmail: pagador.email || null,
          },
        });

        console.log(`   ✅ Boleto criado no banco local (ID: ${boleto.id})`);

        // 11. Criar log de auditoria
        console.log(`   🔍 [PASSO 11] Criando log de auditoria...`);
        await this.logService.criarLog(
          boleto.id,
          TipoOperacaoBoletoLog.CRIACAO,
          `Boleto criado via API (BB: nossoNumero=${nossoNumeroRetornado || 'N/A'} | ` +
            `enviado=${nossoNumeroEnviado || 'N/A'} | match=${nossoNumeroMatch ? 'SIM' : 'NAO'})`,
          null,
          {
            nossoNumeroRetornado,
            nossoNumeroEnviado,
            nossoNumeroMatch,
            linhaDigitavel: respostaBB.linhaDigitavel || null,
            codigoBarras: respostaBB.codigoBarraNumerico || respostaBB.codigoBarras || null,
            respostaBB,
          },
          usuarioId,
          ipAddress
        );

        // 12. Retornar boleto atualizado
        console.log(`   🔍 [PASSO 12] Buscando boleto atualizado...`);
        const boletoAtualizado = await this.prisma.boleto.findUnique({
          where: { id: boleto.id },
        });

        console.log(`\n${'='.repeat(80)}`);
        console.log(`✅ [CRIAR-BOLETO-SERVICE] Boleto criado com sucesso!`);
        console.log(`${'='.repeat(80)}`);
        console.log(`   🆔 ID Local: ${boletoAtualizado!.id}`);
        console.log(`   📋 Nosso Número: ${boletoAtualizado!.nossoNumero}`);
        console.log(`   📋 Seu Número: ${boletoAtualizado!.numeroTituloBeneficiario}`);
        console.log(`   💰 Valor: R$ ${Number(boletoAtualizado!.valorOriginal).toFixed(2)}`);
        console.log(`   📅 Vencimento: ${boletoAtualizado!.dataVencimento.toLocaleDateString('pt-BR')}`);
        console.log(`   📦 Pedido ID: ${dto.pedidoId}`);
        console.log(`   🏦 Conta: ${convenio.contaCorrente.agencia}/${convenio.contaCorrente.contaCorrente}`);
        console.log(`   🏦 Convênio: ${convenio.convenio} (Tipo: ${tipoConvenio})`);
        console.log(`   🔗 Linha Digitável: ${boletoAtualizado!.linhaDigitavel || 'N/A'}`);
        if (boletoAtualizado!.qrCodePix) {
          console.log(`   💳 PIX: Disponível (TxID: ${boletoAtualizado!.txidPix || 'N/A'})`);
        }
        console.log(`${'='.repeat(80)}\n`);

        return this.mapearBoletoParaResponse(boletoAtualizado!);

      } catch (error) {
        console.error(`\n   ❌ [ERRO] Falha ao registrar boleto no Banco do Brasil`);
        console.error(`   🔴 Tipo: ${error.constructor.name}`);
        console.error(`   🔴 Mensagem: ${error.message}`);
        console.error(`   📋 Response Status: ${error.response?.status || 'N/A'}`);
        console.error(`   📋 Response Data:`, JSON.stringify(error.response?.data || {}).substring(0, 500));
        console.error(`   📋 Stack:`, error.stack?.substring(0, 500));

        if (error.response?.status === 401) {
          throw new BadRequestException('Token expirado. Tente novamente.');
        }

        if (error.response?.data?.erros) {
          throw new BadRequestException({
            message: 'Erro na API do Banco do Brasil',
            code: 'BB_API_ERROR',
            erros: error.response.data.erros,
            status: error.response?.status || 400,
          });
        }

        throw new InternalServerErrorException(
          `Erro ao registrar boleto no Banco do Brasil: ${error.message}`
        );
      }
    } catch (error) {
      console.error(`\n${'='.repeat(80)}`);
      console.error(`❌ [CRIAR-BOLETO-SERVICE] ERRO CRÍTICO`);
      console.error(`${'='.repeat(80)}`);
      console.error(`   🔴 Tipo: ${error.constructor.name}`);
      console.error(`   🔴 Mensagem: ${error.message}`);
      console.error(`   📋 Stack:`, error.stack);
      console.error(`${'='.repeat(80)}\n`);
      throw error;
    }
  }

  /**
   * Lista todos os boletos de um pedido específico
   * @param pedidoId ID do pedido
   * @returns Lista de boletos do pedido
   */
  async listarBoletosPorPedido(pedidoId: number): Promise<any[]> {
    // Verificar se o pedido existe
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId }
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido ${pedidoId} não encontrado`);
    }

    // Buscar todos os boletos do pedido com relacionamentos completos
    const boletos = await this.prisma.boleto.findMany({
      where: { pedidoId: pedidoId },
      include: {
        usuarioCriacao: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        usuarioAlteracao: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        usuarioBaixa: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        usuarioPagamento: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        logs: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: { dataEmissao: 'desc' }
    });

    // Mapear para formato de resposta incluindo logs e relacionamentos
    return boletos.map(boleto => ({
      ...this.mapearBoletoParaResponse(boleto),
      // Dados do pagador
      pagadorNome: boleto.pagadorNome,
      pagadorNumeroInscricao: boleto.pagadorNumeroInscricao,
      pagadorTipoInscricao: boleto.pagadorTipoInscricao,
      pagadorEndereco: boleto.pagadorEndereco,
      pagadorBairro: boleto.pagadorBairro,
      pagadorCidade: boleto.pagadorCidade,
      pagadorUf: boleto.pagadorUf,
      pagadorCep: boleto.pagadorCep,
      pagadorTelefone: boleto.pagadorTelefone,
      pagadorEmail: boleto.pagadorEmail,
      // Usuários responsáveis
      usuarioCriacao: boleto.usuarioCriacao,
      usuarioAlteracao: boleto.usuarioAlteracao,
      usuarioBaixa: boleto.usuarioBaixa,
      usuarioPagamento: boleto.usuarioPagamento,
      // Informações de webhook
      atualizadoPorWebhook: boleto.atualizadoPorWebhook,
      dataWebhookPagamento: boleto.dataWebhookPagamento,
      ipAddressWebhook: boleto.ipAddressWebhook,
      // Logs
      logs: boleto.logs.map((log) => ({
        id: log.id,
        tipoOperacao: log.tipoOperacao,
        descricaoOperacao: log.descricaoOperacao,
        dadosAntes: log.dadosAntes,
        dadosDepois: log.dadosDepois,
        usuario: log.usuario,
        ipAddress: log.ipAddress,
        mensagemErro: log.mensagemErro,
        createdAt: log.createdAt,
      })),
    }));
  }

  /**
   * Consulta um boleto específico
   * @param nossoNumero Nosso número do boleto (20 dígitos)
   * @param numeroConvenio Número do convênio
   * @param contaCorrenteId ID da conta corrente
   * @returns Dados completos do boleto
   */
  async consultarBoleto(
    nossoNumero: string,
    numeroConvenio: string,
    contaCorrenteId: number
  ): Promise<BoletoResponseDto> {
    // Buscar credenciais
    const credenciais = await this.prisma.credenciaisAPI.findFirst({
      where: {
        banco: '001',
        contaCorrenteId: contaCorrenteId,
        modalidadeApi: '001 - Cobrança'
      },
      include: {
        contaCorrente: true
      }
    });

    if (!credenciais) {
      // Buscar conta corrente para formatar mensagem de erro
      const contaCorrente = await this.prisma.contaCorrente.findUnique({
        where: { id: contaCorrenteId }
      });
      const contaInfo = contaCorrente 
        ? `${contaCorrente.agencia}/${contaCorrente.contaCorrente}`
        : contaCorrenteId.toString();
      throw new NotFoundException(
        `Credenciais de API de Cobrança não encontradas para a conta ${contaInfo}`
      );
    }

    // Obter token
    const token = await this.authService.obterTokenDeAcesso(contaCorrenteId);

    // Consultar no BB
    try {
      const config = getBBAPIConfigByEnvironment('COBRANCA');
      const apiClient = createCobrancaApiClient(credenciais.developerAppKey);

      const response = await apiClient.get(`/boletos/${nossoNumero}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          'gw-dev-app-key': credenciais.developerAppKey,
          numeroConvenio: numeroConvenio
        }
      });

      const dadosBB = response.data as any;

      // Buscar boleto local e atualizar se necessário
      const boleto = await this.prisma.boleto.findUnique({
        where: { nossoNumero: nossoNumero }
      });

      if (boleto) {
        // Atualizar dados locais com resposta do BB
        await this.prisma.boleto.update({
          where: { id: boleto.id },
          data: {
            responsePayloadBanco: dadosBB,
            // Atualizar status se necessário baseado nos dados do BB
            // O campo correto é codigoEstadoTituloCobranca (número)
            statusBoleto: this.mapearStatusBBParaLocal(dadosBB.codigoEstadoTituloCobranca)
          }
        });

        const boletoAtualizado = await this.prisma.boleto.findUnique({
          where: { id: boleto.id }
        });

        console.log(`✅ [CONSULTAR-BOLETO] Boleto consultado e atualizado - Nosso Número: ${nossoNumero}, ID: ${boletoAtualizado!.id}, Status: ${boletoAtualizado!.statusBoleto}`);
        return this.mapearBoletoParaResponse(boletoAtualizado!);
      }

      // Se não encontrou localmente, retornar apenas dados do BB
      // (pode acontecer se o boleto foi criado fora do sistema)
      console.warn(`⚠️ [CONSULTAR-BOLETO] Boleto ${nossoNumero} encontrado no BB mas não existe no sistema local`);
      throw new NotFoundException('Boleto não encontrado no sistema local');

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`❌ [CONSULTAR-BOLETO] Erro ao consultar boleto - Nosso Número: ${nossoNumero}`, error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new NotFoundException('Boleto não encontrado no Banco do Brasil');
      }

      throw new InternalServerErrorException(
        `Erro ao consultar boleto: ${error.message}`
      );
    }
  }

  /**
   * Consulta um boleto completo com logs e relacionamentos
   * @param nossoNumero Nosso número do boleto
   * @param contaCorrenteId ID da conta corrente
   * @returns Dados completos do boleto com logs e relacionamentos
   */
  async consultarBoletoCompleto(
    nossoNumero: string,
    contaCorrenteId: number
  ): Promise<any> {
    const boleto = await this.prisma.boleto.findUnique({
      where: { nossoNumero },
      include: {
        usuarioCriacao: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        usuarioAlteracao: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        usuarioBaixa: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        usuarioPagamento: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        logs: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!boleto) {
      throw new NotFoundException('Boleto não encontrado');
    }

    // Mapear para formato de resposta incluindo logs e relacionamentos
    return {
      ...this.mapearBoletoParaResponse(boleto),
      pagadorNome: boleto.pagadorNome,
      pagadorNumeroInscricao: boleto.pagadorNumeroInscricao,
      pagadorTipoInscricao: boleto.pagadorTipoInscricao,
      pagadorEndereco: boleto.pagadorEndereco,
      pagadorBairro: boleto.pagadorBairro,
      pagadorCidade: boleto.pagadorCidade,
      pagadorUf: boleto.pagadorUf,
      pagadorCep: boleto.pagadorCep,
      pagadorTelefone: boleto.pagadorTelefone,
      pagadorEmail: boleto.pagadorEmail,
      usuarioCriacao: boleto.usuarioCriacao,
      usuarioAlteracao: boleto.usuarioAlteracao,
      usuarioBaixa: boleto.usuarioBaixa,
      usuarioPagamento: boleto.usuarioPagamento,
      logs: boleto.logs.map((log) => ({
        id: log.id,
        tipoOperacao: log.tipoOperacao,
        descricaoOperacao: log.descricaoOperacao,
        dadosAntes: log.dadosAntes,
        dadosDepois: log.dadosDepois,
        usuario: log.usuario,
        ipAddress: log.ipAddress,
        mensagemErro: log.mensagemErro,
        createdAt: log.createdAt,
      })),
    };
  }

  /**
   * Lista boletos com filtros
   * @param dto Filtros para listagem
   * @param contaCorrenteId ID da conta corrente
   * @returns Lista de boletos
   */
  async listarBoletos(
    dto: ListarBoletosDto,
    contaCorrenteId: number
  ): Promise<ListarBoletosResponseDto> {
    console.log(`📋 [LISTAR-BOLETOS] Listando boletos - Conta: ${contaCorrenteId}, Situação: ${dto.indicadorSituacao}, Vencido: ${dto.boletoVencido}`);
    // Buscar credenciais
    const credenciais = await this.prisma.credenciaisAPI.findFirst({
      where: {
        banco: '001',
        contaCorrenteId: contaCorrenteId,
        modalidadeApi: '001 - Cobrança'
      },
      include: {
        contaCorrente: true
      }
    });

    if (!credenciais) {
      // Buscar conta corrente para formatar mensagem de erro
      const contaCorrente = await this.prisma.contaCorrente.findUnique({
        where: { id: contaCorrenteId }
      });
      const contaInfo = contaCorrente 
        ? `${contaCorrente.agencia}/${contaCorrente.contaCorrente}`
        : contaCorrenteId.toString();
      throw new NotFoundException(
        `Credenciais de API de Cobrança não encontradas para a conta ${contaInfo}`
      );
    }

    // Obter token
    const token = await this.authService.obterTokenDeAcesso(contaCorrenteId);

    // Preparar parâmetros da query
    const params: any = {
      'gw-dev-app-key': credenciais.developerAppKey,
      indicadorSituacao: dto.indicadorSituacao,
      agenciaBeneficiario: dto.agenciaBeneficiario,
      contaBeneficiario: dto.contaBeneficiario,
      boletoVencido: dto.boletoVencido
    };

    if (dto.carteiraConvenio) params.carteiraConvenio = dto.carteiraConvenio;
    if (dto.variacaoCarteiraConvenio) params.variacaoCarteiraConvenio = dto.variacaoCarteiraConvenio;
    if (dto.modalidadeCobranca) params.modalidadeCobranca = dto.modalidadeCobranca;
    if (dto.dataInicioVencimento) params.dataInicioVencimento = dto.dataInicioVencimento;
    if (dto.dataFimVencimento) params.dataFimVencimento = dto.dataFimVencimento;
    if (dto.dataInicioRegistro) params.dataInicioRegistro = dto.dataInicioRegistro;
    if (dto.dataFimRegistro) params.dataFimRegistro = dto.dataFimRegistro;
    if (dto.cpfPagador) {
      params.cpfPagador = dto.cpfPagador;
      if (dto.digitoCPFPagador) params.digitoCPFPagador = dto.digitoCPFPagador;
    }
    if (dto.cnpjPagador) {
      params.cnpjPagador = dto.cnpjPagador;
      if (dto.digitoCNPJPagador) params.digitoCNPJPagador = dto.digitoCNPJPagador;
    }
    if (dto.codigoEstadoTituloCobranca) params.codigoEstadoTituloCobranca = dto.codigoEstadoTituloCobranca;
    if (dto.indice !== undefined) params.indice = dto.indice;

    // Consultar no BB com paginação automática
    const config = getBBAPIConfigByEnvironment('COBRANCA');
    const apiClient = createCobrancaApiClient(credenciais.developerAppKey);

    let todosBoletos: any[] = [];
    let indicadorContinuidade = 'N';
    let proximoIndice: number | undefined;

    try {
      // Primeira chamada
      const primeiraChamada = await apiClient.get('/boletos', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { ...params, indice: dto.indice || 0 }
      });

      const dados = primeiraChamada.data as any;
      if (dados.boletos && Array.isArray(dados.boletos)) {
        todosBoletos = todosBoletos.concat(dados.boletos);
      }

      indicadorContinuidade = dados.indicadorContinuidade || 'N';
      proximoIndice = dados.proximoIndice;

      // Segunda chamada se houver mais registros
      if (indicadorContinuidade === 'S' && proximoIndice && todosBoletos.length < 1000) {
        const segundaChamada = await apiClient.get('/boletos', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: { ...params, indice: proximoIndice }
        });

        const dadosSegunda = segundaChamada.data as any;
        if (dadosSegunda.boletos && Array.isArray(dadosSegunda.boletos)) {
          todosBoletos = todosBoletos.concat(dadosSegunda.boletos);
        }
      }

      const resultado = {
        quantidadeRegistros: todosBoletos.length,
        indicadorContinuidade: indicadorContinuidade,
        proximoIndice: proximoIndice,
        boletos: todosBoletos.map(b => this.mapearBoletoBBParaResponse(b))
      };

      console.log(`✅ [LISTAR-BOLETOS] ${todosBoletos.length} boleto(s) encontrado(s) para conta ${contaCorrenteId}, Continuidade: ${indicadorContinuidade}, Próximo Índice: ${proximoIndice || 'N/A'}`);

      return resultado;

    } catch (error) {
      console.error(`❌ [LISTAR-BOLETOS] Erro ao listar boletos - Conta: ${contaCorrenteId}`, error.response?.data || error.message);

      if (error.response?.status === 404) {
        // Lista vazia é retornada como 404 pelo BB
        return {
          quantidadeRegistros: 0,
          indicadorContinuidade: 'N',
          boletos: []
        };
      }

      throw new InternalServerErrorException(
        `Erro ao listar boletos: ${error.message}`
      );
    }
  }

  /**
   * Altera um boleto
   * @param nossoNumero Nosso número do boleto
   * @param dto Dados de alteração
   * @param usuarioId ID do usuário
   * @param ipAddress IP do usuário
   * @returns Boleto atualizado
   */
  async alterarBoleto(
    nossoNumero: string,
    dto: AlterarBoletoDto,
    usuarioId: number,
    ipAddress?: string
  ): Promise<BoletoResponseDto> {
    console.log(`📝 [ALTERAR-BOLETO] Iniciando alteração de boleto - Nosso Número: ${nossoNumero}, Usuário: ${usuarioId}`);
    
    // Buscar boleto local
    const boleto = await this.prisma.boleto.findUnique({
      where: { nossoNumero: nossoNumero }
    });

    if (!boleto) {
      throw new NotFoundException(`Boleto ${nossoNumero} não encontrado`);
    }

    // Validar que está "em ser"
    if (boleto.statusBoleto !== StatusBoleto.ABERTO && boleto.statusBoleto !== StatusBoleto.PROCESSANDO) {
      throw new BadRequestException(
        `Boleto não pode ser alterado. Status atual: ${boleto.statusBoleto}`
      );
    }

    // Validar que passaram 30 minutos desde criação
    const dataEmissao = new Date(boleto.dataEmissao);
    const agora = new Date();
    const diffMinutos = Math.floor((agora.getTime() - dataEmissao.getTime()) / 60000);

    if (diffMinutos < 30) {
      throw new BadRequestException(
        `Boleto não pode ser alterado. É necessário aguardar 30 minutos após o registro (tempo decorrido: ${diffMinutos} minutos)`
      );
    }

    // Buscar credenciais
    const credenciais = await this.prisma.credenciaisAPI.findFirst({
      where: {
        banco: '001',
        contaCorrenteId: boleto.contaCorrenteId,
        modalidadeApi: '001 - Cobrança'
      }
    });

    if (!credenciais) {
      throw new NotFoundException('Credenciais de API não encontradas');
    }

    // Preparar payload de alteração
    const payloadAlteracao: any = {
      numeroConvenio: boleto.numeroConvenio
    };

    // Nova data de vencimento
    if (dto.novaDataVencimento) {
      payloadAlteracao.indicadorNovaDataVencimento = 'S';
      payloadAlteracao.alteracaoData = {
        novaDataVencimento: formatarDataBB(new Date(dto.novaDataVencimento))
      };
    }

    // Novo valor nominal
    if (dto.novoValorNominal) {
      payloadAlteracao.indicadorNovoValorNominal = 'S';
      payloadAlteracao.novoValorNominal = formatarValorBB(dto.novoValorNominal);
    }

    // Buscar convênio para obter juros e multa
    const convenio = await this.prisma.convenioCobranca.findUnique({
      where: { id: boleto.convenioCobrancaId }
    });

    if (!convenio) {
      throw new NotFoundException('Convênio de cobrança não encontrado');
    }

    // Juros
    if (dto.cobrarJuros !== undefined) {
      payloadAlteracao.indicadorCobrarJuros = dto.cobrarJuros ? 'S' : 'N';
      if (dto.cobrarJuros && convenio.juros > 0) {
        payloadAlteracao.juros = {
          tipo: '2',
          porcentagem: formatarValorBB(convenio.juros)
        };
      }
    }

    if (dto.dispensarJuros) {
      payloadAlteracao.indicadorDispensarJuros = 'S';
    }

    // Multa
    if (dto.cobrarMulta !== undefined) {
      payloadAlteracao.indicadorCobrarMulta = dto.cobrarMulta ? 'S' : 'N';
      if (dto.cobrarMulta && convenio.multaAtiva && convenio.valorMulta) {
        payloadAlteracao.multa = {
          tipo: '2',
          porcentagem: formatarValorBB(convenio.valorMulta),
          data: formatarDataBB(new Date(boleto.dataVencimento.getTime() + (convenio.carenciaMulta || 0) * 24 * 60 * 60 * 1000))
        };
      }
    }

    if (dto.dispensarMulta) {
      payloadAlteracao.indicadorDispensarMulta = 'S';
    }

    // Prazo para recebimento vencido
    if (dto.quantidadeDiasAceite !== undefined) {
      payloadAlteracao.indicadorAlterarPrazoBoletoVencido = 'S';
      payloadAlteracao.alteracaoPrazo = {
        quantidadeDiasAceite: dto.quantidadeDiasAceite
      };
    }

    // Alterar Seu Número
    if (dto.alteracaoSeuNumero) {
      payloadAlteracao.indicadorAlterarSeuNumero = 'S';
      payloadAlteracao.alteracaoSeuNumero = dto.alteracaoSeuNumero;
    }

    // Obter token
    const token = await this.authService.obterTokenDeAcesso(boleto.contaCorrenteId);

    // Salvar dados antes da alteração
    const dadosAntes = { ...boleto };

    try {
      const config = getBBAPIConfigByEnvironment('COBRANCA');
      const apiClient = createCobrancaApiClient(credenciais.developerAppKey);

      const response = await apiClient.patch(`/boletos/${nossoNumero}`, payloadAlteracao, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          'gw-dev-app-key': credenciais.developerAppKey
        }
      });

      // Atualizar registro local
      const dadosAtualizacao: any = {
        responsePayloadBanco: response.data as any,
        usuarioAlteracaoId: usuarioId
      };

      if (dto.novaDataVencimento) {
        dadosAtualizacao.dataVencimento = new Date(dto.novaDataVencimento);
      }

      if (dto.novoValorNominal) {
        dadosAtualizacao.valorOriginal = dto.novoValorNominal;
      }

      if (dto.alteracaoSeuNumero) {
        dadosAtualizacao.numeroTituloBeneficiario = dto.alteracaoSeuNumero;
      }

      await this.prisma.boleto.update({
        where: { id: boleto.id },
        data: dadosAtualizacao
      });

      // Criar log
      const boletoAtualizado = await this.prisma.boleto.findUnique({
        where: { id: boleto.id }
      });

      await this.logService.criarLog(
        boleto.id,
        TipoOperacaoBoletoLog.ALTERACAO,
        'Boleto alterado via API',
        dadosAntes,
        boletoAtualizado,
        usuarioId,
        ipAddress
      );

      console.log(`✅ [ALTERAR-BOLETO] Boleto alterado com sucesso - Nosso Número: ${nossoNumero}, ID: ${boletoAtualizado!.id}, Usuário: ${usuarioId}`);
      return this.mapearBoletoParaResponse(boletoAtualizado!);

    } catch (error) {
      console.error(`❌ [ALTERAR-BOLETO] Erro ao alterar boleto - Nosso Número: ${nossoNumero}`, error.response?.data || error.message);

      await this.logService.criarLog(
        boleto.id,
        TipoOperacaoBoletoLog.ERRO_BB,
        'Erro ao alterar boleto no BB',
        dadosAntes,
        null,
        usuarioId,
        ipAddress,
        error.response?.data ? JSON.stringify(error.response.data) : error.message
      );

      if (error.response?.status === 401) {
        throw new BadRequestException('Token expirado. Tente novamente.');
      }

      if (error.response?.data?.erros) {
        throw new BadRequestException({
          message: 'Erro na API do Banco do Brasil',
          erros: error.response.data.erros
        });
      }

      throw new InternalServerErrorException(
        `Erro ao alterar boleto: ${error.message}`
      );
    }
  }

  /**
   * Baixa/Cancela um boleto
   * @param nossoNumero Nosso número do boleto
   * @param dto Dados da baixa
   * @param usuarioId ID do usuário
   * @param ipAddress IP do usuário
   * @returns Boleto baixado
   */
  async baixarBoleto(
    nossoNumero: string,
    dto: BaixarBoletoDto,
    usuarioId: number,
    ipAddress?: string
  ): Promise<BoletoResponseDto> {
    console.log(`🗑️ [BAIXAR-BOLETO] Iniciando baixa de boleto - Nosso Número: ${nossoNumero}, Usuário: ${usuarioId}`);
    
    // Buscar boleto
    const boleto = await this.prisma.boleto.findUnique({
      where: { nossoNumero: nossoNumero }
    });

    if (!boleto) {
      throw new NotFoundException(`Boleto ${nossoNumero} não encontrado`);
    }

    // Validar que está "em ser"
    if (boleto.statusBoleto !== StatusBoleto.ABERTO && boleto.statusBoleto !== StatusBoleto.PROCESSANDO) {
      throw new BadRequestException(
        `Boleto não pode ser baixado. Status atual: ${boleto.statusBoleto}`
      );
    }

    // Validar que passaram 30 minutos
    const dataEmissao = new Date(boleto.dataEmissao);
    const agora = new Date();
    const diffMinutos = Math.floor((agora.getTime() - dataEmissao.getTime()) / 60000);

    if (diffMinutos < 30) {
      throw new BadRequestException(
        `Boleto não pode ser baixado. É necessário aguardar 30 minutos após o registro (tempo decorrido: ${diffMinutos} minutos)`
      );
    }

    // Buscar credenciais
    const credenciais = await this.prisma.credenciaisAPI.findFirst({
      where: {
        banco: '001',
        contaCorrenteId: boleto.contaCorrenteId,
        modalidadeApi: '001 - Cobrança'
      }
    });

    if (!credenciais) {
      throw new NotFoundException('Credenciais de API não encontradas');
    }

    // Preparar payload
    const payload = {
      numeroConvenio: dto.numeroConvenio || boleto.numeroConvenio
    };

    // Obter token
    const token = await this.authService.obterTokenDeAcesso(boleto.contaCorrenteId);

    // Salvar dados antes
    const dadosAntes = { ...boleto };

    try {
      const config = getBBAPIConfigByEnvironment('COBRANCA');
      const apiClient = createCobrancaApiClient(credenciais.developerAppKey);

      const response = await apiClient.post(`/boletos/${nossoNumero}/baixar`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          'gw-dev-app-key': credenciais.developerAppKey
        }
      });

      // Atualizar registro local
      await this.prisma.boleto.update({
        where: { id: boleto.id },
        data: {
          statusBoleto: StatusBoleto.BAIXADO,
          dataBaixa: new Date(),
          usuarioBaixaId: usuarioId,
          responsePayloadBanco: response.data as any
        }
      });

      // Criar log
      const boletoAtualizado = await this.prisma.boleto.findUnique({
        where: { id: boleto.id }
      });

      await this.logService.criarLog(
        boleto.id,
        TipoOperacaoBoletoLog.BAIXA,
        'Boleto baixado/cancelado via API',
        dadosAntes,
        boletoAtualizado,
        usuarioId,
        ipAddress
      );

      console.log(`✅ [BAIXAR-BOLETO] Boleto baixado com sucesso - Nosso Número: ${nossoNumero}, ID: ${boletoAtualizado!.id}, Valor: R$ ${boletoAtualizado!.valorOriginal}, Pedido: ${boletoAtualizado!.pedidoId}, Usuário: ${usuarioId}`);
      return this.mapearBoletoParaResponse(boletoAtualizado!);

    } catch (error) {
      console.error(`❌ [BAIXAR-BOLETO] Erro ao baixar boleto - Nosso Número: ${nossoNumero}`, error.response?.data || error.message);

      // Verificar se já está baixado
      if (error.response?.data?.errors) {
        const erro = error.response.data.errors[0];
        if (erro?.message?.includes('baixado') || erro?.message?.includes('cancelado')) {
          // Atualizar status local mesmo que a API retorne erro
          await this.prisma.boleto.update({
            where: { id: boleto.id },
            data: {
              statusBoleto: StatusBoleto.BAIXADO,
              dataBaixa: new Date(),
              usuarioBaixaId: usuarioId
            }
          });

          const boletoAtualizado = await this.prisma.boleto.findUnique({
            where: { id: boleto.id }
          });

          return this.mapearBoletoParaResponse(boletoAtualizado!);
        }
      }

      await this.logService.criarLog(
        boleto.id,
        TipoOperacaoBoletoLog.ERRO_BB,
        'Erro ao baixar boleto no BB',
        dadosAntes,
        null,
        usuarioId,
        ipAddress,
        error.response?.data ? JSON.stringify(error.response.data) : error.message
      );

      if (error.response?.status === 401) {
        throw new BadRequestException('Token expirado. Tente novamente.');
      }

      if (error.response?.data?.errors) {
        throw new BadRequestException({
          message: 'Erro na API do Banco do Brasil',
          erros: error.response.data.errors
        });
      }

      throw new InternalServerErrorException(
        `Erro ao baixar boleto: ${error.message}`
      );
    }
  }

  /**
   * Consulta baixas operacionais
   * @param dto Filtros para consulta
   * @param contaCorrenteId ID da conta corrente
   * @returns Lista de baixas operacionais
   */
  async consultarBaixaOperacional(
    dto: BaixaOperacionalDto,
    contaCorrenteId: number
  ): Promise<any> {
    // Buscar credenciais
    const credenciais = await this.prisma.credenciaisAPI.findFirst({
      where: {
        banco: '001',
        contaCorrenteId: contaCorrenteId,
        modalidadeApi: '001 - Cobrança'
      },
      include: {
        contaCorrente: true
      }
    });

    if (!credenciais) {
      // Buscar conta corrente para formatar mensagem de erro
      const contaCorrente = await this.prisma.contaCorrente.findUnique({
        where: { id: contaCorrenteId }
      });
      const contaInfo = contaCorrente 
        ? `${contaCorrente.agencia}/${contaCorrente.contaCorrente}`
        : contaCorrenteId.toString();
      throw new NotFoundException(
        `Credenciais de API de Cobrança não encontradas para a conta ${contaInfo}`
      );
    }

    // Obter token
    const token = await this.authService.obterTokenDeAcesso(contaCorrenteId);

    // Preparar parâmetros
    const params: any = {
      'gw-dev-app-key': credenciais.developerAppKey,
      agencia: dto.agencia,
      conta: dto.conta,
      carteira: dto.carteira,
      variacao: dto.variacao,
      dataInicioAgendamentoTitulo: dto.dataInicioAgendamentoTitulo,
      dataFimAgendamentoTitulo: dto.dataFimAgendamentoTitulo
    };

    if (dto.estadoBaixaTitulo) params.estadoBaixaTitulo = dto.estadoBaixaTitulo;
    if (dto.modalidadeTitulo) params.modalidadeTitulo = dto.modalidadeTitulo;
    if (dto.dataInicioVencimentoTitulo) params.dataInicioVencimentoTitulo = dto.dataInicioVencimentoTitulo;
    if (dto.dataFimVencimentoTitulo) params.dataFimVencimentoTitulo = dto.dataFimVencimentoTitulo;
    if (dto.dataInicioRegistroTitulo) params.dataInicioRegistroTitulo = dto.dataInicioRegistroTitulo;
    if (dto.dataFimRegistroTitulo) params.dataFimRegistroTitulo = dto.dataFimRegistroTitulo;
    if (dto.horarioInicioAgendamentoTitulo) params.horarioInicioAgendamentoTitulo = dto.horarioInicioAgendamentoTitulo;
    if (dto.horarioFimAgendamentoTitulo) params.horarioFimAgendamentoTitulo = dto.horarioFimAgendamentoTitulo;
    if (dto.idProximoTitulo) params.idProximoTitulo = dto.idProximoTitulo;

    try {
      const config = getBBAPIConfigByEnvironment('COBRANCA');
      const apiClient = createCobrancaApiClient(credenciais.developerAppKey);

      const response = await apiClient.get('/boletos-baixa-operacional', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params
      });

      const dados = response.data as any;

      // Processar e sincronizar com boletos locais
      if (dados.lista && Array.isArray(dados.lista)) {
        for (const item of dados.lista) {
          const titulo = (item as any).titulo;
          if (titulo && titulo.id) {
            // Buscar boleto local pelo nosso número
            const boleto = await this.prisma.boleto.findUnique({
              where: { nossoNumero: titulo.id }
            });

            if (boleto && boleto.statusBoleto !== StatusBoleto.PAGO) {
              // Atualizar status para PAGO
              await this.prisma.boleto.update({
                where: { id: boleto.id },
                data: {
                  statusBoleto: StatusBoleto.PAGO,
                  dataPagamento: titulo.agendamentoPagamento?.momento
                    ? new Date(titulo.agendamentoPagamento.momento)
                    : new Date(),
                  atualizadoPorWebhook: false // Atualizado via consulta, não webhook
                }
              });
            }
          }
        }
      }

      return dados;

    } catch (error) {
      console.error(`❌ [BAIXAR-BOLETO-OPERACIONAL] Erro ao consultar baixa operacional - Conta: ${contaCorrenteId}`, error.response?.data || error.message);

      if (error.response?.status === 404) {
        return {
          possuiMaisTitulos: 'N',
          lista: []
        };
      }

      throw new InternalServerErrorException(
        `Erro ao consultar baixa operacional: ${error.message}`
      );
    }
  }

  /**
   * Consulta retorno de movimento
   * @param convenioId ID do convênio
   * @param dto Dados da consulta
   * @param contaCorrenteId ID da conta corrente
   * @returns Movimentos de retorno
   */
  async consultarRetornoMovimento(
    convenioId: string,
    dto: RetornoMovimentoDto,
    contaCorrenteId: number
  ): Promise<any> {
    // Buscar credenciais
    const credenciais = await this.prisma.credenciaisAPI.findFirst({
      where: {
        banco: '001',
        contaCorrenteId: contaCorrenteId,
        modalidadeApi: '001 - Cobrança'
      },
      include: {
        contaCorrente: true
      }
    });

    if (!credenciais) {
      // Buscar conta corrente para formatar mensagem de erro
      const contaCorrente = await this.prisma.contaCorrente.findUnique({
        where: { id: contaCorrenteId }
      });
      const contaInfo = contaCorrente 
        ? `${contaCorrente.agencia}/${contaCorrente.contaCorrente}`
        : contaCorrenteId.toString();
      throw new NotFoundException(
        `Credenciais de API de Cobrança não encontradas para a conta ${contaInfo}`
      );
    }

    // Obter token
    const token = await this.authService.obterTokenDeAcesso(contaCorrenteId);

    // Preparar payload
    const payload: any = {
      dataMovimentoRetornoInicial: dto.dataMovimentoRetornoInicial,
      dataMovimentoRetornoFinal: dto.dataMovimentoRetornoFinal
    };

    if (dto.codigoPrefixoAgencia) payload.codigoPrefixoAgencia = dto.codigoPrefixoAgencia;
    if (dto.numeroContaCorrente) payload.numeroContaCorrente = dto.numeroContaCorrente;
    if (dto.numeroCarteiraCobranca) payload.numeroCarteiraCobranca = dto.numeroCarteiraCobranca;
    if (dto.numeroVariacaoCarteiraCobranca) payload.numeroVariacaoCarteiraCobranca = dto.numeroVariacaoCarteiraCobranca;
    if (dto.numeroRegistroPretendido) payload.numeroRegistroPretendido = dto.numeroRegistroPretendido;
    if (dto.quantidadeRegistroPretendido) payload.quantidadeRegistroPretendido = dto.quantidadeRegistroPretendido;

    try {
      const config = getBBAPIConfigByEnvironment('COBRANCA');
      const apiClient = createCobrancaApiClient(credenciais.developerAppKey);

      const response = await apiClient.post(`/convenios/${convenioId}/listar-retorno-movimento`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          'gw-dev-app-key': credenciais.developerAppKey
        }
      });

      // Processar movimentos e atualizar boletos locais
      // TODO: Implementar lógica de processamento de movimentos

      return response.data;

    } catch (error) {
      console.error(`❌ [LISTAR-RETORNO-MOVIMENTO] Erro ao consultar retorno de movimento - Conta: ${contaCorrenteId}`, error.response?.data || error.message);

      throw new InternalServerErrorException(
        `Erro ao consultar retorno de movimento: ${error.message}`
      );
    }
  }

  /**
   * Mapeia boleto do Prisma para DTO de resposta
   */
  private mapearBoletoParaResponse(boleto: any): BoletoResponseDto {
    return {
      id: boleto.id,
      pedidoId: boleto.pedidoId,
      convenioCobrancaId: boleto.convenioCobrancaId,
      contaCorrenteId: boleto.contaCorrenteId,
      valorOriginal: Number(boleto.valorOriginal),
      dataVencimento: boleto.dataVencimento,
      dataEmissao: boleto.dataEmissao,
      dataPagamento: boleto.dataPagamento,
      dataBaixa: boleto.dataBaixa,
      statusBoleto: boleto.statusBoleto,
      nossoNumero: boleto.nossoNumero,
      numeroTituloBeneficiario: boleto.numeroTituloBeneficiario,
      numeroTituloCliente: boleto.numeroTituloCliente,
      linhaDigitavel: boleto.linhaDigitavel,
      codigoBarras: boleto.codigoBarras,
      qrCodePix: boleto.qrCodePix,
      txidPix: boleto.txidPix,
      urlPix: boleto.urlPix,
      numeroConvenio: boleto.numeroConvenio,
      numeroCarteira: boleto.numeroCarteira,
      numeroVariacaoCarteira: boleto.numeroVariacaoCarteira,
      createdAt: boleto.createdAt,
      updatedAt: boleto.updatedAt
    };
  }

  /**
   * Mapeia boleto da resposta do BB para DTO de resposta
   */
  private mapearBoletoBBParaResponse(boletoBB: any): BoletoResponseDto {
    // Mapear campos do BB para o formato interno
    return {
      id: 0, // Não temos ID do BB
      pedidoId: 0, // Não temos no BB
      convenioCobrancaId: 0,
      contaCorrenteId: 0,
      valorOriginal: boletoBB.valorOriginal || 0,
      dataVencimento: boletoBB.dataVencimento ? new Date(boletoBB.dataVencimento) : new Date(),
      dataEmissao: boletoBB.dataEmissao ? new Date(boletoBB.dataEmissao) : new Date(),
      dataPagamento: boletoBB.dataPagamento ? new Date(boletoBB.dataPagamento) : null,
      dataBaixa: boletoBB.dataBaixa ? new Date(boletoBB.dataBaixa) : null,
      statusBoleto: this.mapearStatusBBParaLocal(boletoBB.codigoEstadoTituloCobranca) as StatusBoleto,
      nossoNumero: boletoBB.numero || boletoBB.numeroTituloCliente || boletoBB.nossoNumero || '',
      numeroTituloBeneficiario: boletoBB.numeroTituloBeneficiario || '',
      numeroTituloCliente: boletoBB.numeroTituloCliente || null,
      linhaDigitavel: boletoBB.linhaDigitavel || '',
      codigoBarras: boletoBB.codigoBarraNumerico || boletoBB.codigoBarras || '',
      qrCodePix: boletoBB.qrCode?.url || null,
      txidPix: boletoBB.qrCode?.txId || null,
      urlPix: boletoBB.qrCode?.emv || null,
      numeroConvenio: String(boletoBB.numeroConvenio || ''),
      numeroCarteira: String(boletoBB.numeroCarteira || ''),
      numeroVariacaoCarteira: String(boletoBB.numeroVariacaoCarteira || ''),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Processa o pagamento de um boleto
   * 
   * Método centralizado que processa o pagamento de um boleto, atualizando
   * o status, criando registros de pagamento e atualizando o pedido.
   * Usado tanto por webhooks quanto por verificação manual.
   * 
   * @param boletoId ID do boleto no banco local
   * @param dadosPagamento Dados do pagamento (data e payload do banco)
   * @param viaWebhook Flag indicando se o processamento veio via webhook
   * @param usuarioId ID do usuário (opcional, apenas para verificação manual)
   * @param ipAddress IP da requisição (opcional)
   * @returns Objeto com informações do processamento
   */
  async processarPagamentoBoleto(
    boletoId: number,
    dadosPagamento: { dataPagamento: Date; responsePayloadBanco: any },
    viaWebhook: boolean,
    usuarioId?: number,
    ipAddress?: string
  ): Promise<{ boleto: any; pagamentoCriado: boolean }> {
    // Buscar boleto local
    const boleto = await this.prisma.boleto.findUnique({
      where: { id: boletoId }
    });

    if (!boleto) {
      throw new NotFoundException(`Boleto ${boletoId} não encontrado`);
    }

    // Salvar dados antes da atualização
    const dadosAntes = { ...boleto };

    // Atualizar boleto local
    const atualizacaoBoleto: any = {
      statusBoleto: StatusBoleto.PAGO,
      dataPagamento: dadosPagamento.dataPagamento,
      responsePayloadBanco: dadosPagamento.responsePayloadBanco
    };

    if (viaWebhook) {
      atualizacaoBoleto.atualizadoPorWebhook = true;
      atualizacaoBoleto.dataWebhookPagamento = new Date();
      atualizacaoBoleto.ipAddressWebhook = ipAddress || null;
    } else {
      atualizacaoBoleto.atualizadoPorWebhook = false;
      atualizacaoBoleto.usuarioPagamentoId = usuarioId || null;
    }

    await this.prisma.boleto.update({
      where: { id: boleto.id },
      data: atualizacaoBoleto
    });

    // Criar log de auditoria
    const boletoAtualizado = await this.prisma.boleto.findUnique({
      where: { id: boleto.id }
    });

    const tipoOperacao = viaWebhook
      ? TipoOperacaoBoletoLog.PAGAMENTO_WEBHOOK
      : TipoOperacaoBoletoLog.PAGAMENTO_MANUAL;

    const descricaoOperacao = viaWebhook
      ? 'Boleto pago - atualizado via webhook do Banco do Brasil'
      : 'Boleto pago - atualizado via verificação manual';

    await this.logService.criarLog(
      boleto.id,
      tipoOperacao,
      descricaoOperacao,
      dadosAntes,
      boletoAtualizado,
      usuarioId || undefined,
      ipAddress
    );

    // Verificar se já existe PagamentosPedidos vinculado ao boleto
    const pagamentoExistente = await this.prisma.pagamentosPedidos.findFirst({
      where: { boletoId: boleto.id }
    });

    let pagamentoCriado = false;

    // Se não existir, criar PagamentosPedidos automaticamente
    if (!pagamentoExistente) {
      // Mapear contaCorrenteId para ContaDestino
      const contaDestino = this.mapearContaCorrenteParaContaDestino(boleto.contaCorrenteId);

      // Criar pagamento
      await this.prisma.pagamentosPedidos.create({
        data: {
          pedidoId: boleto.pedidoId,
          dataPagamento: dadosPagamento.dataPagamento,
          valorRecebido: Number(boleto.valorOriginal),
          metodoPagamento: MetodoPagamento.BOLETO,
          contaDestino: contaDestino,
          boletoId: boleto.id,
          observacoesPagamento: `Pagamento via boleto - Nosso Número: ${boleto.nossoNumero}`
        }
      });

      pagamentoCriado = true;

      // Recalcular valor recebido consolidado do pedido
      const pagamentos = await this.prisma.pagamentosPedidos.findMany({
        where: { pedidoId: boleto.pedidoId },
        select: { valorRecebido: true }
      });

      const valorRecebidoConsolidado = pagamentos.reduce((total, pagamento) => {
        return total + (pagamento.valorRecebido || 0);
      }, 0);

      // Atualizar status do pedido baseado no valor recebido
      const pedido = await this.prisma.pedido.findUnique({
        where: { id: boleto.pedidoId },
        select: { valorFinal: true, status: true }
      });

      if (pedido) {
        let novoStatus: StatusPedido;
        const valorRecebidoArredondado = Number(valorRecebidoConsolidado.toFixed(2));
        const valorFinalArredondado = Number((pedido.valorFinal || 0).toFixed(2));

        if (valorRecebidoArredondado >= valorFinalArredondado) {
          novoStatus = StatusPedido.PEDIDO_FINALIZADO;
        } else if (valorRecebidoArredondado > 0) {
          novoStatus = StatusPedido.PAGAMENTO_PARCIAL;
        } else {
          novoStatus = StatusPedido.AGUARDANDO_PAGAMENTO;
        }

        await this.prisma.pedido.update({
          where: { id: boleto.pedidoId },
          data: {
            valorRecebido: valorRecebidoConsolidado,
            status: novoStatus
          }
        });
      }
    }

    // Criar notificações para usuários elegíveis após processar pagamento com sucesso
    try {
      await this.criarNotificacoesPagamentoBoleto(boletoAtualizado, viaWebhook);
    } catch (error) {
      // Não propagar erro - notificações não devem interromper o processamento do pagamento
      console.error(`[PROCESSAR-PAGAMENTO] Erro ao criar notificações (não crítico):`, error.message || error);
    }

    return {
      boleto: boletoAtualizado,
      pagamentoCriado
    };
  }

  /**
   * Cria notificações para usuários elegíveis quando um boleto é pago
   * Segue o mesmo padrão do job de extratos para consistência
   */
  private async criarNotificacoesPagamentoBoleto(
    boleto: any,
    viaWebhook: boolean
  ): Promise<void> {
    try {
      // Buscar dados completos do boleto, pedido e cliente
      const boletoCompleto = await this.prisma.boleto.findUnique({
        where: { id: boleto.id },
        include: {
          pedido: {
            include: {
              cliente: {
                select: {
                  id: true,
                  nome: true,
                  cpf: true,
                  cnpj: true,
                }
              }
            }
          },
          contaCorrente: {
            select: {
              id: true,
              agencia: true,
              contaCorrente: true,
              bancoCodigo: true,
            }
          }
        }
      });

      if (!boletoCompleto || !boletoCompleto.pedido || !boletoCompleto.pedido.cliente) {
        console.warn(`[NOTIFICAÇÕES] Boleto ${boleto.id} não encontrado ou sem pedido/cliente. Notificação não criada.`);
        return;
      }

      const cliente = boletoCompleto.pedido.cliente;
      const pedido = boletoCompleto.pedido;
      const contaCorrente = boletoCompleto.contaCorrente;

      // Buscar usuários elegíveis (mesma lógica do job de extratos)
      const usuariosElegiveis = await this.prisma.usuario.findMany({
        where: {
          nivel: {
            in: ['ADMINISTRADOR', 'GERENTE_GERAL', 'ESCRITORIO'],
          },
        },
        select: {
          id: true,
          nome: true,
        },
      });

      if (usuariosElegiveis.length === 0) {
        console.log(`[NOTIFICAÇÕES] Nenhum usuário elegível encontrado para notificar sobre boleto ${boleto.id}`);
        return;
      }

      // Formatar dados para a notificação
      const nomeCliente = cliente.nome || 'Cliente não identificado';
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(Number(boletoCompleto.valorOriginal));
      const dataPagamento = boletoCompleto.dataPagamento 
        ? new Date(boletoCompleto.dataPagamento).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR');
      const nossoNumero = boletoCompleto.nossoNumero;
      const numeroPedido = pedido.numeroPedido || `Pedido #${pedido.id}`;
      const agencia = contaCorrente?.agencia || 'N/A';
      const conta = contaCorrente?.contaCorrente || 'N/A';
      const origemPagamento = viaWebhook ? 'Webhook Banco do Brasil' : 'Verificação Manual';

      // Gerar conteúdo simplificado para o menu
      const conteudoMenu = `Cliente: ${nomeCliente}\nPedido: ${numeroPedido}\nValor: ${valorFormatado}\nData: ${dataPagamento}`;

      // Gerar conteúdo completo para modal
      const conteudoCompleto = `Boleto Pago\n\n` +
        `Cliente: ${nomeCliente}\n` +
        `Documento: ${cliente.cpf || cliente.cnpj || 'Não informado'}\n` +
        `Pedido: ${numeroPedido}\n` +
        `Nosso Número: ${nossoNumero}\n` +
        `Valor: ${valorFormatado}\n` +
        `Data de Pagamento: ${dataPagamento}\n` +
        `Data de Vencimento: ${boletoCompleto.dataVencimento ? new Date(boletoCompleto.dataVencimento).toLocaleDateString('pt-BR') : 'N/A'}\n` +
        `Conta: ${agencia}/${conta}\n` +
        `Origem: ${origemPagamento}`;

      const titulo = 'Boleto pago';

      // Criar notificação para cada usuário elegível
      console.log(`[NOTIFICAÇÕES] [DEBUG] Criando notificações de boleto pago para ${usuariosElegiveis.length} usuário(s):`, {
        usuariosIds: usuariosElegiveis.map(u => u.id),
        usuariosNomes: usuariosElegiveis.map(u => u.nome),
        boletoId: boletoCompleto.id,
        nossoNumero,
        nomeCliente,
        valorFormatado,
      });

      const notificacoes = await Promise.all(
        usuariosElegiveis.map((usuario) => {
          console.log(`[NOTIFICAÇÕES] [DEBUG] Criando notificação de boleto para usuário ${usuario.id} (${usuario.nome})`);
          return this.notificacoesService.create(
            {
              titulo: titulo,
              conteudo: conteudoMenu,
              tipo: TipoNotificacao.BOLETO,
              prioridade: PrioridadeNotificacao.MEDIA,
              usuarioId: usuario.id,
              dadosAdicionais: {
                toast: {
                  titulo: titulo,
                  conteudo: `${nomeCliente} - ${numeroPedido} - ${valorFormatado}`,
                  tipo: 'success',
                },
                menu: {
                  titulo: titulo,
                  conteudo: conteudoMenu,
                },
                modal: {
                  titulo: titulo,
                  conteudo: conteudoCompleto,
                },
                // Dados adicionais do boleto
                boletoId: boletoCompleto.id,
                pedidoId: pedido.id,
                clienteId: cliente.id,
                clienteNome: nomeCliente,
                valor: boletoCompleto.valorOriginal,
                dataPagamento: boletoCompleto.dataPagamento,
                nossoNumero: nossoNumero,
                viaWebhook: viaWebhook,
                contaCorrenteId: contaCorrente?.id,
                // Flag para identificar que é pagamento de boleto
                tipoPagamentoBoleto: true,
              },
            },
            usuario.id
          ).then((notifCriada) => {
            console.log(`[NOTIFICAÇÕES] [DEBUG] Notificação de boleto criada para usuário ${usuario.id}:`, {
              notificacaoId: notifCriada?.id,
              tipo: notifCriada?.tipo,
              titulo: notifCriada?.titulo,
            });
            return notifCriada;
          }).catch((error) => {
            // Log erro individual sem interromper outras notificações
            console.error(
              `[NOTIFICAÇÕES] [DEBUG] Erro ao criar notificação de boleto pago para usuário ${usuario.id} (${usuario.nome}):`,
              error
            );
            return null;
          });
        })
      );

      // Filtrar notificações nulas (erros)
      const notificacoesCriadas = notificacoes.filter(n => n !== null);
      console.log(`[NOTIFICAÇÕES] ${notificacoesCriadas.length} notificação(ões) criada(s) para boleto ${nossoNumero} (${nomeCliente})`);

    } catch (error) {
      console.error(`[NOTIFICAÇÕES] Erro ao criar notificações de boleto pago:`, error.message || error);
      // Não propagar erro - notificações não devem interromper o processamento do pagamento
    }
  }

  /**
   * Mapeia contaCorrenteId para ContaDestino
   * TODO: Implementar mapeamento adequado baseado em configuração ou tabela de mapeamento
   * Por enquanto, usando ALENCAR como padrão
   */
  private mapearContaCorrenteParaContaDestino(contaCorrenteId: number): ContaDestino {
    // TODO: Implementar mapeamento adequado
    // Por enquanto, usando ALENCAR como padrão
    // Futuramente, pode-se usar uma tabela de configuração ou campo na tabela ContaCorrente
    return ContaDestino.ALENCAR;
  }

  /**
   * Verifica o status de um boleto no Banco do Brasil manualmente
   * 
   * Consulta o status do boleto no BB e, se estiver pago, processa o pagamento
   * da mesma forma que o webhook faria.
   * 
   * @param nossoNumero Nosso número do boleto
   * @param contaCorrenteId ID da conta corrente
   * @param usuarioId ID do usuário que está verificando
   * @param ipAddress IP da requisição (opcional)
   * @returns Boleto atualizado
   */
  async verificarStatusBoletoManual(
    nossoNumero: string,
    contaCorrenteId: number,
    usuarioId: number,
    ipAddress?: string
  ): Promise<BoletoResponseDto> {
    console.log(`🔍 [VERIFICAR-STATUS] Iniciando verificação manual - Nosso Número: ${nossoNumero}, Usuário: ${usuarioId}`);

    // Buscar boleto local
    const boleto = await this.prisma.boleto.findUnique({
      where: { nossoNumero: nossoNumero }
    });

    if (!boleto) {
      throw new NotFoundException(`Boleto ${nossoNumero} não encontrado no sistema local`);
    }

    // Validar que boleto está em estado consultável
    if (boleto.statusBoleto === StatusBoleto.BAIXADO) {
      throw new BadRequestException('Boleto baixado não pode ser verificado');
    }

    // Buscar credenciais
    const credenciais = await this.prisma.credenciaisAPI.findFirst({
      where: {
        banco: '001',
        contaCorrenteId: contaCorrenteId,
        modalidadeApi: '001 - Cobrança'
      },
      include: {
        contaCorrente: true
      }
    });

    if (!credenciais) {
      const contaCorrente = await this.prisma.contaCorrente.findUnique({
        where: { id: contaCorrenteId }
      });
      const contaInfo = contaCorrente
        ? `${contaCorrente.agencia}/${contaCorrente.contaCorrente}`
        : contaCorrenteId.toString();
      throw new NotFoundException(
        `Credenciais de API de Cobrança não encontradas para a conta ${contaInfo}`
      );
    }

    // Obter token
    const token = await this.authService.obterTokenDeAcesso(contaCorrenteId);

    // Consultar no BB
    try {
      const config = getBBAPIConfigByEnvironment('COBRANCA');
      const apiClient = createCobrancaApiClient(credenciais.developerAppKey);

      const response = await apiClient.get(`/boletos/${nossoNumero}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          'gw-dev-app-key': credenciais.developerAppKey,
          numeroConvenio: boleto.numeroConvenio
        }
      });

      const dadosBB = response.data as any;

      // Logar JSON do BB para debug
      console.log(`📋 [VERIFICAR-STATUS] Resposta do Banco do Brasil para boleto ${nossoNumero}:`, JSON.stringify(dadosBB, null, 2));

      // Mapear status retornado pelo BB
      // O campo correto é codigoEstadoTituloCobranca (número), não situacao ou status
      const statusBB = this.mapearStatusBBParaLocal(dadosBB.codigoEstadoTituloCobranca);

      // Se status for PAGO e boleto local ainda não está como PAGO, processar pagamento
      if (statusBB === StatusBoleto.PAGO && boleto.statusBoleto !== StatusBoleto.PAGO) {
        console.log(`✅ [VERIFICAR-STATUS] Boleto ${nossoNumero} está PAGO no BB, processando pagamento...`);

        // Extrair data de pagamento do payload do BB
        // Campos possíveis: dataRecebimentoTitulo (formato dd.mm.aaaa) ou dataCreditoLiquidacao (formato dd.mm.aaaa)
        // Nota: esses campos podem vir vazios ("") quando o boleto não foi pago
        let dataPagamento = new Date();
        
        if (dadosBB.dataRecebimentoTitulo && dadosBB.dataRecebimentoTitulo.trim() !== '') {
          // Formato: "dd.mm.aaaa" -> converter para Date
          const [dia, mes, ano] = dadosBB.dataRecebimentoTitulo.split('.');
          if (dia && mes && ano) {
            dataPagamento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
          }
        } else if (dadosBB.dataCreditoLiquidacao && dadosBB.dataCreditoLiquidacao.trim() !== '') {
          // Formato: "dd.mm.aaaa" -> converter para Date
          const [dia, mes, ano] = dadosBB.dataCreditoLiquidacao.split('.');
          if (dia && mes && ano) {
            dataPagamento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
          }
        } else if (dadosBB.dataPagamento) {
          dataPagamento = new Date(dadosBB.dataPagamento);
        } else if (dadosBB.agendamentoPagamento?.momento) {
          dataPagamento = new Date(dadosBB.agendamentoPagamento.momento);
        }

        // Processar pagamento usando método centralizado
        await this.processarPagamentoBoleto(
          boleto.id,
          {
            dataPagamento,
            responsePayloadBanco: dadosBB
          },
          false, // viaWebhook = false (verificação manual)
          usuarioId,
          ipAddress
        );

        console.log(`✅ [VERIFICAR-STATUS] Pagamento processado com sucesso para boleto ${nossoNumero}`);
      } else {
        // Atualizar apenas status local se necessário (sem processar pagamento)
        if (statusBB !== boleto.statusBoleto) {
          await this.prisma.boleto.update({
            where: { id: boleto.id },
            data: {
              statusBoleto: statusBB,
              responsePayloadBanco: dadosBB
            }
          });

          console.log(`✅ [VERIFICAR-STATUS] Status do boleto ${nossoNumero} atualizado para ${statusBB}`);
        } else {
          // Apenas atualizar payload do banco
          await this.prisma.boleto.update({
            where: { id: boleto.id },
            data: {
              responsePayloadBanco: dadosBB
            }
          });

          console.log(`✅ [VERIFICAR-STATUS] Boleto ${nossoNumero} mantém status ${statusBB}`);
        }
      }

      // Retornar boleto atualizado
      const boletoAtualizado = await this.prisma.boleto.findUnique({
        where: { id: boleto.id }
      });

      return this.mapearBoletoParaResponse(boletoAtualizado!);

    } catch (error) {
      console.error(`❌ [VERIFICAR-STATUS] Erro ao verificar status do boleto - Nosso Número: ${nossoNumero}`, error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new NotFoundException('Boleto não encontrado no Banco do Brasil');
      }

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao verificar status do boleto: ${error.message}`
      );
    }
  }

  /**
   * Mapeia status do BB para status local
   * 
   * O BB retorna codigoEstadoTituloCobranca (número):
   * 1 - NORMAL (ABERTO)
   * 2 - MOVIMENTO CARTORIO
   * 3 - EM CARTORIO
   * 4 - TITULO COM OCORRENCIA DE CARTORIO
   * 5 - PROTESTADO ELETRONICO
   * 6 - LIQUIDADO (PAGO)
   * 7 - BAIXADO
   * 8 - TITULO COM PENDENCIA DE CARTORIO
   * 9 - TITULO PROTESTADO MANUAL
   * 10 - TITULO BAIXADO/PAGO EM CARTORIO
   * 11 - TITULO LIQUIDADO/PROTESTADO
   * 12 - TITULO LIQUID/PGCRTO
   * 13 - TITULO PROTESTADO AGUARDANDO BAIXA
   * 18 - PAGO PARCIALMENTE
   */
  private mapearStatusBBParaLocal(statusBB: string | number): StatusBoleto {
    // Converter para número se for string
    const codigoStatus = typeof statusBB === 'string' ? parseInt(statusBB) : statusBB;

    // Se não for um número válido, tratar como string (compatibilidade com outros formatos)
    if (isNaN(codigoStatus)) {
      const statusUpper = String(statusBB).toUpperCase();
      if (statusUpper.includes('LIQUIDADO') || statusUpper.includes('PAGO')) {
        return StatusBoleto.PAGO;
      }
      if (statusUpper.includes('BAIXADO') || statusUpper.includes('CANCELADO')) {
        return StatusBoleto.BAIXADO;
      }
      if (statusUpper.includes('VENCIDO')) {
        return StatusBoleto.VENCIDO;
      }
      if (statusUpper.includes('ERRO')) {
        return StatusBoleto.ERRO;
      }
      return StatusBoleto.ABERTO;
    }

    // Mapear códigos numéricos do BB
    switch (codigoStatus) {
      case 1: // NORMAL
        return StatusBoleto.ABERTO;
      case 6: // LIQUIDADO
        return StatusBoleto.PAGO;
      case 7: // BAIXADO
        return StatusBoleto.BAIXADO;
      case 10: // TITULO BAIXADO/PAGO EM CARTORIO
      case 11: // TITULO LIQUIDADO/PROTESTADO
      case 12: // TITULO LIQUID/PGCRTO
        return StatusBoleto.PAGO;
      case 18: // PAGO PARCIALMENTE
        return StatusBoleto.PAGO; // Consideramos parcial como pago
      default:
        // Outros códigos (cartório, protesto, etc.) mantêm como ABERTO
        return StatusBoleto.ABERTO;
    }
  }
}
