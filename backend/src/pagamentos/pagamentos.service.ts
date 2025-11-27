import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, forwardRef, Inject } from '@nestjs/common';
import { CredenciaisAPIService } from '../credenciais-api/credenciais-api.service';
import { ContaCorrenteService } from '../conta-corrente/conta-corrente.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  TipoPagamentoApi,
  StatusPagamentoLote,
  StatusPagamentoItem,
  StatusFuncionarioPagamento,
  Prisma,
} from '@prisma/client';
import { createPagamentosApiClient, createPagamentosAuthClient, BB_PAGAMENTOS_API_URLS } from '../utils/bb-pagamentos-client';
import {
  SolicitarTransferenciaPixDto,
  SolicitarPagamentoBoletoDto,
  SolicitarPagamentoGuiaDto,
  ConsultarStatusSolicitacaoDto,
  RespostaTransferenciaPixDto,
  RespostaPagamentoBoletoDto,
  RespostaPagamentoGuiaDto,
  LiberarPagamentosDto,
  CancelarPagamentosDto,
} from './dto/pagamentos.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { PagamentosSyncQueueService } from './pagamentos-sync-queue.service';

/**
 * Service para integração com a API de Pagamentos do Banco do Brasil
 * Implementa autenticação OAuth2, cache de token e operações de pagamento
 */
@Injectable()
export class PagamentosService {
  // Cache de token em memória por credencial + escopos (chave: "credencialId:escopos")
  private cachedTokens: Map<string, { token: string; expiry: Date }> = new Map();

  // Scopes específicos por operação (solicitar apenas os necessários)
  // Tentando apenas o escopo essencial primeiro para evitar erro de escopos não autorizados
  private readonly SCOPES_PIX_REQUISICAO = 'pagamentos-lote.transferencias-pix-requisicao';
  private readonly SCOPES_PIX_INFO = 'pagamentos-lote.transferencias-pix-info pagamentos-lote.pix-info';
  private readonly SCOPES_BOLETO_REQUISICAO = 'pagamentos-lote.boletos-requisicao pagamentos-lote.boletos-info pagamentos-lote.lotes-info';
  private readonly SCOPES_BOLETO_INFO = 'pagamentos-lote.boletos-info pagamentos-lote.lotes-info';
  private readonly ITEM_ESTADOS_PENDENTES = new Set([
    'PENDENTE',
    'CONSISTENTE',
    'AGENDADO',
    'AGUARDANDO DEBITO',
    'DEBITADO',
  ]);
  private readonly ITEM_ESTADOS_SUCESSO = new Set(['PAGO']);
  private readonly ITEM_ESTADOS_CANCELADO = new Set(['CANCELADO', 'DEVOLVIDO']);
  private readonly ITEM_ESTADOS_REJEITADO = new Set([
    'REJEITADO',
    'INCONSISTENTE',
    'VENCIDO',
  ]);
  private readonly SCOPES_GUIA_REQUISICAO = 'pagamentos-lote.guias-codigo-barras-requisicao pagamentos-lote.guias-codigo-barras-info pagamentos-lote.lotes-info';
  private readonly SCOPES_GUIA_INFO = 'pagamentos-lote.guias-codigo-barras-info pagamentos-lote.lotes-info';
  private readonly SCOPES_LIBERAR = 'pagamentos-lote.lotes-requisicao pagamentos-lote.lotes-info';
  private readonly SCOPES_CANCELAR = 'pagamentos-lote.cancelar-requisicao pagamentos-lote.lotes-info';

  constructor(
    private readonly credenciaisAPIService: CredenciaisAPIService,
    private readonly contaCorrenteService: ContaCorrenteService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificacoesService))
    private readonly notificacoesService: NotificacoesService,
    private readonly pagamentosSyncQueueService: PagamentosSyncQueueService,
  ) {}

  /**
   * Normaliza o dígito verificador da conta corrente para envio ao BB
   * O BB não aceita "0" como dígito válido, então converte para "X"
   * @param digito Dígito da conta corrente (pode ser null, undefined, string vazia, "0", ou outro valor)
   * @returns Dígito normalizado ("X" se for null, undefined, vazio ou "0", caso contrário retorna o próprio valor)
   */
  private normalizarDigitoConta(digito: string | null | undefined): string {
    // Se for null, undefined, string vazia ou "0", retorna "X"
    if (!digito || digito.trim() === '' || digito === '0') {
      return 'X';
    }
    // Caso contrário, retorna o dígito original
    return digito;
  }

  /**
   * Libera um lote de pagamentos previamente enviado (liberar-pagamentos)
   * Não é chamada automaticamente após o envio; deve ser acionada explicitamente (ex: via mobile/admin).
   *
   * @param dto Dados para liberação (numeroRequisicao e indicadorFloat)
   * @param usuarioId ID do usuário que está realizando a liberação
   */
  async liberarPagamentos(dto: LiberarPagamentosDto, usuarioId?: number): Promise<any> {
    const { numeroRequisicao, indicadorFloat } = dto;

    try {
      // Buscar lote no banco para descobrir conta utilizada
      const lote = await this.prisma.pagamentoApiLote.findUnique({
        where: { numeroRequisicao },
      });

      if (!lote) {
        throw new NotFoundException(
          `Lote com numeroRequisicao ${numeroRequisicao} não encontrado.`
        );
      }

      // Buscar conta corrente vinculada ao lote
      const contaCorrente = await this.contaCorrenteService.findOne(
        lote.contaCorrenteId,
      );

      if (!contaCorrente) {
        throw new NotFoundException(
          `Conta corrente ID ${lote.contaCorrenteId} não encontrada para o lote ${numeroRequisicao}.`,
        );
      }

      // Buscar credencial de pagamentos para esta conta
      const credenciaisPagamentos =
        await this.credenciaisAPIService.findByBancoAndModalidade(
          '001',
          '004 - Pagamentos',
        );

      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException(
          'Credencial de pagamentos não cadastrada. Favor cadastrar as credenciais de pagamentos.',
        );
      }

      const credencialPagamento = credenciaisPagamentos.find(
        (c) => c.contaCorrenteId === contaCorrente.id,
      );

      if (!credencialPagamento) {
        throw new NotFoundException(
          `Credenciais de pagamentos não encontradas para a conta ${contaCorrente.contaCorrente} da agência ${contaCorrente.agencia}. Configure as credenciais para esta conta primeiro.`,
        );
      }

      // Obter token de acesso com escopos para liberação
      const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_LIBERAR);

      // Criar cliente HTTP para API de pagamentos
      const apiClient = createPagamentosApiClient(
        credencialPagamento.developerAppKey,
      );

      // Usar numeroRequisicao e indicadorFloat reais (produção)
      const payloadBB = {
        numeroRequisicao,
        indicadorFloat,
      };

      console.log(
        '🌐 [PAGAMENTOS-SERVICE] Enviando liberação de pagamentos para API BB: POST /liberar-pagamentos',
      );
      console.log(
        '📤 [PAGAMENTOS-SERVICE] PAYLOAD LIBERAÇÃO ENVIADO AO BB:',
        JSON.stringify(payloadBB, null, 2),
      );

      const response = await apiClient.post('/liberar-pagamentos', payloadBB, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        '✅ [PAGAMENTOS-SERVICE] RESPOSTA LIBERAÇÃO DA API BB:',
        JSON.stringify(
          {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
          },
          null,
          2,
        ),
      );

      // Verificar se a liberação foi bem-sucedida
      const respostaData = response.data as any;
      const mensagemRetorno = respostaData?.mensagemRetorno || '';
      const liberacaoSucesso = mensagemRetorno.toLowerCase().includes('liberação efetuada com sucesso');

      // Registrar a liberação nas observações / payloadRespostaAtual e rastrear usuário
      const dataLiberacao = new Date();
      
      // Se liberação foi bem-sucedida, atualizar estadoRequisicao para 9 (Liberada)
      // Isso evita liberação duplicada até o webhook chegar e atualizar o estado real
      const estadoRequisicaoAtualizar = liberacaoSucesso ? 9 : lote.estadoRequisicaoAtual || lote.estadoRequisicao;
      const statusAtualizar = liberacaoSucesso 
        ? this.mapearStatusLote(9) // Estado 9 = Liberada
        : lote.status;

      await this.prisma.pagamentoApiLote.update({
        where: { id: lote.id },
        data: {
          observacoes: [
            lote.observacoes || '',
            `Liberação de pagamentos realizada em ${dataLiberacao.toISOString()} (indicadorFloat=${indicadorFloat})${liberacaoSucesso ? ' - Liberação confirmada pelo BB' : ''}`,
          ]
            .filter(Boolean)
            .join(' | '),
          payloadRespostaAtual: respostaData,
          ultimaAtualizacaoWebhook: dataLiberacao,
          estadoRequisicaoAtual: estadoRequisicaoAtualizar,
          status: statusAtualizar,
          usuarioLiberacaoId: usuarioId || null,
          dataLiberacao: usuarioId ? dataLiberacao : null,
        },
      });

      if (liberacaoSucesso) {
        console.log(`✅ [PAGAMENTOS-SERVICE] Lote ${numeroRequisicao} marcado como liberado (estadoRequisicao=9) após confirmação do BB`);
      }

        await this.pagamentosSyncQueueService.scheduleLoteSync({
          numeroRequisicao,
          contaCorrenteId: contaCorrente.id,
          loteId: lote.id,
          delayMinutes: liberacaoSucesso ? this.pagamentosSyncQueueService.getDefaultDelayMinutes() : undefined,
        });

      if (liberacaoSucesso) {
        const itensParaMonitorar = await this.prisma.pagamentoApiItem.findMany({
          where: {
            loteId: lote.id,
            identificadorPagamento: {
              not: null,
            },
          },
          select: {
            identificadorPagamento: true,
          },
        });

        for (const item of itensParaMonitorar) {
          await this.pagamentosSyncQueueService.scheduleItemSync({
            identificadorPagamento: item.identificadorPagamento,
            contaCorrenteId: contaCorrente.id,
            loteId: lote.id,
            delayMinutes: 0,
          });
        }
      }

      return response.data;
    } catch (error) {
      console.error(
        '❌ [PAGAMENTOS-SERVICE] Erro ao liberar pagamentos:',
        error?.message || error,
      );

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      if (error.response?.data) {
        throw new InternalServerErrorException(
          `Erro na API de liberação de pagamentos: ${
            error.response.data.message ||
            error.response.data.error ||
            'Erro desconhecido'
          }`,
        );
      }

      throw new InternalServerErrorException(
        'Erro ao liberar pagamentos na API do Banco do Brasil',
      );
    }
  }

  /**
   * Cancela pagamentos específicos (cancelar-pagamentos)
   * Implementado para ficar pronto, mas uso não é obrigatório no fluxo atual.
   *
   * @param dto Dados para cancelamento (contaCorrenteId e listaCodigosPagamento)
   * @param usuarioId ID do usuário que está realizando o cancelamento
   */
  async cancelarPagamentos(dto: CancelarPagamentosDto, usuarioId?: number): Promise<any> {
    const { contaCorrenteId, listaCodigosPagamento } = dto;

    try {
      // Buscar conta corrente
      const contaCorrente = await this.contaCorrenteService.findOne(
        contaCorrenteId,
      );

      if (!contaCorrente) {
        throw new NotFoundException(
          `Conta corrente ID ${contaCorrenteId} não encontrada.`,
        );
      }

      // Buscar credencial de pagamentos
      const credenciaisPagamentos =
        await this.credenciaisAPIService.findByBancoAndModalidade(
          '001',
          '004 - Pagamentos',
        );

      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException(
          'Credencial de pagamentos não cadastrada. Favor cadastrar as credenciais de pagamentos.',
        );
      }

      const credencialPagamento = credenciaisPagamentos.find(
        (c) => c.contaCorrenteId === contaCorrente.id,
      );

      if (!credencialPagamento) {
        throw new NotFoundException(
          `Credenciais de pagamentos não encontradas para a conta ${contaCorrente.contaCorrente} da agência ${contaCorrente.agencia}. Configure as credenciais para esta conta primeiro.`,
        );
      }

      // Validar se a conta possui número de contrato de pagamentos configurado
      if (
        contaCorrente.numeroContratoPagamento === null ||
        contaCorrente.numeroContratoPagamento === undefined
      ) {
        throw new BadRequestException(
          `A conta corrente ID ${contaCorrente.id} não possui número de contrato de pagamentos configurado. ` +
          `Cadastre o número do contrato de pagamentos (Convênio PGT) para esta conta nas configurações antes de cancelar pagamentos.`
        );
      }

      // Montar payload - numeroContratoPagamento é opcional na documentação, mas vamos enviar sempre
      // IMPORTANTE: Garantir que codigoPagamento seja sempre string (BB pode ser sensível ao tipo)
      const payloadBB: any = {
        numeroContratoPagamento: contaCorrente.numeroContratoPagamento,
        agenciaDebito: contaCorrente.agencia.toString(),
        contaCorrenteDebito: contaCorrente.contaCorrente.toString(),
        digitoVerificadorContaCorrente: this.normalizarDigitoConta(contaCorrente.contaCorrenteDigito),
        listaPagamentos: listaCodigosPagamento.map((codigoPagamento) => ({
          codigoPagamento: codigoPagamento?.toString() || String(codigoPagamento),
        })),
      };

      // Obter token de acesso com escopos para cancelamento
      // IMPORTANTE: Cada conta tem sua própria credencial, então o cache é por credencialId + escopos
      // Não há risco de usar token de outra conta, pois cada credencial tem ID único
      console.log(
        `🔑 [PAGAMENTOS-SERVICE] Usando credencial ID ${credencialPagamento.id} para conta ${contaCorrente.agencia}/${contaCorrente.contaCorrente}`,
      );
      const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_CANCELAR);
      const apiClient = createPagamentosApiClient(
        credencialPagamento.developerAppKey,
      );

      console.log(
        '🌐 [PAGAMENTOS-SERVICE] Enviando cancelamento de pagamentos para API BB: POST /cancelar-pagamentos',
      );
      console.log(
        '📋 [PAGAMENTOS-SERVICE] Códigos de pagamento recebidos para cancelamento:',
        listaCodigosPagamento,
      );
      console.log(
        '📋 [PAGAMENTOS-SERVICE] Detalhes dos códigos (tipo e valor):',
        listaCodigosPagamento.map(c => ({
          valor: c,
          tipo: typeof c,
          length: c?.toString().length,
        })),
      );
      console.log(
        '📤 [PAGAMENTOS-SERVICE] PAYLOAD CANCELAMENTO ENVIADO AO BB:',
        JSON.stringify(payloadBB, null, 2),
      );
      console.log(
        '🔍 [PAGAMENTOS-SERVICE] Detalhes do payload (tipos):',
        {
          agenciaDebito: { valor: payloadBB.agenciaDebito, tipo: typeof payloadBB.agenciaDebito },
          contaCorrenteDebito: { valor: payloadBB.contaCorrenteDebito, tipo: typeof payloadBB.contaCorrenteDebito },
          digitoVerificadorContaCorrente: { valor: payloadBB.digitoVerificadorContaCorrente, tipo: typeof payloadBB.digitoVerificadorContaCorrente },
          listaPagamentos: payloadBB.listaPagamentos.map((p: any) => ({
            codigoPagamento: { valor: p.codigoPagamento, tipo: typeof p.codigoPagamento },
          })),
        },
      );

      const response = await apiClient.post('/cancelar-pagamentos', payloadBB, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        '✅ [PAGAMENTOS-SERVICE] RESPOSTA CANCELAMENTO DA API BB:',
        JSON.stringify(
          {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
          },
          null,
          2,
        ),
      );

      // Verificar se o cancelamento foi aceito
      const responseData = response.data as any;
      const cancelamentosAceitos = responseData?.pagamentos?.filter(
        (p: any) => p.indicadorCancelamento === 'S'
      ) || [];
      const cancelamentosRejeitados = responseData?.pagamentos?.filter(
        (p: any) => p.indicadorCancelamento === 'N'
      ) || [];

      console.log(`✅ [PAGAMENTOS-SERVICE] Cancelamentos aceitos: ${cancelamentosAceitos.length}`);
      console.log(`❌ [PAGAMENTOS-SERVICE] Cancelamentos rejeitados: ${cancelamentosRejeitados.length}`);
      console.log(`👤 [PAGAMENTOS-SERVICE] Usuário que está cancelando: ID ${usuarioId || 'N/A'}`);
      
      if (cancelamentosRejeitados.length > 0) {
        console.log('⚠️ [PAGAMENTOS-SERVICE] Motivos de rejeição:');
        cancelamentosRejeitados.forEach((p: any) => {
          console.log(`  - Código ${p.codigoPagamento}: ${p.estadoCancelamento || 'Sem motivo informado'}`);
        });
        console.log('ℹ️ [PAGAMENTOS-SERVICE] Cancelamentos rejeitados não serão processados. Aguarde o processamento do pagamento pelo BB antes de tentar cancelar novamente.');
      }

      // Se não há cancelamentos aceitos, não há nada para processar
      if (cancelamentosAceitos.length === 0) {
        console.log('ℹ️ [PAGAMENTOS-SERVICE] Nenhum cancelamento foi aceito pelo BB. Nenhuma atualização será realizada no banco de dados.');
        return response.data;
      }

      // Reverter status das colheitas vinculadas aos pagamentos cancelados
      // Buscar itens de pagamento pelos códigos de pagamento (todos são String)
      const itensPagamento = await this.prisma.pagamentoApiItem.findMany({
        where: {
          OR: [
            { codigoPagamento: { in: listaCodigosPagamento } },
            { codigoIdentificadorPagamento: { in: listaCodigosPagamento } },
            { identificadorPagamento: { in: listaCodigosPagamento } },
          ],
        },
        include: {
          lote: {
            select: {
              id: true,
              numeroRequisicao: true,
            },
          },
          colheitas: {
            select: {
              turmaColheitaCustoId: true,
            },
          },
        },
      });

      console.log(`🔄 [PAGAMENTOS-SERVICE] Encontrados ${itensPagamento.length} item(ns) de pagamento no banco para processar cancelamento`);
      
      // Log detalhado dos itens encontrados
      if (itensPagamento.length > 0) {
        itensPagamento.forEach((item) => {
          console.log(`  - Item ID ${item.id}: identificadorPagamento=${item.identificadorPagamento}, codigoIdentificadorPagamento=${item.codigoIdentificadorPagamento}, codigoPagamento=${item.codigoPagamento}`);
        });
      }

      // Rastrear usuário e data de cancelamento nos itens cancelados
      // Atualizar status dos itens para CANCELADO
      const dataCancelamento = new Date();
      // O transformResponse já preserva codigoPagamento como string quando é número grande
      // Garantir que sempre seja string para comparação exata
      const codigosCancelados = cancelamentosAceitos.map((p: any) => {
        // Se já for string (preservado pelo transformResponse), usar diretamente
        // Se for número, converter para string
        const codigo = String(p.codigoPagamento || '');
        console.log(`🔍 [PAGAMENTOS-SERVICE] Código cancelado aceito pelo BB: ${codigo} (tipo: ${typeof p.codigoPagamento})`);
        return codigo;
      });
      const lotesParaAtualizar = new Set<number>();
      
      console.log(`🔍 [PAGAMENTOS-SERVICE] Processando ${codigosCancelados.length} cancelamento(s) aceito(s) pelo BB`);
      
      if (itensPagamento.length > 0) {
        await Promise.all(
          itensPagamento.map(async (item) => {
            // Verificar se este item foi cancelado (comparar códigos)
            const itemCodigo = item.identificadorPagamento || item.codigoIdentificadorPagamento || item.codigoPagamento;
            if (!itemCodigo) {
              console.log(`⚠️ [PAGAMENTOS-SERVICE] Item ID ${item.id} não possui código de pagamento`);
              return;
            }
            
            // Garantir que seja string para comparação exata
            const itemCodigoStr = String(itemCodigo);
            console.log(`🔍 [PAGAMENTOS-SERVICE] Comparando item ID ${item.id}: código=${itemCodigoStr}`);
            
            // Comparar códigos exatos ou por prefixo (para lidar com diferenças de precisão numérica)
            const foiCancelado = codigosCancelados.some(codigoCancelado => {
              // Comparação exata
              if (codigoCancelado === itemCodigoStr) {
                console.log(`✅ [PAGAMENTOS-SERVICE] Match exato encontrado! Item ID ${item.id}: ${itemCodigoStr} === ${codigoCancelado}`);
                return true;
              }
              
              // Comparação por prefixo (primeiros 15 dígitos) para lidar com diferenças de precisão
              // Ex: BB retorna 90000017015446000, banco tem 90000017015446001
              if (codigoCancelado.length >= 15 && itemCodigoStr.length >= 15) {
                const prefixoCancelado = codigoCancelado.substring(0, 15);
                const prefixoItem = itemCodigoStr.substring(0, 15);
                if (prefixoCancelado === prefixoItem) {
                  console.log(`✅ [PAGAMENTOS-SERVICE] Match por prefixo encontrado! Item ID ${item.id}: ${itemCodigoStr} (prefixo: ${prefixoItem}) === ${codigoCancelado} (prefixo: ${prefixoCancelado})`);
                  return true;
                }
              }
              
              return false;
            });
            
            if (foiCancelado) {
              // Encontrar o cancelamento correspondente para obter o estadoPagamento do BB
              const codigoBBMatch = cancelamentosAceitos.find(p => String(p.codigoPagamento || '') === itemCodigoStr);
              const estadoPagamentoBB = codigoBBMatch?.estadoPagamento || 'CANCELADO';
              
              // Atualizar item com status REJEITADO (cancelado), estadoPagamentoIndividual e rastreamento
              console.log(`💾 [PAGAMENTOS-SERVICE] Atualizando item ID ${item.id} com usuarioCancelamentoId=${usuarioId}, dataCancelamento=${dataCancelamento.toISOString()}, estadoPagamentoIndividual=${estadoPagamentoBB}`);
              
              const itemAtualizado = await this.prisma.pagamentoApiItem.update({
                where: { id: item.id },
                data: {
                  status: StatusPagamentoItem.REJEITADO,
                  estadoPagamentoIndividual: estadoPagamentoBB, // Atualizar com o estado retornado pelo BB
                  usuarioCancelamentoId: usuarioId || null,
                  dataCancelamento: dataCancelamento,
                },
              });
              
              console.log(`✅ [PAGAMENTOS-SERVICE] Item ID ${item.id} atualizado com sucesso!`);
              console.log(`   - status: ${itemAtualizado.status}`);
              console.log(`   - estadoPagamentoIndividual: ${itemAtualizado.estadoPagamentoIndividual}`);
              console.log(`   - usuarioCancelamentoId: ${itemAtualizado.usuarioCancelamentoId}`);
              console.log(`   - dataCancelamento: ${itemAtualizado.dataCancelamento}`);
              
              // Adicionar lote à lista para atualização posterior
              if (item.lote) {
                lotesParaAtualizar.add(item.lote.id);
              }
              
              console.log(`✅ [PAGAMENTOS-SERVICE] Item ID ${item.id} atualizado para REJEITADO (cancelado) (usuário ID ${usuarioId || 'N/A'})`);
              console.log(`   Código BB: ${codigoBBMatch?.codigoPagamento}, Código Item: ${itemCodigoStr}, Estado BB: ${estadoPagamentoBB}`);
            } else {
              console.log(`⚠️ [PAGAMENTOS-SERVICE] Item ID ${item.id} não corresponde a nenhum código cancelado aceito.`);
              console.log(`   Código item: ${itemCodigoStr}`);
              console.log(`   Códigos cancelados aceitos: ${codigosCancelados.length > 0 ? codigosCancelados.join(', ') : 'nenhum'}`);
            }
          })
        );
      } else {
        console.log(`⚠️ [PAGAMENTOS-SERVICE] Nenhum item encontrado no banco para os códigos: ${listaCodigosPagamento.join(', ')}`);
      }
      
      // Atualizar status dos lotes que tiveram itens cancelados
      if (lotesParaAtualizar.size > 0) {
        for (const loteId of lotesParaAtualizar) {
          await this.atualizarStatusLoteAposCancelamentoItem(loteId);
        }
      }

      // Reverter status de todas as colheitas vinculadas
      // IMPORTANTE: Só revertemos se o cancelamento foi aceito pelo BB (indicadorCancelamento === 'S')
      // Se foi rejeitado, não devemos reverter o status, pois o pagamento continua válido
      let colheitasRevertidas = 0;
      
      // Só reverter se houver cancelamentos aceitos
      if (cancelamentosAceitos.length > 0) {
        for (const item of itensPagamento) {
          if (item.colheitas && item.colheitas.length > 0) {
            const colheitaIds = item.colheitas.map(c => c.turmaColheitaCustoId);
            
            const resultado = await this.prisma.turmaColheitaPedidoCusto.updateMany({
              where: {
                id: { in: colheitaIds },
                statusPagamento: { in: ['PROCESSANDO', 'PAGO'] },
              },
              data: {
                statusPagamento: 'PENDENTE',
                pagamentoEfetuado: false,
                dataPagamento: null,
              },
            });

            colheitasRevertidas += resultado.count;
            console.log(`✅ [PAGAMENTOS-SERVICE] Revertido status de ${resultado.count} colheita(s) vinculada(s) ao item ${item.id}`);
          }
        }
        console.log(`✅ [PAGAMENTOS-SERVICE] Total de ${colheitasRevertidas} colheita(s) revertida(s) para PENDENTE após cancelamento aceito pelo BB`);
      } else {
        console.log(`⚠️ [PAGAMENTOS-SERVICE] Nenhum cancelamento foi aceito pelo BB. Status das colheitas não foi revertido.`);
      }

      return response.data;
    } catch (error) {
      console.error(
        '❌ [PAGAMENTOS-SERVICE] Erro ao cancelar pagamentos:',
        error?.message || error,
      );

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      if (error.response?.data) {
        console.error(
          '❌ [PAGAMENTOS-SERVICE] Erro detalhado da API BB (cancelamento):',
          {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data,
            dataString: typeof error.response.data === 'string' 
              ? error.response.data 
              : JSON.stringify(error.response.data, null, 2),
          },
        );
        
        const errorMessage = 
          error.response.data.message ||
          error.response.data.error_description ||
          error.response.data.error ||
          (typeof error.response.data === 'string' ? error.response.data : 'Erro desconhecido');
        
        throw new InternalServerErrorException(
          `Erro na API de cancelamento de pagamentos: ${errorMessage}`,
        );
      }

      throw new InternalServerErrorException(
        'Erro ao cancelar pagamentos na API do Banco do Brasil',
      );
    }
  }

  /**
   * Obtém o próximo número de requisição sequencial por conta corrente
   * Inicializa automaticamente a sequência se não existir (útil para deploy)
   * Usa transação para evitar race conditions
   * 
   * Retorna números sequenciais simples (1, 2, 3...) POR CONTA CORRENTE
   * 
   * @param contaCorrenteId ID da conta corrente (para sequência independente entre contas)
   * @returns Próximo número de requisição sequencial
   */
  private async obterProximoNumeroRequisicao(contaCorrenteId: number): Promise<number> {
    try {
      // Números sequenciais simples (1, 2, 3...) POR CONTA CORRENTE
      // Usar transação para garantir atomicidade e evitar race conditions
      return await this.prisma.$transaction(async (tx) => {
        // Buscar sequência específica desta conta ou criar se não existir
        let sequencia = await tx.sequenciaNumeroRequisicao.findUnique({
          where: { contaCorrenteId },
        });

        if (!sequencia) {
          // Se não existe, verificar se há pagamentos existentes no nosso banco
          // para inicializar com o maior numeroRequisicao já usado
          const maiorNumeroExistente = await tx.pagamentoApiLote.findFirst({
            where: { contaCorrenteId },
            orderBy: { numeroRequisicao: 'desc' },
            select: { numeroRequisicao: true },
          });

          let ultimoNumeroInicial: number;
          
          if (maiorNumeroExistente) {
            // Se encontrou pagamento no banco, usar esse número
            ultimoNumeroInicial = maiorNumeroExistente.numeroRequisicao;
            console.log(`📝 [PAGAMENTOS-SERVICE] Inicializando sequência para conta ${contaCorrenteId}...`);
            console.log(`   ℹ️  Encontrado pagamento existente com numeroRequisicao=${ultimoNumeroInicial}, inicializando sequência a partir deste valor`);
          } else {
            // ⚠️ IMPORTANTE: Se não há pagamentos no banco, pode ser que já existam no BB
            // Inicializar com um número seguro (10000) para evitar conflitos com números antigos
            // Se você souber qual foi o último numeroRequisicao usado no BB para esta conta,
            // ajuste manualmente a sequência ou configure via variável de ambiente
            ultimoNumeroInicial = parseInt(process.env.BB_ULTIMO_NUMERO_REQUISICAO_INICIAL || '10000', 10);
            console.log(`📝 [PAGAMENTOS-SERVICE] Inicializando sequência para conta ${contaCorrenteId}...`);
            console.log(`   ⚠️  Nenhum pagamento existente no banco. Inicializando com numeroRequisicao=${ultimoNumeroInicial} para evitar conflitos com números já usados no BB.`);
            console.log(`   💡 Se você souber o último numeroRequisicao usado no BB para esta conta, ajuste manualmente ou configure BB_ULTIMO_NUMERO_REQUISICAO_INICIAL`);
          }

          sequencia = await tx.sequenciaNumeroRequisicao.create({
            data: {
              contaCorrenteId,
              ultimoNumero: ultimoNumeroInicial,
            },
          });
          console.log(`✅ [PAGAMENTOS-SERVICE] Sequência inicializada para conta ${contaCorrenteId} com ultimoNumero=${ultimoNumeroInicial}`);
        }

        // Incrementar até encontrar um número não utilizado globalmente
        let proximoNumero = sequencia.ultimoNumero + 1;
        while (true) {
          const existente = await tx.pagamentoApiLote.findUnique({
            where: { numeroRequisicao: proximoNumero },
          });
          if (!existente) {
            break;
          }
          proximoNumero += 1;
        }

        await tx.sequenciaNumeroRequisicao.update({
          where: { id: sequencia.id },
          data: { ultimoNumero: proximoNumero },
        });

        console.log(
          `🔢 [PAGAMENTOS-SERVICE] Novo numeroRequisicao sequencial gerado: ${proximoNumero} (Conta: ${contaCorrenteId})`,
        );

        return proximoNumero;
      }, {
        // Timeout de 5 segundos para a transação
        timeout: 5000,
      });
    } catch (error) {
      console.error('❌ [PAGAMENTOS-SERVICE] Erro ao obter próximo numeroRequisicao:', error);
      throw new InternalServerErrorException('Erro ao gerar número de requisição');
    }
  }

  /**
   * Mapeia o estado da requisição do BB para status interno do lote
   * @param estadoRequisicao Estado retornado pelo BB (1-10)
   * @returns Status interno do lote
   */
  private mapearStatusLote(estadoRequisicao: number | null | undefined): StatusPagamentoLote {
    if (!estadoRequisicao) {
      return StatusPagamentoLote.PENDENTE;
    }

    switch (estadoRequisicao) {
      case 1: // Requisição com todos os lançamentos com dados consistentes (aguardando liberação)
      case 4: // Requisição pendente de ação pelo Conveniado (aguardando liberação)
        return StatusPagamentoLote.PENDENTE;
      
      case 2: // Requisição com ao menos um dos lançamentos com dados inconsistentes
      case 5: // Requisição em processamento pelo Banco
      case 8: // Preparando remessa não liberada
      case 9: // Requisição liberada via API (liberada, mas ainda processando)
      case 10: // Preparando remessa liberada (liberada, mas ainda processando)
        return StatusPagamentoLote.PROCESSANDO;
      
      case 3: // Requisição com todos os lançamentos com dados inconsistentes
      case 7: // Requisição Rejeitada
        return StatusPagamentoLote.REJEITADO;
      
      case 6: // Requisição Processada
        return StatusPagamentoLote.CONCLUIDO;
      
      default:
        return StatusPagamentoLote.ENVIADO;
    }
  }

  /**
   * Mapeia o indicador de aceite para status interno do item
   * @param indicadorAceite Indicador de aceite ("S" ou "N")
   * @param erros Array de erros (se houver)
   * @returns Status interno do item
   */
  private mapearStatusItem(indicadorAceite: string | null | undefined, erros: any[] | null | undefined): StatusPagamentoItem {
    if (!indicadorAceite) {
      return StatusPagamentoItem.PENDENTE;
    }

    if (indicadorAceite === 'S') {
      return StatusPagamentoItem.ACEITO;
    }

    if (indicadorAceite === 'N') {
      return StatusPagamentoItem.REJEITADO;
    }

    // Se tem erros, considerar rejeitado
    if (erros && erros.length > 0) {
      return StatusPagamentoItem.REJEITADO;
    }

    return StatusPagamentoItem.ENVIADO;
  }

  /**
   * Mapeia o status do item de pagamento para o status do FuncionarioPagamento
   * @param statusItem Status interno do item de pagamento
   * @param loteFinalizado Se o lote está finalizado (estadoRequisicao = 6)
   * @returns Objeto com campos para atualizar no FuncionarioPagamento ou null se não deve atualizar
   */
  private mapearStatusItemParaFuncionarioPagamento(
    statusItem: StatusPagamentoItem,
    loteFinalizado: boolean
  ): { statusPagamento: StatusFuncionarioPagamento; pagamentoEfetuado?: boolean; dataPagamento?: Date } | null {
    switch (statusItem) {
      case StatusPagamentoItem.ACEITO:
        // Item aceito (indicador = 'S'), mas ainda aguardando processamento
        // Se lote está finalizado (estado 6), significa que foi processado com sucesso
        if (loteFinalizado) {
          return {
            statusPagamento: StatusFuncionarioPagamento.PAGO,
            pagamentoEfetuado: true,
            dataPagamento: new Date(),
          };
        }
        return {
          statusPagamento: StatusFuncionarioPagamento.PROCESSANDO,
        };

      case StatusPagamentoItem.REJEITADO:
        return {
          statusPagamento: StatusFuncionarioPagamento.REJEITADO,
          pagamentoEfetuado: false,
        };

      case StatusPagamentoItem.PROCESSADO:
        // Item marcado como processado (PAGO na origem)
        return {
          statusPagamento: StatusFuncionarioPagamento.PAGO,
          pagamentoEfetuado: true,
          dataPagamento: new Date(),
        };

      case StatusPagamentoItem.ENVIADO:
      case StatusPagamentoItem.PENDENTE:
      default:
        // Mantém ENVIADO ou PROCESSANDO sem alterar
        return null;
    }
  }

  /**
   * Invalida o cache de token para uma credencial e escopos específicos
   * Útil quando um token retorna erro 401/403, indicando que pode estar expirado ou com escopos incorretos
   * @param credencialId ID da credencial
   * @param scopes Escopos (opcional, se não informado, invalida todos os tokens desta credencial)
   */
  private invalidarCacheToken(credencialId: number, scopes?: string): void {
    if (scopes) {
      const cacheKey = `${credencialId}:${scopes}`;
      this.cachedTokens.delete(cacheKey);
      console.log(`🗑️ [PAGAMENTOS-SERVICE] Cache de token invalidado para credencial ${credencialId} com escopos: ${scopes}`);
    } else {
      // Invalidar todos os tokens desta credencial
      const keysToDelete: string[] = [];
      this.cachedTokens.forEach((value, key) => {
        if (key.startsWith(`${credencialId}:`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.cachedTokens.delete(key));
      console.log(`🗑️ [PAGAMENTOS-SERVICE] Cache de token invalidado para credencial ${credencialId} (${keysToDelete.length} token(s) removido(s))`);
    }
  }

  /**
   * Obtém token de acesso OAuth2 com cache por credencial e escopos
   * Cada credencial + escopos tem seu próprio token cacheado
   * @param credencialPagamento Credencial específica para obter o token
   * @param scopes Escopos necessários para a operação (opcional, usa escopos mínimos se não informado)
   * @param forceRefresh Se true, força a obtenção de um novo token mesmo se houver um em cache
   * @returns Token de acesso válido
   */
  private async obterTokenDeAcesso(credencialPagamento: any, scopes?: string, forceRefresh: boolean = false): Promise<string> {
    const credencialId = credencialPagamento.id;
    const scopesKey = scopes || 'default';
    const cacheKey = `${credencialId}:${scopesKey}`;
    
    // Verifica se o token está em cache para esta credencial + escopos e ainda é válido
    // IMPORTANTE: Cache deve ser por credencialId + escopos, pois tokens têm escopos específicos
    // Um token obtido com escopos de consulta não pode ser usado para cancelamento
    if (!forceRefresh) {
      const cached = this.cachedTokens.get(cacheKey);
      if (cached && cached.expiry && new Date() < cached.expiry) {
        console.log(`✅ [PAGAMENTOS-SERVICE] Token em cache válido para credencial ${credencialId} com escopos: ${scopesKey}`);
        return cached.token;
      }
    } else {
      console.log(`🔄 [PAGAMENTOS-SERVICE] Forçando refresh do token para credencial ${credencialId} com escopos: ${scopesKey}`);
      this.cachedTokens.delete(cacheKey);
    }

    try {
      const scopesParaUsar = scopes || this.SCOPES_PIX_REQUISICAO; // Default: escopos mínimos de PIX
      
      console.log(`🔑 [PAGAMENTOS-SERVICE] Obtendo novo token para credencial ${credencialId} (conta ${credencialPagamento.contaCorrenteId})`);
      console.log(`📋 [PAGAMENTOS-SERVICE] Escopos solicitados: ${scopesParaUsar}`);

      // Criar cliente HTTP para autenticação (passando developerAppKey para incluir gw-dev-app-key)
      const authClient = createPagamentosAuthClient(credencialPagamento.developerAppKey);

      console.log('🔍 [PAGAMENTOS-SERVICE] Config OAuth Pagamentos:', {
        baseURL: (authClient.defaults as any)?.baseURL,
        tokenPath: BB_PAGAMENTOS_API_URLS.PAGAMENTOS_AUTH,
        scopes: scopesParaUsar,
        'gw-dev-app-key': credencialPagamento.developerAppKey ? `${credencialPagamento.developerAppKey.substring(0, 8)}...` : 'VAZIO',
      });

      // Fazer requisição de autenticação OAuth2
      // Escopos são necessários para o token ter permissão de usar os endpoints
      const bodyParams = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: scopesParaUsar
      });
      
      console.log('🔍 [PAGAMENTOS-SERVICE] Body OAuth (COM scope):', bodyParams.toString());
      
      const response = await authClient.post(
        BB_PAGAMENTOS_API_URLS.PAGAMENTOS_AUTH,
        bodyParams.toString(),
        {
          auth: {
            username: credencialPagamento.clienteId,
            password: credencialPagamento.clienteSecret,
          },
        }
      );

      // Cachear o token para esta credencial + escopos específicos
      const accessToken = (response.data as any).access_token;
      const expiresIn = (response.data as any).expires_in || 3600; // segundos
      const expiry = new Date(new Date().getTime() + (expiresIn - 60) * 1000); // 60 segundos antes
      
      this.cachedTokens.set(cacheKey, {
        token: accessToken,
        expiry: expiry
      });

      console.log(`✅ [PAGAMENTOS-SERVICE] Token obtido e cacheado para credencial ${credencialId} com escopos: ${scopesKey}`);

      return accessToken;

    } catch (error) {
      console.error(`❌ [PAGAMENTOS-SERVICE] Erro ao obter token de acesso para credencial ${credencialId}:`, {
        message: error.message,
        code: error.code,
        config: {
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
        },
        responseStatus: error.response?.status,
        responseStatusText: error.response?.statusText,
        responseHeaders: error.response?.headers,
        responseDataSnippet: typeof error.response?.data === 'string'
          ? error.response.data.substring(0, 500)
          : error.response?.data,
      });
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      if (error.response?.data) {
        throw new InternalServerErrorException(
          `Erro na autenticação BB: ${error.response.data.error_description || error.response.data.error || 'Erro desconhecido'}`
        );
      }

      throw new InternalServerErrorException('Erro ao obter token de acesso da API de pagamentos do Banco do Brasil');
    }
  }

  /**
   * Lista lotes de pagamentos vinculados a turma de colheita (TurmaColheitaPedidoCusto)
   * Foco inicial: PIX (tipoPagamentoApi = PIX), para colhedores.
   */
  async listarLotesTurmaColheita(
    dataInicio?: string,
    dataFim?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const where: Prisma.PagamentoApiLoteWhereInput = {
      tipoPagamentoApi: 'PIX',
    };

    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) {
        where.createdAt.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.createdAt.lte = new Date(dataFim);
      }
    }

    // Paginação: padrão page=1, limit=10
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const [lotes, total] = await Promise.all([
      this.prisma.pagamentoApiLote.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNumber,
        include: {
          contaCorrente: true,
          usuarioCriacao: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          usuarioLiberacao: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          itensPagamento: {
            include: {
              usuarioCancelamento: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                },
              },
              colheitas: {
                include: {
                  turmaColheitaCusto: {
                    include: {
                      turmaColheita: true,
                      pedido: {
                        select: {
                          numeroPedido: true,
                          cliente: {
                            select: {
                              nome: true,
                              razaoSocial: true,
                            },
                          },
                        },
                      },
                      fruta: {
                        select: {
                          nome: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.pagamentoApiLote.count({ where }),
    ]);

    const lotesMapeados = lotes.map((lote) => {
      const todasColheitas = lote.itensPagamento.flatMap((item) =>
        item.colheitas.map((rel) => rel.turmaColheitaCusto),
      );

      const quantidadeColheitas = todasColheitas.length;
      const quantidadePedidos = new Set(
        todasColheitas.map((c) => c.pedidoId),
      ).size;
      const quantidadeFrutas = new Set(
        todasColheitas.map((c) => c.frutaId),
      ).size;

      const valorTotalColheitas = todasColheitas.reduce(
        (acc, c) => acc + (c.valorColheita || 0),
        0,
      );

      // Origem do lote (no futuro pode ser FUNCIONARIO / FORNECEDOR, etc.)
      // Por enquanto, apenas TURMA_COLHEITA (colhedores)
      const origemTipo =
        todasColheitas.length > 0 ? 'TURMA_COLHEITA' : 'DESCONHECIDO';
      const origemNome =
        todasColheitas[0]?.turmaColheita?.nomeColhedor || null;

      return {
        id: lote.id,
        numeroRequisicao: lote.numeroRequisicao,
        tipoPagamentoApi: lote.tipoPagamentoApi,
        tipoPagamento: lote.tipoPagamento,
        status: lote.status,
        estadoRequisicao: lote.estadoRequisicao,
        estadoRequisicaoAtual: lote.estadoRequisicaoAtual,
        processadoComSucesso: lote.processadoComSucesso,
        dataCriacao: lote.createdAt,
        dataAtualizacao: lote.updatedAt,
        contaCorrente: {
          id: lote.contaCorrente.id,
          bancoCodigo: lote.contaCorrente.bancoCodigo,
          agencia: lote.contaCorrente.agencia,
          contaCorrente: lote.contaCorrente.contaCorrente,
        },
        quantidadeItens: lote.itensPagamento.length,
        quantidadeColheitas,
        quantidadePedidos,
        quantidadeFrutas,
        valorTotalEnviado: lote.valorTotalEnviado,
        valorTotalValidado: lote.valorTotalValido,
        valorTotalColheitas,
        origemTipo,
        origemNome,
        // Rastreamento por usuário
        usuarioCriacao: lote.usuarioCriacao ? {
          id: lote.usuarioCriacao.id,
          nome: lote.usuarioCriacao.nome,
          email: lote.usuarioCriacao.email,
        } : null,
        usuarioLiberacao: lote.usuarioLiberacao ? {
          id: lote.usuarioLiberacao.id,
          nome: lote.usuarioLiberacao.nome,
          email: lote.usuarioLiberacao.email,
        } : null,
        dataLiberacao: lote.dataLiberacao,
        itensPagamento: lote.itensPagamento.map(item => ({
          id: item.id,
          codigoPagamento: item.codigoPagamento,
          codigoIdentificadorPagamento: item.codigoIdentificadorPagamento,
          identificadorPagamento: item.identificadorPagamento,
          valorEnviado: item.valorEnviado,
          status: item.status,
          estadoPagamentoIndividual: item.estadoPagamentoIndividual, // Estado real do BB (BLOQUEADO, CANCELADO, Pago, etc.)
          processadoComSucesso: item.processadoComSucesso,
          // Dados PIX (quando aplicável)
          chavePixEnviada: item.chavePixEnviada,
          tipoChavePixEnviado: item.tipoChavePixEnviado,
          usuarioCancelamento: item.usuarioCancelamento ? {
            id: item.usuarioCancelamento.id,
            nome: item.usuarioCancelamento.nome,
            email: item.usuarioCancelamento.email,
          } : null,
          dataCancelamento: item.dataCancelamento,
          // Colheitas vinculadas ao item (apenas para pagamentos de colheita)
          colheitas: item.colheitas.map(rel => ({
            id: rel.turmaColheitaCusto.id,
            turmaColheitaId: rel.turmaColheitaCusto.turmaColheitaId,
            pedidoId: rel.turmaColheitaCusto.pedidoId,
            pedidoNumero: rel.turmaColheitaCusto.pedido?.numeroPedido,
            cliente: rel.turmaColheitaCusto.pedido?.cliente?.razaoSocial || rel.turmaColheitaCusto.pedido?.cliente?.nome || null,
            frutaId: rel.turmaColheitaCusto.frutaId,
            frutaNome: rel.turmaColheitaCusto.fruta?.nome,
            quantidadeColhida: rel.turmaColheitaCusto.quantidadeColhida,
            unidadeMedida: rel.turmaColheitaCusto.unidadeMedida,
            valorColheita: rel.valorColheita,
            dataColheita: rel.turmaColheitaCusto.dataColheita,
            pagamentoEfetuado: rel.turmaColheitaCusto.pagamentoEfetuado,
            statusPagamento: rel.turmaColheitaCusto.statusPagamento,
            formaPagamento: rel.turmaColheitaCusto.formaPagamento,
            dataPagamento: rel.turmaColheitaCusto.dataPagamento,
          })),
        })),
        turmaResumo:
          todasColheitas.length > 0
            ? {
                turmaId: todasColheitas[0].turmaColheitaId,
                nomeColhedor:
                  todasColheitas[0].turmaColheita?.nomeColhedor || null,
              }
            : null,
        colheitas: todasColheitas.map((c) => ({
          id: c.id,
          turmaColheitaId: c.turmaColheitaId,
          pedidoId: c.pedidoId,
          pedidoNumero: c.pedido?.numeroPedido,
          cliente:
            c.pedido?.cliente?.razaoSocial || c.pedido?.cliente?.nome || null,
          frutaId: c.frutaId,
          frutaNome: c.fruta?.nome,
          quantidadeColhida: c.quantidadeColhida,
          unidadeMedida: c.unidadeMedida,
          valorColheita: c.valorColheita || 0,
          dataColheita: c.dataColheita,
          pagamentoEfetuado: c.pagamentoEfetuado,
          statusPagamento: c.statusPagamento,
          formaPagamento: c.formaPagamento,
          dataPagamento: c.dataPagamento,
        })),
      };
    });

    return {
      data: lotesMapeados,
      total,
      page: pageNumber,
      limit: limitNumber,
    };
  }

  /**
   * Lista lotes de pagamentos vinculados a folhas de pagamento (PIX)
   */
  async listarLotesFolhaPagamento(
    dataInicio?: string,
    dataFim?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const where: Prisma.PagamentoApiLoteWhereInput = {
      tipoPagamentoApi: 'PIX',
      itensPagamento: {
        some: {
          funcionarioPagamentoId: {
            not: null,
          },
        },
      },
    };

    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) {
        where.createdAt.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.createdAt.lte = new Date(dataFim);
      }
    }

    // Paginação: padrão page=1, limit=10
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const [lotes, total] = await Promise.all([
      this.prisma.pagamentoApiLote.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNumber,
        include: {
          contaCorrente: true,
          usuarioCriacao: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          usuarioLiberacao: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          itensPagamento: {
            where: {
              funcionarioPagamentoId: {
                not: null,
              },
            },
            include: {
              usuarioCancelamento: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                },
              },
              funcionarioPagamento: {
                include: {
                  funcionario: {
                    select: {
                      id: true,
                      nome: true,
                      cpf: true,
                    },
                  },
                  folha: {
                    select: {
                      id: true,
                      competenciaMes: true,
                      competenciaAno: true,
                      periodo: true,
                      referencia: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.pagamentoApiLote.count({ where }),
    ]);

    const lotesMapeados = lotes.map((lote) => {
      const funcionariosPagamento = lote.itensPagamento
        .map((item) => item.funcionarioPagamento)
        .filter((fp) => fp !== null);

      const quantidadeFuncionarios = funcionariosPagamento.length;
      const valorTotalFuncionarios = funcionariosPagamento.reduce(
        (acc, fp) => acc + Number(fp?.valorLiquido || 0),
        0,
      );

      // Agrupar por folha para identificar a origem
      const folhas = new Map();
      funcionariosPagamento.forEach((fp) => {
        if (fp?.folha) {
          const folhaId = fp.folha.id;
          if (!folhas.has(folhaId)) {
            folhas.set(folhaId, {
              folha: fp.folha,
              funcionarios: [],
            });
          }
          folhas.get(folhaId).funcionarios.push(fp);
        }
      });

      // Se houver múltiplas folhas, usar a primeira (geralmente há apenas uma)
      const folhaPrincipal = Array.from(folhas.values())[0]?.folha || null;

      // Origem do lote
      const origemTipo = funcionariosPagamento.length > 0 ? 'FOLHA_PAGAMENTO' : 'DESCONHECIDO';
      const origemNome = folhaPrincipal
        ? `${String(folhaPrincipal.competenciaMes).padStart(2, '0')}/${folhaPrincipal.competenciaAno} - ${folhaPrincipal.periodo}ª Quinzena`
        : null;

      return {
        id: lote.id,
        numeroRequisicao: lote.numeroRequisicao,
        tipoPagamentoApi: lote.tipoPagamentoApi,
        tipoPagamento: lote.tipoPagamento,
        status: lote.status,
        estadoRequisicao: lote.estadoRequisicao,
        estadoRequisicaoAtual: lote.estadoRequisicaoAtual,
        processadoComSucesso: lote.processadoComSucesso,
        dataCriacao: lote.createdAt,
        dataAtualizacao: lote.updatedAt,
        contaCorrente: {
          id: lote.contaCorrente.id,
          bancoCodigo: lote.contaCorrente.bancoCodigo,
          agencia: lote.contaCorrente.agencia,
          contaCorrente: lote.contaCorrente.contaCorrente,
        },
        quantidadeItens: lote.itensPagamento.length,
        quantidadeFuncionarios,
        valorTotalEnviado: lote.valorTotalEnviado,
        valorTotalValidado: lote.valorTotalValido,
        valorTotalFuncionarios,
        origemTipo,
        origemNome,
        folhaPrincipal: folhaPrincipal ? {
          id: folhaPrincipal.id,
          competenciaMes: folhaPrincipal.competenciaMes,
          competenciaAno: folhaPrincipal.competenciaAno,
          periodo: folhaPrincipal.periodo,
          referencia: folhaPrincipal.referencia,
          status: folhaPrincipal.status,
        } : null,
        // Rastreamento por usuário
        usuarioCriacao: lote.usuarioCriacao ? {
          id: lote.usuarioCriacao.id,
          nome: lote.usuarioCriacao.nome,
          email: lote.usuarioCriacao.email,
        } : null,
        usuarioLiberacao: lote.usuarioLiberacao ? {
          id: lote.usuarioLiberacao.id,
          nome: lote.usuarioLiberacao.nome,
          email: lote.usuarioLiberacao.email,
        } : null,
        dataLiberacao: lote.dataLiberacao,
        itensPagamento: lote.itensPagamento.map(item => ({
          id: item.id,
          codigoPagamento: item.codigoPagamento,
          codigoIdentificadorPagamento: item.codigoIdentificadorPagamento,
          identificadorPagamento: item.identificadorPagamento,
          valorEnviado: item.valorEnviado,
          status: item.status,
          estadoPagamentoIndividual: item.estadoPagamentoIndividual,
          processadoComSucesso: item.processadoComSucesso,
          // Dados PIX
          chavePixEnviada: item.chavePixEnviada,
          tipoChavePixEnviado: item.tipoChavePixEnviado,
          usuarioCancelamento: item.usuarioCancelamento ? {
            id: item.usuarioCancelamento.id,
            nome: item.usuarioCancelamento.nome,
            email: item.usuarioCancelamento.email,
          } : null,
          dataCancelamento: item.dataCancelamento,
          // Funcionário vinculado ao item
          funcionarioPagamento: item.funcionarioPagamento ? {
            id: item.funcionarioPagamento.id,
            funcionario: item.funcionarioPagamento.funcionario ? {
              id: item.funcionarioPagamento.funcionario.id,
              nome: item.funcionarioPagamento.funcionario.nome,
              cpf: item.funcionarioPagamento.funcionario.cpf,
            } : null,
            folha: item.funcionarioPagamento.folha ? {
              id: item.funcionarioPagamento.folha.id,
              competenciaMes: item.funcionarioPagamento.folha.competenciaMes,
              competenciaAno: item.funcionarioPagamento.folha.competenciaAno,
              periodo: item.funcionarioPagamento.folha.periodo,
              referencia: item.funcionarioPagamento.folha.referencia,
              status: item.funcionarioPagamento.folha.status,
            } : null,
            valorLiquido: item.funcionarioPagamento.valorLiquido,
            statusPagamento: item.funcionarioPagamento.statusPagamento,
          } : null,
        })),
        funcionarios: funcionariosPagamento.map((fp) => ({
          id: fp?.id,
          funcionarioId: fp?.funcionarioId,
          funcionarioNome: fp?.funcionario?.nome,
          funcionarioCpf: fp?.funcionario?.cpf,
          folhaId: fp?.folhaId,
          folhaCompetencia: fp?.folha
            ? `${String(fp.folha.competenciaMes).padStart(2, '0')}/${fp.folha.competenciaAno} - ${fp.folha.periodo}ª Quinzena`
            : null,
          valorLiquido: fp?.valorLiquido,
          statusPagamento: fp?.statusPagamento,
        })),
      };
    });

    return {
      data: lotesMapeados,
      total,
      page: pageNumber,
      limit: limitNumber,
    };
  }

  /**
   * Solicita transferência PIX
   * @param dto Dados da transferência PIX (contém contaCorrenteId para buscar credenciais)
   * @param usuarioId ID do usuário que está criando o pagamento
   * @returns Resposta da API com status da solicitação
   */
  async solicitarTransferenciaPix(
    dto: SolicitarTransferenciaPixDto,
    usuarioId?: number
  ): Promise<RespostaTransferenciaPixDto> {
    // Buscar conta corrente
    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id: dto.contaCorrenteId },
    });

    if (!contaCorrente) {
      throw new NotFoundException(`Conta corrente não encontrada (ID: ${dto.contaCorrenteId})`);
    }

    // Gerar numeroRequisicao sequencial automaticamente (ignora o que vem do DTO)
    // Usa números sequenciais simples (1, 2, 3...) POR CONTA CORRENTE
    const numeroRequisicao = await this.obterProximoNumeroRequisicao(contaCorrente.id);

    try {
      console.log(`📥 [PAGAMENTOS-SERVICE] Criando lote de pagamento: numeroRequisicao=${numeroRequisicao}, ${dto.listaTransferencias.length} transferência(s)`);

      // Buscar conta corrente pelo ID
      const contaCorrente = await this.contaCorrenteService.findOne(dto.contaCorrenteId);

      if (!contaCorrente) {
        throw new NotFoundException(`Conta corrente ID ${dto.contaCorrenteId} não encontrada.`);
      }

      // Validar se a conta possui número de contrato de pagamentos configurado
      if (
        contaCorrente.numeroContratoPagamento === null ||
        contaCorrente.numeroContratoPagamento === undefined
      ) {
        throw new BadRequestException(
          `A conta corrente ID ${contaCorrente.id} não possui número de contrato de pagamentos configurado. ` +
          `Cadastre o número do contrato de pagamentos (Convênio PGT) para esta conta nas configurações antes de enviar pagamentos.`
        );
      }

      console.log(`🔍 [PAGAMENTOS-SERVICE] Conta selecionada: ID ${contaCorrente.id}, Agência ${contaCorrente.agencia}, Conta ${contaCorrente.contaCorrente}-${contaCorrente.contaCorrenteDigito}, Contrato Pagamentos: ${contaCorrente.numeroContratoPagamento}`);

      // Buscar credencial de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException('Credencial de pagamentos não cadastrada. Favor cadastrar as credenciais de pagamentos.');
      }

      // Encontrar credencial para esta conta
      const credencialPagamento = credenciaisPagamentos.find(c => c.contaCorrenteId === contaCorrente.id);
      
      if (!credencialPagamento) {
        throw new NotFoundException(
          `Credenciais de pagamentos não encontradas para a conta ${contaCorrente.contaCorrente} da agência ${contaCorrente.agencia}. Configure as credenciais para esta conta primeiro.`
        );
      }

      console.log(`🔑 [PAGAMENTOS-SERVICE] Credencial encontrada: ID ${credencialPagamento.id}, Modalidade: ${credencialPagamento.modalidadeApi}`);

      // Validar colheitaIds se fornecido
      // Para pagamento consolidado, esperamos 1 única transferência com múltiplas colheitas
      if (dto.colheitaIds && dto.colheitaIds.length > 0 && dto.listaTransferencias.length !== 1) {
        throw new BadRequestException(
          `Para pagamento consolidado de múltiplas colheitas, deve haver 1 única transferência. ` +
          `Recebido: ${dto.listaTransferencias.length} transferência(s), esperado: 1.`
        );
      }

      // Calcular valores totais
      const quantidadeEnviada = dto.listaTransferencias.length;
      const valorTotalEnviado = dto.listaTransferencias.reduce((acc, t) => acc + parseFloat(t.valor || '0'), 0);

      console.log(`🔗 [PAGAMENTOS-SERVICE] Processando ${quantidadeEnviada} transferência(s) para ${dto.colheitaIds?.length || 0} colheita(s)`);

      // Obter número de contrato da conta corrente
      const numeroContrato = contaCorrente.numeroContratoPagamento;

      // Formatar datas das transferências conforme documentação BB (ddmmaaaa, omitir zero à esquerda do dia)
      // Importar função de formatação
      const { formatarDataParaAPIBB } = await import('../utils/formatters');
      
      const listaTransferenciasFormatada = dto.listaTransferencias.map(transferencia => ({
        ...transferencia,
        // Garantir que a data está no formato correto (ddmmaaaa, sem zero à esquerda do dia)
        data: formatarDataParaAPIBB(transferencia.data),
      }));

      // Criar payload para envio ao BB (usando numeroRequisicao gerado e numeroContrato)
      const payloadBB = {
        numeroRequisicao,
        numeroContrato,
        agenciaDebito: contaCorrente.agencia,
        contaCorrenteDebito: contaCorrente.contaCorrente,
        digitoVerificadorContaCorrente: this.normalizarDigitoConta(contaCorrente.contaCorrenteDigito),
        tipoPagamento: dto.tipoPagamento,
        listaTransferencias: listaTransferenciasFormatada,
      };

      // Criar lote no banco de dados ANTES de enviar ao BB
      const lote = await this.prisma.pagamentoApiLote.create({
        data: {
          numeroRequisicao,
          numeroContrato: numeroContrato,
          tipoPagamento: dto.tipoPagamento,
          tipoPagamentoApi: TipoPagamentoApi.PIX,
          contaCorrenteId: contaCorrente.id,
          payloadEnviado: payloadBB as any,
          quantidadeEnviada,
          valorTotalEnviado,
          status: StatusPagamentoLote.PENDENTE,
          usuarioCriacaoId: usuarioId || null,
        },
      });

      console.log(`💾 [PAGAMENTOS-SERVICE] Lote criado no banco: ID ${lote.id}, numeroRequisicao ${lote.numeroRequisicao}`);

      // Criar itens no banco de dados ANTES de enviar ao BB
      // Para pagamento consolidado, criamos 1 único item para todas as colheitas
      const itens = await Promise.all(
        dto.listaTransferencias.map((transferencia, index) => {
          // Extrair dados específicos de PIX
          // IMPORTANTE: Para telefone (formaIdentificacao = 1), concatenar DDD + telefone
          // O BB recebe separado, mas a chave PIX completa é DDD + telefone
          let chavePix = '';
          const tipoChavePix = transferencia.formaIdentificacao;
          
          if (tipoChavePix === 1 && transferencia.telefone) {
            // Telefone: concatenar DDD + telefone
            // O BB recebe separado (dddTelefone e telefone), mas a chave PIX completa é DDD + telefone
            const ddd = transferencia.dddTelefone ? String(transferencia.dddTelefone) : '';
            const telefone = String(transferencia.telefone);
            chavePix = ddd + telefone;
            console.log(`📱 [PAGAMENTOS-SERVICE] Chave PIX telefone montada: DDD=${ddd}, Telefone=${telefone}, Chave completa=${chavePix}`);
          } else if (transferencia.cpf) {
            chavePix = String(transferencia.cpf);
          } else if (transferencia.cnpj) {
            chavePix = String(transferencia.cnpj);
          } else if (transferencia.email) {
            chavePix = String(transferencia.email);
          } else if (transferencia.identificacaoAleatoria) {
            chavePix = String(transferencia.identificacaoAleatoria);
          } else if (transferencia.telefone) {
            // Fallback: se tiver telefone mas não for tipo 1, usar apenas telefone
            chavePix = String(transferencia.telefone);
          }

          return this.prisma.pagamentoApiItem.create({
            data: {
              loteId: lote.id,
              indiceLote: index,
              valorEnviado: parseFloat(transferencia.valor || '0'),
              dataPagamentoEnviada: transferencia.data,
              descricaoEnviada: transferencia.descricaoPagamento || null,
              descricaoInstantaneoEnviada: transferencia.descricaoPagamentoInstantaneo || null,
              chavePixEnviada: chavePix,
              tipoChavePixEnviado: tipoChavePix || null,
              payloadItemEnviado: transferencia as any,
              status: StatusPagamentoItem.PENDENTE,
            },
          });
        })
      );

      console.log(`💾 [PAGAMENTOS-SERVICE] ${itens.length} item(ns) criado(s) no banco`);

      // Relacionar itens com colheitas via tabela N:N (PagamentoApiItemColheita)
      if (dto.colheitaIds && dto.colheitaIds.length > 0 && itens.length > 0) {
        // Para pagamento consolidado, relacionar o primeiro (e único) item com todas as colheitas
        const itemPagamento = itens[0]; // 1 único item para pagamento consolidado
        
        // Buscar valores das colheitas para rastreabilidade
        const colheitas = await this.prisma.turmaColheitaPedidoCusto.findMany({
          where: {
            id: { in: dto.colheitaIds },
          },
          select: {
            id: true,
            valorColheita: true,
          },
        });

        // Criar relacionamentos N:N
        const relacionamentos = await Promise.all(
          colheitas.map((colheita) => {
            return this.prisma.pagamentoApiItemColheita.create({
              data: {
                pagamentoApiItemId: itemPagamento.id,
                turmaColheitaCustoId: colheita.id,
                valorColheita: colheita.valorColheita || 0,
              },
            });
          })
        );

        console.log(`🔗 [PAGAMENTOS-SERVICE] ${relacionamentos.length} colheita(s) relacionada(s) com o item de pagamento ID ${itemPagamento.id}`);
      }

      // Obter token de acesso com escopos para PIX
      const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_PIX_REQUISICAO);

      // Criar cliente HTTP para API
      const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

      // Fazer requisição ao BB
      console.log(`🌐 [PAGAMENTOS-SERVICE] Enviando requisição ao BB: numeroRequisicao=${numeroRequisicao}, valorTotal=${valorTotalEnviado}`);
      
      const response = await apiClient.post(
        '/lotes-transferencias-pix',
        payloadBB,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const respostaData = response.data as RespostaTransferenciaPixDto;
      
      console.log(`✅ [PAGAMENTOS-SERVICE] Resposta BB recebida: estadoRequisicao=${respostaData?.estadoRequisicao}, ${respostaData?.quantidadeTransferenciasValidas || 0} transferência(s) válida(s)`);

      // Atualizar lote com resposta do BB
      const estadoRequisicao = respostaData?.estadoRequisicao;
      const quantidadeValida = respostaData?.quantidadeTransferenciasValidas || 0;
      const valorTotalValido = respostaData?.valorTransferenciasValidas || 0;
      const statusLote = this.mapearStatusLote(estadoRequisicao);
      const finalizado = estadoRequisicao === 6;

      const loteAtualizado = await this.prisma.pagamentoApiLote.update({
        where: { id: lote.id },
        data: {
          payloadResposta: respostaData as any,
          estadoRequisicao,
          quantidadeValida,
          valorTotalValido,
          status: statusLote,
          // processadoComSucesso = true quando:
          // - Estado 1 (dados consistentes) ou 4 (aguardando liberação) - pronto para liberar
          // NÃO incluir estado 6 (processado) pois nesse caso já está concluído e não precisa mais de liberação
          processadoComSucesso: estadoRequisicao === 1 || estadoRequisicao === 4,
          dataProcessamento: new Date(),
        },
      });

      console.log(`💾 [PAGAMENTOS-SERVICE] Lote atualizado com resposta do BB: status ${statusLote}`);

      // Criar notificação para administradores somente se a requisição foi criada com sucesso no BB
      // (status diferente de REJEITADO). ERRO é tratado nos fluxos de exceção.
      if (statusLote !== StatusPagamentoLote.REJEITADO) {
        // Recarregar lote com conta corrente para enriquecer dados da notificação
        const loteComRelacionamentos = await this.prisma.pagamentoApiLote.findUnique({
          where: { id: loteAtualizado.id },
          include: {
            contaCorrente: true,
          },
        });

        if (loteComRelacionamentos) {
          // Origem genérica preparada para múltiplos tipos (TURMA_COLHEITA, FOLHA_PAGAMENTO, etc)
          // Se não informado no DTO, usa TURMA_COLHEITA como padrão (compatibilidade com código existente)
          const origemTipo = dto.origemTipo || 'TURMA_COLHEITA';
          const origemNome = dto.origemNome || 
            ((dto.colheitaIds && dto.colheitaIds.length > 0)
              ? 'Turma de Colheita'
              : undefined);

          await this.notificacoesService.criarNotificacoesLiberarPagamentoParaAdministradores({
            ...loteComRelacionamentos,
            origemTipo,
            origemNome,
          });
        }
      }

      // Atualizar itens com resposta do BB
      if (respostaData?.listaTransferencias) {
        await Promise.all(
          respostaData.listaTransferencias.map(async (transferencia, index) => {
            const item = itens[index];
            if (!item) return;

            const indicadorMovimentoAceito = transferencia.indicadorMovimentoAceito;
            const erros = transferencia.erros || [];
            const statusItem = this.mapearStatusItem(indicadorMovimentoAceito, erros);

            // O identificadorPagamento agora vem como string do transformador (se for número grande)
            // ou como number (se for número pequeno). Sempre converter para string para garantir precisão.
            const identificadorParaSalvar = transferencia.identificadorPagamento != null ? String(transferencia.identificadorPagamento) : null;

            await this.prisma.pagamentoApiItem.update({
              where: { id: item.id },
              data: {
                identificadorPagamento: identificadorParaSalvar,
                indicadorMovimentoAceito,
                indicadorMovimentoAceitoAtual: indicadorMovimentoAceito,
                erros: erros.length > 0 ? erros as any : null,
                payloadItemResposta: transferencia as any,
                payloadItemRespostaAtual: transferencia as any,
                status: statusItem,
                ultimaAtualizacaoStatus: new Date(),
              },
            });

            console.log(`💾 [PAGAMENTOS-SERVICE] Item ${item.id} atualizado: identificadorPagamento=${identificadorParaSalvar}`);
          })
        );

        console.log(`💾 [PAGAMENTOS-SERVICE] ${respostaData.listaTransferencias.length} item(ns) atualizado(s)`);
      }

      console.log(`✅ [PAGAMENTOS-SERVICE] Lote ${numeroRequisicao} criado com sucesso: ${quantidadeValida} transferência(s) válida(s), valor=${valorTotalValido}`);

      if (!finalizado) {
        await this.pagamentosSyncQueueService.scheduleLoteSync({
          numeroRequisicao,
          contaCorrenteId: contaCorrente.id,
          loteId: loteAtualizado.id,
        });
      }

      return respostaData;

    } catch (error) {
      console.error(`❌ [PAGAMENTOS-SERVICE] Erro ao criar lote ${numeroRequisicao}:`, error.message);
      
      if (error.response) {
        console.error(`   Status HTTP: ${error.response.status} ${error.response.statusText}`);
        if (error.response.data?.erros) {
          console.error(`   Erros BB:`, JSON.stringify(error.response.data.erros));
        } else {
          console.error(`   Resposta:`, JSON.stringify(error.response.data));
        }
      }

      // Se o lote foi criado, atualizar com erro
      // Nota: O lote pode não existir se o erro ocorreu antes de criá-lo
      try {
        // Tentar buscar pelo numeroRequisicao que deveria ter sido usado
        const loteExistente = await this.prisma.pagamentoApiLote.findUnique({
          where: { numeroRequisicao },
        }).catch(() => null);

        if (loteExistente) {
          const erroCompleto = error.response?.data 
            ? JSON.stringify(error.response.data, null, 2)
            : error.message;
            
          await this.prisma.pagamentoApiLote.update({
            where: { id: loteExistente.id },
            data: {
              status: StatusPagamentoLote.ERRO,
              erroProcessamento: erroCompleto,
            },
          });
          
          console.error(`💾 [PAGAMENTOS-SERVICE] Lote ${loteExistente.id} (numeroRequisicao ${loteExistente.numeroRequisicao}) atualizado com status ERRO`);
        } else {
          console.warn(`⚠️ [PAGAMENTOS-SERVICE] Lote com numeroRequisicao ${numeroRequisicao} não encontrado no banco para atualizar com erro.`);
        }
      } catch (updateError) {
        console.error('❌ [PAGAMENTOS-SERVICE] Erro ao atualizar lote com erro:', updateError);
      }

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      // Retornar erro mais detalhado se disponível
      if (error.response?.data) {
        const errosBB = error.response.data.erros || [];
        const mensagemErros = errosBB.length > 0
          ? errosBB.map((e: any) => `${e.codigo || ''}: ${e.mensagem || JSON.stringify(e)}`).join('; ')
          : error.response.data.message || error.response.data.error || 'Erro desconhecido';
          
        throw new InternalServerErrorException(
          `Erro na API de pagamentos (${error.response.status}): ${mensagemErros}`
        );
      }

      throw new InternalServerErrorException(`Erro ao solicitar transferência PIX: ${error.message}`);
    }
  }

  /**
   * Solicita pagamento de boleto
   * @param dto Dados do pagamento de boleto (contém contaCorrenteId para buscar credenciais)
   * @returns Resposta da API com status da solicitação
   */
  async solicitarPagamentoBoleto(
    dto: SolicitarPagamentoBoletoDto
  ): Promise<RespostaPagamentoBoletoDto> {
    // Buscar conta corrente
    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id: dto.contaCorrenteId },
    });

    if (!contaCorrente) {
      throw new NotFoundException(`Conta corrente não encontrada (ID: ${dto.contaCorrenteId})`);
    }

    // Gerar numeroRequisicao sequencial automaticamente (ignora o que vem do DTO)
    const numeroRequisicao = await this.obterProximoNumeroRequisicao(contaCorrente.id);
    
    try {
      // Buscar conta corrente pelo ID
      const contaCorrente = await this.contaCorrenteService.findOne(dto.contaCorrenteId);

      if (!contaCorrente) {
        throw new NotFoundException(`Conta corrente ID ${dto.contaCorrenteId} não encontrada.`);
      }

      console.log(`🔍 [PAGAMENTOS-SERVICE] Conta selecionada: ID ${contaCorrente.id}, Agência ${contaCorrente.agencia}, Conta ${contaCorrente.contaCorrente}-${contaCorrente.contaCorrenteDigito}`);

      // Validar se a conta possui número de contrato de pagamentos configurado
      if (
        contaCorrente.numeroContratoPagamento === null ||
        contaCorrente.numeroContratoPagamento === undefined
      ) {
        throw new BadRequestException(
          `A conta corrente ID ${contaCorrente.id} não possui número de contrato de pagamentos configurado. ` +
          `Cadastre o número do contrato de pagamentos (Convênio PGT) para esta conta nas configurações antes de enviar pagamentos de boletos.`
        );
      }

      // Buscar credencial de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException('Credencial de pagamentos não cadastrada. Favor cadastrar as credenciais de pagamentos.');
      }

      // Encontrar credencial para esta conta
      const credencialPagamento = credenciaisPagamentos.find(c => c.contaCorrenteId === contaCorrente.id);
      
      if (!credencialPagamento) {
        throw new NotFoundException(
          `Credenciais de pagamentos não encontradas para a conta ${contaCorrente.contaCorrente} da agência ${contaCorrente.agencia}. Configure as credenciais para esta conta primeiro.`
        );
      }

      const codigoContrato = contaCorrente.numeroContratoPagamento;

      // Formatar datas dos lançamentos conforme documentação BB (ddmmaaaa, omitir zero à esquerda do dia)
      const { formatarDataParaAPIBB } = await import('../utils/formatters');
      
      const lancamentosFormatados = dto.lancamentos.map(lancamento => ({
        ...lancamento,
        // Garantir que a data está no formato correto (ddmmaaaa, sem zero à esquerda do dia)
        dataPagamento: formatarDataParaAPIBB(lancamento.dataPagamento),
      }));

      // Criar payload para envio ao BB (usando numeroRequisicao gerado e contrato da conta)
      const payloadBB = {
        numeroRequisicao,
        codigoContrato,
        numeroAgenciaDebito: dto.numeroAgenciaDebito,
        numeroContaCorrenteDebito: dto.numeroContaCorrenteDebito,
        digitoVerificadorContaCorrenteDebito: dto.digitoVerificadorContaCorrenteDebito,
        lancamentos: lancamentosFormatados,
      };

      // Calcular valores totais
      const quantidadeEnviada = lancamentosFormatados.length;
      const valorTotalEnviado = lancamentosFormatados.reduce((acc, l) => acc + parseFloat(l.valorPagamento || '0'), 0);

      // Criar lote no banco de dados ANTES de enviar ao BB
      const lote = await this.prisma.pagamentoApiLote.create({
        data: {
          numeroRequisicao,
          numeroContrato: codigoContrato,
          tipoPagamento: 128, // Pagamentos diversos (padrão para boleto)
          tipoPagamentoApi: TipoPagamentoApi.BOLETO,
          contaCorrenteId: contaCorrente.id,
          payloadEnviado: payloadBB as any,
          quantidadeEnviada,
          valorTotalEnviado,
          status: StatusPagamentoLote.PENDENTE,
        },
      });

      console.log(`💾 [PAGAMENTOS-SERVICE] Lote criado no banco: ID ${lote.id}, numeroRequisicao ${lote.numeroRequisicao}`);

      // Criar itens no banco de dados ANTES de enviar ao BB
      const itens = await Promise.all(
        lancamentosFormatados.map((lancamento, index) => {
          return this.prisma.pagamentoApiItem.create({
            data: {
              loteId: lote.id,
              indiceLote: index,
              valorEnviado: parseFloat(lancamento.valorPagamento || '0'),
              dataPagamentoEnviada: lancamento.dataPagamento,
              descricaoEnviada: lancamento.descricaoPagamento || null,
              numeroCodigoBarras: lancamento.numeroCodigoBarras,
              valorNominal: lancamento.valorNominal ? parseFloat(lancamento.valorNominal) : null,
              valorDesconto: lancamento.valorDesconto ? parseFloat(lancamento.valorDesconto) : null,
              valorMoraMulta: lancamento.valorMoraMulta ? parseFloat(lancamento.valorMoraMulta) : null,
              payloadItemEnviado: lancamento as any,
              status: StatusPagamentoItem.PENDENTE,
            },
          });
        })
      );

      console.log(`💾 [PAGAMENTOS-SERVICE] ${itens.length} item(ns) criado(s) no banco`);

      // Obter token de acesso com escopos para Boleto
      const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_BOLETO_REQUISICAO);

      // Criar cliente HTTP para API
      const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

      // Fazer requisição ao BB
      console.log(`🌐 [PAGAMENTOS-SERVICE] Enviando requisição para API BB: POST /lotes-boletos`);
      const response = await apiClient.post(
        '/lotes-boletos',
        payloadBB,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const respostaData = response.data as RespostaPagamentoBoletoDto;

      // Atualizar lote com resposta do BB
      const estadoRequisicao = respostaData?.estadoRequisicao;
      const quantidadeValida = respostaData?.quantidadeLancamentosValidos || 0;
      const valorTotalValido = respostaData?.valorLancamentosValidos || 0;
      const statusLote = this.mapearStatusLote(estadoRequisicao);

      await this.prisma.pagamentoApiLote.update({
        where: { id: lote.id },
        data: {
          payloadResposta: respostaData as any,
          estadoRequisicao,
          quantidadeValida,
          valorTotalValido,
          status: statusLote,
          // processadoComSucesso = true quando:
          // - Estado 1 (dados consistentes) ou 4 (aguardando liberação) - pronto para liberar
          // NÃO incluir estado 6 (processado) pois nesse caso já está concluído e não precisa mais de liberação
          processadoComSucesso: estadoRequisicao === 1 || estadoRequisicao === 4,
          dataProcessamento: new Date(),
        },
      });

      console.log(`💾 [PAGAMENTOS-SERVICE] Lote atualizado com resposta do BB: status ${statusLote}`);

      // Atualizar itens com resposta do BB
      if (respostaData?.lancamentos && Array.isArray(respostaData.lancamentos)) {
        await Promise.all(
          respostaData.lancamentos.map(async (boleto, index) => {
            const item = itens[index];
            if (!item) return;

            const indicadorAceite = boleto.indicadorAceite;
            const erros = boleto.erros || [];
            const statusItem = this.mapearStatusItem(indicadorAceite, erros);

            await this.prisma.pagamentoApiItem.update({
              where: { id: item.id },
              data: {
                codigoIdentificadorPagamento: boleto.codigoIdentificadorPagamento?.toString() || null,
                indicadorAceite,
                indicadorAceiteAtual: indicadorAceite,
                erros: erros.length > 0 ? erros as any : null,
                payloadItemResposta: boleto as any,
                payloadItemRespostaAtual: boleto as any,
                status: statusItem,
                ultimaAtualizacaoStatus: new Date(),
              },
            });
          })
        );

        console.log(`💾 [PAGAMENTOS-SERVICE] ${respostaData.lancamentos.length} item(ns) atualizado(s) com resposta do BB`);
      }

      console.log(`✅ [PAGAMENTOS-SERVICE] Pagamento de boleto solicitado com sucesso. Requisição: ${numeroRequisicao}`);
      
      return respostaData;

    } catch (error) {
      console.error('❌ [PAGAMENTOS-SERVICE] Erro ao solicitar pagamento de boleto:', {
        error: error.message,
        response: error.response?.data
      });

      // Se o lote foi criado, atualizar com erro
      try {
        const loteExistente = await this.prisma.pagamentoApiLote.findUnique({
          where: { numeroRequisicao },
        });

        if (loteExistente) {
          await this.prisma.pagamentoApiLote.update({
            where: { id: loteExistente.id },
            data: {
              status: StatusPagamentoLote.ERRO,
              erroProcessamento: error.message,
            },
          });
        }
      } catch (updateError) {
        console.error('❌ [PAGAMENTOS-SERVICE] Erro ao atualizar lote com erro:', updateError);
      }

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      if (error.response?.data) {
        throw new InternalServerErrorException(
          `Erro na API de pagamentos: ${error.response.data.message || error.response.data.error || 'Erro desconhecido'}`
        );
      }

      throw new InternalServerErrorException('Erro ao solicitar pagamento de boleto');
    }
  }

  /**
   * Solicita pagamento de guia com código de barras
   * @param dto Dados do pagamento de guia (contém contaCorrenteId para buscar credenciais)
   * @returns Resposta da API com status da solicitação
   */
  async solicitarPagamentoGuia(
    dto: SolicitarPagamentoGuiaDto
  ): Promise<RespostaPagamentoGuiaDto> {
    // Buscar conta corrente
    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id: dto.contaCorrenteId },
    });

    if (!contaCorrente) {
      throw new NotFoundException(`Conta corrente não encontrada (ID: ${dto.contaCorrenteId})`);
    }

    // Gerar numeroRequisicao sequencial automaticamente (ignora o que vem do DTO)
    const numeroRequisicao = await this.obterProximoNumeroRequisicao(contaCorrente.id);
    
    try {
      // Buscar conta corrente pelo ID
      const contaCorrente = await this.contaCorrenteService.findOne(dto.contaCorrenteId);

      if (!contaCorrente) {
        throw new NotFoundException(`Conta corrente ID ${dto.contaCorrenteId} não encontrada.`);
      }

      console.log(`🔍 [PAGAMENTOS-SERVICE] Conta selecionada: ID ${contaCorrente.id}, Agência ${contaCorrente.agencia}, Conta ${contaCorrente.contaCorrente}-${contaCorrente.contaCorrenteDigito}`);

      // Validar se a conta possui número de contrato de pagamentos configurado
      if (
        contaCorrente.numeroContratoPagamento === null ||
        contaCorrente.numeroContratoPagamento === undefined
      ) {
        throw new BadRequestException(
          `A conta corrente ID ${contaCorrente.id} não possui número de contrato de pagamentos configurado. ` +
          `Cadastre o número do contrato de pagamentos (Convênio PGT) para esta conta nas configurações antes de enviar pagamentos de guias.`
        );
      }

      // Buscar credencial de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException('Credencial de pagamentos não cadastrada. Favor cadastrar as credenciais de pagamentos.');
      }

      // Encontrar credencial para esta conta
      const credencialPagamento = credenciaisPagamentos.find(c => c.contaCorrenteId === contaCorrente.id);
      
      if (!credencialPagamento) {
        throw new NotFoundException(
          `Credenciais de pagamentos não encontradas para a conta ${contaCorrente.contaCorrente} da agência ${contaCorrente.agencia}. Configure as credenciais para esta conta primeiro.`
        );
      }

      const codigoContrato = contaCorrente.numeroContratoPagamento;

      // Formatar datas dos lançamentos conforme documentação BB (ddmmaaaa, omitir zero à esquerda do dia)
      const { formatarDataParaAPIBB } = await import('../utils/formatters');
      
      const lancamentosFormatados = dto.lancamentos.map(lancamento => ({
        ...lancamento,
        // Garantir que a data está no formato correto (ddmmaaaa, sem zero à esquerda do dia)
        dataPagamento: formatarDataParaAPIBB(lancamento.dataPagamento),
      }));

      // Criar payload para envio ao BB (usando numeroRequisicao gerado e contrato da conta)
      const payloadBB = {
        numeroRequisicao,
        codigoContrato,
        numeroAgenciaDebito: dto.numeroAgenciaDebito,
        numeroContaCorrenteDebito: dto.numeroContaCorrenteDebito,
        digitoVerificadorContaCorrenteDebito: dto.digitoVerificadorContaCorrenteDebito,
        lancamentos: lancamentosFormatados,
      };

      // Calcular valores totais
      const quantidadeEnviada = lancamentosFormatados.length;
      const valorTotalEnviado = lancamentosFormatados.reduce((acc, l) => acc + parseFloat(l.valorPagamento || '0'), 0);

      // Criar lote no banco de dados ANTES de enviar ao BB
      const lote = await this.prisma.pagamentoApiLote.create({
        data: {
          numeroRequisicao,
          numeroContrato: codigoContrato,
          tipoPagamento: 128, // Pagamentos diversos (padrão para guia)
          tipoPagamentoApi: TipoPagamentoApi.GUIA,
          contaCorrenteId: contaCorrente.id,
          payloadEnviado: payloadBB as any,
          quantidadeEnviada,
          valorTotalEnviado,
          status: StatusPagamentoLote.PENDENTE,
        },
      });

      console.log(`💾 [PAGAMENTOS-SERVICE] Lote criado no banco: ID ${lote.id}, numeroRequisicao ${lote.numeroRequisicao}`);

      // Criar itens no banco de dados ANTES de enviar ao BB
      const itens = await Promise.all(
        lancamentosFormatados.map((lancamento, index) => {
          return this.prisma.pagamentoApiItem.create({
            data: {
              loteId: lote.id,
              indiceLote: index,
              valorEnviado: parseFloat(lancamento.valorPagamento || '0'),
              dataPagamentoEnviada: lancamento.dataPagamento,
              descricaoEnviada: lancamento.descricaoPagamento || null,
              codigoBarrasGuia: lancamento.codigoBarras,
              payloadItemEnviado: lancamento as any,
              status: StatusPagamentoItem.PENDENTE,
            },
          });
        })
      );

      console.log(`💾 [PAGAMENTOS-SERVICE] ${itens.length} item(ns) criado(s) no banco`);

      // Obter token de acesso com escopos para Guia
      const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_GUIA_REQUISICAO);

      // Criar cliente HTTP para API
      const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

      // Fazer requisição ao BB
      console.log(`🌐 [PAGAMENTOS-SERVICE] Enviando requisição para API BB: POST /lotes-guias-codigo-barras`);
      const response = await apiClient.post(
        '/lotes-guias-codigo-barras',
        payloadBB,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const respostaData = response.data as RespostaPagamentoGuiaDto;

      // Atualizar lote com resposta do BB
      const estadoRequisicao = respostaData?.estadoRequisicao;
      const quantidadeValida = respostaData?.quantidadeLancamentosValidos || 0;
      const valorTotalValido = respostaData?.valorLancamentosValidos || 0;
      const statusLote = this.mapearStatusLote(estadoRequisicao);

      await this.prisma.pagamentoApiLote.update({
        where: { id: lote.id },
        data: {
          payloadResposta: respostaData as any,
          estadoRequisicao,
          quantidadeValida,
          valorTotalValido,
          status: statusLote,
          // processadoComSucesso = true quando:
          // - Estado 1 (dados consistentes) ou 4 (aguardando liberação) - pronto para liberar
          // NÃO incluir estado 6 (processado) pois nesse caso já está concluído e não precisa mais de liberação
          processadoComSucesso: estadoRequisicao === 1 || estadoRequisicao === 4,
          dataProcessamento: new Date(),
        },
      });

      console.log(`💾 [PAGAMENTOS-SERVICE] Lote atualizado com resposta do BB: status ${statusLote}`);

      // Atualizar itens com resposta do BB
      if (respostaData?.lancamentos && Array.isArray(respostaData.lancamentos)) {
        await Promise.all(
          respostaData.lancamentos.map(async (guia, index) => {
            const item = itens[index];
            if (!item) return;

            const indicadorAceiteGuia = guia.indicadorAceite;
            const erros = guia.erros || [];
            const statusItem = this.mapearStatusItem(indicadorAceiteGuia, erros);

            await this.prisma.pagamentoApiItem.update({
              where: { id: item.id },
              data: {
                codigoPagamento: guia.codigoPagamento?.toString() || null,
                nomeBeneficiario: guia.nomeBeneficiario || null,
                indicadorAceiteGuia,
                indicadorAceiteGuiaAtual: indicadorAceiteGuia,
                erros: erros.length > 0 ? erros as any : null,
                payloadItemResposta: guia as any,
                payloadItemRespostaAtual: guia as any,
                status: statusItem,
                ultimaAtualizacaoStatus: new Date(),
              },
            });
          })
        );

        console.log(`💾 [PAGAMENTOS-SERVICE] ${respostaData.lancamentos.length} item(ns) atualizado(s) com resposta do BB`);
      }

      console.log(`✅ [PAGAMENTOS-SERVICE] Pagamento de guia solicitado com sucesso. Requisição: ${numeroRequisicao}`);
      
      return respostaData;

    } catch (error) {
      console.error('❌ [PAGAMENTOS-SERVICE] Erro ao solicitar pagamento de guia:', {
        error: error.message,
        response: error.response?.data
      });

      // Se o lote foi criado, atualizar com erro
      try {
        const loteExistente = await this.prisma.pagamentoApiLote.findUnique({
          where: { numeroRequisicao },
        });

        if (loteExistente) {
          await this.prisma.pagamentoApiLote.update({
            where: { id: loteExistente.id },
            data: {
              status: StatusPagamentoLote.ERRO,
              erroProcessamento: error.message,
            },
          });
        }
      } catch (updateError) {
        console.error('❌ [PAGAMENTOS-SERVICE] Erro ao atualizar lote com erro:', updateError);
      }

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      if (error.response?.data) {
        throw new InternalServerErrorException(
          `Erro na API de pagamentos: ${error.response.data.message || error.response.data.error || 'Erro desconhecido'}`
        );
      }

      throw new InternalServerErrorException('Erro ao solicitar pagamento de guia');
    }
  }

  /**
   * Consulta online a solicitação de transferência PIX diretamente na API do BB
   * e atualiza o status no banco de dados local com os dados mais recentes.
   * IMPORTANTE: Busca APENAS na conta vinculada ao lote, não tenta todas as contas.
   */
  async consultarSolicitacaoTransferenciaPixOnline(
    numeroRequisicao: number,
    contaCorrenteId?: number
  ): Promise<RespostaTransferenciaPixDto> {
    try {
      // Buscar lote no banco de dados para obter a conta vinculada e itens
      const lote = await this.prisma.pagamentoApiLote.findUnique({
        where: { numeroRequisicao },
        include: {
          contaCorrente: true,
          itensPagamento: {
            orderBy: { indiceLote: 'asc' },
          },
        },
      });

      if (!lote) {
        throw new NotFoundException(`Lote com número de requisição ${numeroRequisicao} não encontrado no banco de dados.`);
      }

      // Usar a conta vinculada ao lote (contaCorrenteId do parâmetro é ignorado por segurança)
      const contaId = lote.contaCorrenteId;

      if (!contaId) {
        throw new BadRequestException(`Lote ${numeroRequisicao} não possui conta corrente vinculada.`);
      }

      // Buscar credenciais de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException('Credencial de pagamentos não cadastrada.');
      }

      // Buscar conta corrente vinculada ao lote
      const contaCorrente = await this.contaCorrenteService.findOne(contaId);
      if (!contaCorrente) {
        throw new NotFoundException(`Conta corrente ID ${contaId} vinculada ao lote não encontrada.`);
      }

      // Buscar credencial de pagamentos para a conta vinculada ao lote
      const credencialPagamento = credenciaisPagamentos.find(c => c.contaCorrenteId === contaId);
      
      if (!credencialPagamento) {
        throw new NotFoundException(`Credenciais de pagamentos não encontradas para a conta ${contaCorrente.contaCorrente} da agência ${contaCorrente.agencia} vinculada ao lote.`);
      }

      // Obter token e fazer consulta na conta correta
      const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_PIX_INFO);
      const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

      console.log(`🌐 [PAGAMENTOS-SERVICE] Consultando solicitação online: GET /lotes-transferencias-pix/${numeroRequisicao}/solicitacao`);
      console.log(`📋 [PAGAMENTOS-SERVICE] Usando conta vinculada ao lote: Agência ${contaCorrente.agencia} / Conta ${contaCorrente.contaCorrente}`);

      const response = await apiClient.get(
        `/lotes-transferencias-pix/${numeroRequisicao}/solicitacao`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ========================================
      // LOG DETALHADO DA RESPOSTA COMPLETA DA API BB
      // ========================================
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ [PAGAMENTOS-SERVICE] CONSULTA ONLINE - RESPOSTA COMPLETA DA API BB:');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('Status HTTP:', response.status, response.statusText);
      console.log('Headers:', JSON.stringify(response.headers, null, 2));
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📦 JSON COMPLETO RETORNADO PELA API DO BB:');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('═══════════════════════════════════════════════════════════════');
      // Log adicional para facilitar cópia do JSON
      console.log('📋 [JSON RAW - Pode copiar diretamente]:');
      console.log(JSON.stringify(response.data));
      console.log('═══════════════════════════════════════════════════════════════');
      
      const respostaData = response.data as RespostaTransferenciaPixDto;
      
      // Log resumido dos dados principais
      console.log('📊 RESUMO DA CONSULTA ONLINE:');
      console.log(`  📋 Número Requisição: ${respostaData.numeroRequisicao || 'N/A'}`);
      console.log(`  📊 Estado Requisição: ${respostaData.estadoRequisicao || 'N/A'}`);
      console.log(`  📦 Quantidade Total de Transferências: ${respostaData.quantidadeTransferencias || 0}`);
      console.log(`  💰 Valor Total das Transferências: R$ ${respostaData.valorTransferencias || '0.00'}`);
      console.log(`  ✅ Quantidade de Transferências Válidas: ${respostaData.quantidadeTransferenciasValidas || 0}`);
      console.log(`  💵 Valor Total das Transferências Válidas: R$ ${respostaData.valorTransferenciasValidas || '0.00'}`);
      
      if (respostaData.listaTransferencias && respostaData.listaTransferencias.length > 0) {
        console.log(`  📋 Detalhes das ${respostaData.listaTransferencias.length} transferência(s):`);
        respostaData.listaTransferencias.forEach((transferencia, index) => {
          console.log(`    ${index + 1}. Identificador: ${transferencia.identificadorPagamento || 'N/A'}`);
          console.log(`       Valor: R$ ${transferencia.valor || '0.00'}`);
          console.log(`       Data: ${transferencia.data || 'N/A'}`);
          console.log(`       Movimento Aceito: ${transferencia.indicadorMovimentoAceito || 'N/A'}`);
          if (transferencia.erros && transferencia.erros.length > 0) {
            console.log(`       ⚠️ Erros: ${JSON.stringify(transferencia.erros)}`);
          }
          if (transferencia.descricaoPagamento) {
            console.log(`       Descrição: ${transferencia.descricaoPagamento}`);
          }
        });
      } else {
        console.log(`  ⚠️ Nenhuma transferência encontrada na lista`);
      }
      
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`✅ [PAGAMENTOS-SERVICE] Consulta online realizada com sucesso para requisição ${numeroRequisicao}`);
      console.log('═══════════════════════════════════════════════════════════════');

      // Atualizar lote com resposta mais recente
      const estadoAnterior =
        typeof lote.estadoRequisicaoAtual === 'number'
          ? lote.estadoRequisicaoAtual
          : typeof lote.estadoRequisicao === 'number'
            ? lote.estadoRequisicao
            : null;
      const estadoRequisicaoApi =
        typeof respostaData?.estadoRequisicao === 'number'
          ? respostaData.estadoRequisicao
          : null;
      
      /**
       * IMPORTANTE: Aceitar sempre o estado retornado pelo BB, pois os estados NÃO seguem sequência numérica.
       * 
       * Sequência REAL dos estados do Banco do Brasil:
       * 1. Estados iniciais (validação): 1, 2, 3
       * 2. Estado 8: "Preparando remessa não liberada"
       * 3. Estado 4: "Requisição pendente de ação pelo Conveniado" (aguarda autorização)
       * 4. Estados 9 ou 10: "Requisição liberada via API" / "Preparando remessa liberada"
       * 5. Estados finais: 6 (Processada) ou 7 (Rejeitada)
       * 
       * NÃO podemos comparar numericamente (ex: 8 > 4), pois o estado 4 vem DEPOIS do 8 no fluxo real.
       * O BB é a fonte da verdade, então sempre aceitamos o estado que ele retorna.
       */
      const estadoRequisicao = estadoRequisicaoApi ?? estadoAnterior;

      const quantidadeValida = respostaData?.quantidadeTransferenciasValidas || 0;
      const valorTotalValido = respostaData?.valorTransferenciasValidas || 0;
      const statusLote = this.mapearStatusLote(estadoRequisicao);
      const finalizado = estadoRequisicao === 6;

      await this.prisma.pagamentoApiLote.update({
        where: { id: lote.id },
        data: {
          payloadRespostaAtual: respostaData as any,
          estadoRequisicaoAtual: estadoRequisicao,
          quantidadeValida,
          valorTotalValido,
          status: statusLote,
          processadoComSucesso: finalizado,
          ultimaConsultaStatus: new Date(),
        },
      });

      // Atualizar itens com resposta mais recente
      if (respostaData?.listaTransferencias && Array.isArray(respostaData.listaTransferencias)) {
        await Promise.all(
          respostaData.listaTransferencias.map(async (transferencia, index) => {
            const item = lote.itensPagamento[index];
            if (!item) return;

            const indicadorMovimentoAceito = transferencia.indicadorMovimentoAceito;
            const erros = transferencia.erros || [];
            const statusItem = this.mapearStatusItem(indicadorMovimentoAceito, erros);

            await this.prisma.pagamentoApiItem.update({
              where: { id: item.id },
              data: {
                identificadorPagamento: transferencia.identificadorPagamento != null ? String(transferencia.identificadorPagamento) : item.identificadorPagamento,
                indicadorMovimentoAceitoAtual: indicadorMovimentoAceito,
                erros: erros.length > 0 ? erros as any : item.erros,
                payloadItemRespostaAtual: transferencia as any,
                status: statusItem,
                ultimaAtualizacaoStatus: new Date(),
              },
            });

            // Sincronizar status com FuncionarioPagamento se vinculado
            if (item.funcionarioPagamentoId) {
              const funcionarioStatus = this.mapearStatusItemParaFuncionarioPagamento(statusItem, finalizado);
              if (funcionarioStatus) {
                await this.prisma.funcionarioPagamento.update({
                  where: { id: item.funcionarioPagamentoId },
                  data: funcionarioStatus,
                });
                console.log(`👤 [PAGAMENTOS-SERVICE] FuncionarioPagamento ${item.funcionarioPagamentoId} atualizado: status=${funcionarioStatus.statusPagamento}`);
              }
            }
          })
        );
      }

      console.log(`💾 [PAGAMENTOS-SERVICE] Lote ${numeroRequisicao} atualizado no banco: estadoRequisicaoAtual=${estadoRequisicao}, status=${statusLote}`);

      return respostaData;

    } catch (error) {
      console.error('❌ [PAGAMENTOS-SERVICE] Erro ao consultar solicitação online de transferência PIX:', {
        error: error.message,
        response: error.response?.data
      });

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao consultar solicitação online de transferência PIX');
    }
  }

  /**
   * Consulta status de solicitação de pagamento de boleto
   * Atualiza o lote e itens no banco de dados com a resposta mais recente
   * @param numeroRequisicao Número da requisição
   * @param contaCorrenteId ID da conta corrente (opcional, busca no banco se não informado)
   * @returns Status da solicitação
   */
  async consultarStatusPagamentoBoleto(
    numeroRequisicao: number,
    contaCorrenteId?: number
  ): Promise<RespostaPagamentoBoletoDto> {
    try {
      // Buscar lote no banco de dados
      const lote = await this.prisma.pagamentoApiLote.findUnique({
        where: { numeroRequisicao },
        include: {
          itensPagamento: {
            orderBy: { indiceLote: 'asc' },
          },
        },
      });

      // Se lote não existe no banco, buscar em todas as contas
      if (!lote) {
        return await this.consultarStatusPagamentoBoletoSemLote(numeroRequisicao, contaCorrenteId);
      }

      // Usar contaCorrenteId do lote se não foi informado
      const contaId = contaCorrenteId || lote.contaCorrenteId;

      // Buscar credenciais de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException('Credencial de pagamentos não cadastrada.');
      }

      const contaCorrente = await this.contaCorrenteService.findOne(contaId);
      const credencialPagamento = credenciaisPagamentos.find(c => c.contaCorrenteId === contaCorrente.id);
      
      if (!credencialPagamento) {
        throw new NotFoundException('Credenciais de pagamentos não encontradas para esta conta.');
      }

      const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_BOLETO_INFO);
      const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

      // Consultar status no BB
      const response = await apiClient.get(
        `/lotes-boletos/${numeroRequisicao}/solicitacao`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const respostaData = response.data as RespostaPagamentoBoletoDto;

      // Atualizar lote com resposta mais recente
      const estadoRequisicao = respostaData?.estadoRequisicao;
      const quantidadeValida = respostaData?.quantidadeLancamentosValidos || 0;
      const valorTotalValido = respostaData?.valorLancamentosValidos || 0;
      const statusLote = this.mapearStatusLote(estadoRequisicao);

      await this.prisma.pagamentoApiLote.update({
        where: { id: lote.id },
        data: {
          payloadRespostaAtual: respostaData as any,
          estadoRequisicaoAtual: estadoRequisicao,
          quantidadeValida,
          valorTotalValido,
          status: statusLote,
          // processadoComSucesso = true quando:
          // - Estado 1 (dados consistentes) ou 4 (aguardando liberação) - pronto para liberar
          // NÃO incluir estado 6 (processado) pois nesse caso já está concluído e não precisa mais de liberação
          processadoComSucesso: estadoRequisicao === 1 || estadoRequisicao === 4,
          ultimaConsultaStatus: new Date(),
        },
      });

      // Atualizar itens com resposta mais recente
      if (respostaData?.lancamentos && Array.isArray(respostaData.lancamentos)) {
        await Promise.all(
          respostaData.lancamentos.map(async (boleto, index) => {
            const item = lote.itensPagamento[index];
            if (!item) return;

            const indicadorAceite = boleto.indicadorAceite;
            const erros = boleto.erros || [];
            const statusItem = this.mapearStatusItem(indicadorAceite, erros);

            await this.prisma.pagamentoApiItem.update({
              where: { id: item.id },
              data: {
                codigoIdentificadorPagamento: boleto.codigoIdentificadorPagamento?.toString() || item.codigoIdentificadorPagamento,
                indicadorAceiteAtual: indicadorAceite,
                erros: erros.length > 0 ? erros as any : item.erros,
                payloadItemRespostaAtual: boleto as any,
                status: statusItem,
                ultimaAtualizacaoStatus: new Date(),
              },
            });
          })
        );
      }

      console.log(`💾 [PAGAMENTOS-SERVICE] Lote ${numeroRequisicao} (Boleto) atualizado com status mais recente`);
      
      return respostaData;

    } catch (error) {
      console.error('❌ [PAGAMENTOS-SERVICE] Erro ao consultar status de pagamento de boleto:', {
        error: error.message,
        response: error.response?.data
      });

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao consultar status de pagamento de boleto');
    }
  }

  /**
   * Consulta status de pagamento de boleto quando o lote não existe no banco
   * (caso de lotes criados antes da implementação da persistência)
   */
  private async consultarStatusPagamentoBoletoSemLote(
    numeroRequisicao: number,
    contaCorrenteId?: number
  ): Promise<RespostaPagamentoBoletoDto> {
      // Buscar credenciais de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException('Credencial de pagamentos não cadastrada.');
      }

      // Se contaCorrenteId foi informado, usar apenas essa conta
      if (contaCorrenteId) {
        const contaCorrente = await this.contaCorrenteService.findOne(contaCorrenteId);
        const credencialPagamento = credenciaisPagamentos.find(c => c.contaCorrenteId === contaCorrente.id);
        
        if (!credencialPagamento) {
          throw new NotFoundException('Credenciais de pagamentos não encontradas para esta conta.');
        }

        const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_BOLETO_INFO);
        const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

        const response = await apiClient.get(
          `/lotes-boletos/${numeroRequisicao}/solicitacao`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        return response.data as RespostaPagamentoBoletoDto;
      }

      // Se não informou contaCorrenteId, tentar todas as contas até encontrar a requisição
      for (const credencialPagamento of credenciaisPagamentos) {
        try {
          const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_BOLETO_INFO);
          const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

          const response = await apiClient.get(
            `/lotes-boletos/${numeroRequisicao}/solicitacao`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          return response.data as RespostaPagamentoBoletoDto;
        } catch (error) {
          // Se erro 404, continua tentando outras contas
          if (error.response?.status === 404) {
            continue;
          }
          // Se outro erro, propaga
          throw error;
        }
      }

      throw new NotFoundException(`Requisição ${numeroRequisicao} não encontrada em nenhuma conta cadastrada.`);
  }

  /**
   * Consulta status de solicitação de pagamento de guia
   * Atualiza o lote e itens no banco de dados com a resposta mais recente
   * @param numeroRequisicao Número da requisição
   * @param contaCorrenteId ID da conta corrente (opcional, busca no banco se não informado)
   * @returns Status da solicitação
   */
  async consultarStatusPagamentoGuia(
    numeroRequisicao: number,
    contaCorrenteId?: number
  ): Promise<RespostaPagamentoGuiaDto> {
    try {
      // Buscar lote no banco de dados
      const lote = await this.prisma.pagamentoApiLote.findUnique({
        where: { numeroRequisicao },
        include: {
          itensPagamento: {
            orderBy: { indiceLote: 'asc' },
          },
        },
      });

      // Se lote não existe no banco, buscar em todas as contas
      if (!lote) {
        return await this.consultarStatusPagamentoGuiaSemLote(numeroRequisicao, contaCorrenteId);
      }

      // Usar contaCorrenteId do lote se não foi informado
      const contaId = contaCorrenteId || lote.contaCorrenteId;

      // Buscar credenciais de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException('Credencial de pagamentos não cadastrada.');
      }

      const contaCorrente = await this.contaCorrenteService.findOne(contaId);
      const credencialPagamento = credenciaisPagamentos.find(c => c.contaCorrenteId === contaCorrente.id);
      
      if (!credencialPagamento) {
        throw new NotFoundException('Credenciais de pagamentos não encontradas para esta conta.');
      }

      const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_GUIA_INFO);
      const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

      // Consultar status no BB
      const response = await apiClient.get(
        `/lotes-guias-codigo-barras/${numeroRequisicao}/solicitacao`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const respostaData = response.data as RespostaPagamentoGuiaDto;

      // Atualizar lote com resposta mais recente
      const estadoRequisicao = respostaData?.estadoRequisicao;
      const quantidadeValida = respostaData?.quantidadeLancamentosValidos || 0;
      const valorTotalValido = respostaData?.valorLancamentosValidos || 0;
      const statusLote = this.mapearStatusLote(estadoRequisicao);

      await this.prisma.pagamentoApiLote.update({
        where: { id: lote.id },
        data: {
          payloadRespostaAtual: respostaData as any,
          estadoRequisicaoAtual: estadoRequisicao,
          quantidadeValida,
          valorTotalValido,
          status: statusLote,
          // processadoComSucesso = true quando:
          // - Estado 1 (dados consistentes) ou 4 (aguardando liberação) - pronto para liberar
          // NÃO incluir estado 6 (processado) pois nesse caso já está concluído e não precisa mais de liberação
          processadoComSucesso: estadoRequisicao === 1 || estadoRequisicao === 4,
          ultimaConsultaStatus: new Date(),
        },
      });

      // Atualizar itens com resposta mais recente
      if (respostaData?.lancamentos && Array.isArray(respostaData.lancamentos)) {
        await Promise.all(
          respostaData.lancamentos.map(async (guia, index) => {
            const item = lote.itensPagamento[index];
            if (!item) return;

            const indicadorAceiteGuia = guia.indicadorAceite;
            const erros = guia.erros || [];
            const statusItem = this.mapearStatusItem(indicadorAceiteGuia, erros);

            await this.prisma.pagamentoApiItem.update({
              where: { id: item.id },
              data: {
                codigoPagamento: guia.codigoPagamento?.toString() || item.codigoPagamento,
                nomeBeneficiario: guia.nomeBeneficiario || item.nomeBeneficiario,
                indicadorAceiteGuiaAtual: indicadorAceiteGuia,
                erros: erros.length > 0 ? erros as any : item.erros,
                payloadItemRespostaAtual: guia as any,
                status: statusItem,
                ultimaAtualizacaoStatus: new Date(),
              },
            });
          })
        );
      }

      console.log(`💾 [PAGAMENTOS-SERVICE] Lote ${numeroRequisicao} (Guia) atualizado com status mais recente`);
      
      return respostaData;

    } catch (error) {
      console.error('❌ [PAGAMENTOS-SERVICE] Erro ao consultar status de pagamento de guia:', {
        error: error.message,
        response: error.response?.data
      });

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao consultar status de pagamento de guia');
    }
  }

  /**
   * Consulta status de pagamento de guia quando o lote não existe no banco
   * (caso de lotes criados antes da implementação da persistência)
   */
  private async consultarStatusPagamentoGuiaSemLote(
    numeroRequisicao: number,
    contaCorrenteId?: number
  ): Promise<RespostaPagamentoGuiaDto> {
      // Buscar credenciais de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException('Credencial de pagamentos não cadastrada.');
      }

      // Se contaCorrenteId foi informado, usar apenas essa conta
      if (contaCorrenteId) {
        const contaCorrente = await this.contaCorrenteService.findOne(contaCorrenteId);
        const credencialPagamento = credenciaisPagamentos.find(c => c.contaCorrenteId === contaCorrente.id);
        
        if (!credencialPagamento) {
          throw new NotFoundException('Credenciais de pagamentos não encontradas para esta conta.');
        }

        const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_GUIA_INFO);
        const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

        const response = await apiClient.get(
          `/lotes-guias-codigo-barras/${numeroRequisicao}/solicitacao`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        return response.data as RespostaPagamentoGuiaDto;
      }

      // Se não informou contaCorrenteId, tentar todas as contas até encontrar a requisição
      for (const credencialPagamento of credenciaisPagamentos) {
        try {
          const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_GUIA_INFO);
          const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

          const response = await apiClient.get(
            `/lotes-guias-codigo-barras/${numeroRequisicao}/solicitacao`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          return response.data as RespostaPagamentoGuiaDto;
        } catch (error) {
          // Se erro 404, continua tentando outras contas
          if (error.response?.status === 404) {
            continue;
          }
          // Se outro erro, propaga
          throw error;
        }
      }

      throw new NotFoundException(`Requisição ${numeroRequisicao} não encontrada em nenhuma conta cadastrada.`);
  }

  /**
   * Consulta status individual de transferência PIX
   * @param identificadorPagamento Identificador do pagamento PIX (retornado pelo BB)
   * @param contaCorrenteId ID da conta corrente (opcional, busca no banco se não informado)
   * @returns Status individual do pagamento
   */
  async consultarStatusTransferenciaIndividual(
    identificadorPagamento: string,
    contaCorrenteId?: number
  ): Promise<any> {
    try {
      // Buscar item no banco de dados pelo identificadorPagamento
      const item = await this.prisma.pagamentoApiItem.findFirst({
        where: { identificadorPagamento },
        include: {
          lote: {
            include: {
              contaCorrente: true,
            },
          },
        },
      });

      // Se item não existe, usar contaCorrenteId informado ou buscar em todas as contas
      const contaId = item ? item.lote.contaCorrenteId : contaCorrenteId;

      // Buscar credenciais de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException('Credencial de pagamentos não cadastrada.');
      }

      // Se contaId foi informado ou encontrado no banco, usar essa conta
      if (contaId) {
        const contaCorrente = await this.contaCorrenteService.findOne(contaId);
        const credencialPagamento = credenciaisPagamentos.find(c => c.contaCorrenteId === contaCorrente.id);
        
        if (!credencialPagamento) {
          throw new NotFoundException('Credenciais de pagamentos não encontradas para esta conta.');
        }

        const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_PIX_INFO);
        const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

        // Segundo a documentação, agencia, contaCorrente e digitoVerificador são opcionais
        // quando a solicitação é acessada pelo código de autorização no fluxo do OAuth.
        // Como estamos usando OAuth, não precisamos enviar esses parâmetros.
        const identificadorParaURL = identificadorPagamento != null ? String(identificadorPagamento).trim() : null;
        
        console.log(`🌐 [PAGAMENTOS-SERVICE] Consultando item individual PIX: GET /pix/${identificadorParaURL}`);

        try {
          const response = await apiClient.get(
            `/pix/${identificadorParaURL}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // ========================================
          // LOG DETALHADO DA RESPOSTA COMPLETA DA API BB
          // ========================================
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('✅ [PAGAMENTOS-SERVICE] CONSULTA INDIVIDUAL PIX - RESPOSTA COMPLETA DA API BB:');
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('Status HTTP:', response.status, response.statusText);
          console.log('Headers:', JSON.stringify(response.headers, null, 2));
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('📦 JSON COMPLETO RETORNADO PELA API DO BB:');
          console.log('═══════════════════════════════════════════════════════════════');
          console.log(JSON.stringify(response.data, null, 2));
          console.log('═══════════════════════════════════════════════════════════════');
          // Log adicional para facilitar cópia do JSON
          console.log('📋 [JSON RAW - Pode copiar diretamente]:');
          console.log(JSON.stringify(response.data));
          console.log('═══════════════════════════════════════════════════════════════');

          const respostaData = response.data as any;

          if (item) {
            await this.sincronizarItemPixComResposta(item, respostaData);
          }

          return respostaData;
        } catch (error) {
          const errorStatus = error.response?.status;
          const errorData = error.response?.data;
          
          // Erro 401/403: problema de autenticação - invalidar cache e tentar novamente
          if (errorStatus === 401 || errorStatus === 403) {
            console.log(`⚠️ [PAGAMENTOS-SERVICE] Erro ${errorStatus} ao consultar item individual. Invalidando cache de token e tentando novamente...`);
            this.invalidarCacheToken(credencialPagamento.id, this.SCOPES_PIX_INFO);
            const newToken = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_PIX_INFO, true);
            
            const response = await apiClient.get(
              `/pix/${identificadorParaURL}`,
              {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );

            // ========================================
            // LOG DETALHADO DA RESPOSTA COMPLETA DA API BB (RETRY)
            // ========================================
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('✅ [PAGAMENTOS-SERVICE] CONSULTA INDIVIDUAL PIX - RESPOSTA COMPLETA DA API BB (RETRY):');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('Status HTTP:', response.status, response.statusText);
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('📦 JSON COMPLETO RETORNADO PELA API DO BB:');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log(JSON.stringify(response.data, null, 2));
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('📋 [JSON RAW - Pode copiar diretamente]:');
            console.log(JSON.stringify(response.data));
            console.log('═══════════════════════════════════════════════════════════════');

            const respostaData = response.data as any;

            if (item) {
              await this.sincronizarItemPixComResposta(item, respostaData);
            }

            return respostaData;
          }

          // Erro 400/404: item não encontrado ou ainda não processado pelo BB
          // Verificar se é erro de "não localizado" (código 1000) - item ainda não disponível
          const isItemNaoDisponivel = errorStatus === 400 || errorStatus === 404;
          const codigoErro = errorData?.erros?.[0]?.codigo;
          
          if (isItemNaoDisponivel && (codigoErro === '1000' || errorStatus === 404)) {
            throw new BadRequestException(
              'O item de pagamento ainda não está disponível para consulta individual. ' +
              'Aguarde alguns minutos após a liberação do pagamento e tente novamente.'
            );
          }

          // Outros erros: propagar
          throw error;
        }
      }

      // Se não informou contaCorrenteId e não encontrou no banco, tentar todas as contas
      for (const credencialPagamento of credenciaisPagamentos) {
        try {
          const contaCorrente = await this.contaCorrenteService.findOne(credencialPagamento.contaCorrenteId);
          const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_PIX_INFO);
          const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);
          const identificadorParaURL = identificadorPagamento != null ? String(identificadorPagamento).trim() : null;

          const response = await apiClient.get(
            `/pix/${identificadorParaURL}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // ========================================
          // LOG DETALHADO DA RESPOSTA COMPLETA DA API BB (TENTATIVA EM TODAS AS CONTAS)
          // ========================================
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('✅ [PAGAMENTOS-SERVICE] CONSULTA INDIVIDUAL PIX - RESPOSTA COMPLETA DA API BB (TENTATIVA EM TODAS AS CONTAS):');
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('Status HTTP:', response.status, response.statusText);
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('📦 JSON COMPLETO RETORNADO PELA API DO BB:');
          console.log('═══════════════════════════════════════════════════════════════');
          console.log(JSON.stringify(response.data, null, 2));
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('📋 [JSON RAW - Pode copiar diretamente]:');
          console.log(JSON.stringify(response.data));
          console.log('═══════════════════════════════════════════════════════════════');

          return response.data as any;
        } catch (error) {
          // Se erro 404, continua tentando outras contas
          if (error.response?.status === 404) {
            continue;
          }
          // Se outro erro, propaga
          throw error;
        }
      }

      throw new NotFoundException(`Pagamento ${identificadorPagamento} não encontrado em nenhuma conta cadastrada.`);

    } catch (error) {
      // Se já é uma exceção do NestJS, propagar
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      // Log do erro para diagnóstico
      console.error('❌ [PAGAMENTOS-SERVICE] Erro ao consultar status individual de transferência PIX:', {
        error: error.message,
        status: error.response?.status,
        response: error.response?.data,
        identificadorPagamento,
      });

      // Se erro 400/404, tratar como item não disponível
      const errorStatus = error.response?.status;
      const errorData = error.response?.data;
      const codigoErro = errorData?.erros?.[0]?.codigo;
      
      if ((errorStatus === 400 || errorStatus === 404) && (codigoErro === '1000' || errorStatus === 404)) {
        throw new BadRequestException(
          'O item de pagamento ainda não está disponível para consulta individual. ' +
          'Aguarde alguns minutos após a liberação do pagamento e tente novamente.'
        );
      }

      throw new InternalServerErrorException(
        error.response?.data?.message || 'Erro ao consultar status individual de transferência PIX'
      );
    }
  }

  private async sincronizarItemPixComResposta(
    item: {
      id: number;
      status: StatusPagamentoItem;
      loteId?: number | null;
      lote?: { id: number } | null;
    },
    respostaData: any,
  ): Promise<void> {
    const estadoOriginal = respostaData?.estadoPagamento || null;
    const estadoNormalizado = this.normalizarEstadoPagamentoPix(estadoOriginal);
    const categoriaEstado =
      this.classificarEstadoPagamentoPix(estadoNormalizado);
    const dataPagamento = this.converterDataPagamentoBB(
      respostaData?.dataPagamento,
    );

    const dadosAtualizacao: Prisma.PagamentoApiItemUpdateInput = {
      estadoPagamentoIndividual: estadoOriginal,
      payloadConsultaIndividual: respostaData || null,
      payloadItemRespostaAtual: respostaData || null,
      ultimaConsultaIndividual: new Date(),
      ultimaAtualizacaoStatus: new Date(),
    };

    if (categoriaEstado === 'SUCESSO') {
      dadosAtualizacao.status = StatusPagamentoItem.PROCESSADO;
      dadosAtualizacao.processadoComSucesso = true;
      dadosAtualizacao.indicadorMovimentoAceito = 'S';
      dadosAtualizacao.indicadorMovimentoAceitoAtual = 'S';
    } else if (
      categoriaEstado === 'CANCELADO' ||
      categoriaEstado === 'REJEITADO'
    ) {
      if (item.status !== StatusPagamentoItem.REJEITADO) {
        dadosAtualizacao.status = StatusPagamentoItem.REJEITADO;
      }
    }

    const itemAtualizado = await this.prisma.pagamentoApiItem.update({
      where: { id: item.id },
      data: dadosAtualizacao,
    });

    const loteIdRelacionado = item.loteId ?? item.lote?.id;

    if (categoriaEstado === 'SUCESSO') {
      // Atualizar colheitas (relacionamento N:N)
      await this.atualizarColheitasDoItemParaPago(
        itemAtualizado.id,
        dataPagamento ?? new Date(),
      );
      // Atualizar funcionário (relacionamento 1:1)
      await this.atualizarFuncionarioPagamentoDoItem(
        itemAtualizado.id,
        'PAGO',
        dataPagamento ?? new Date(),
      );
      if (loteIdRelacionado) {
        await this.atualizarStatusLoteAposProcessamento(loteIdRelacionado);
      }
    } else if (
      categoriaEstado === 'CANCELADO' ||
      categoriaEstado === 'REJEITADO'
    ) {
      await this.reverterColheitasDoItemParaPendente(itemAtualizado.id);
      // Atualizar funcionário para rejeitado
      await this.atualizarFuncionarioPagamentoDoItem(
        itemAtualizado.id,
        'REJEITADO',
        null,
      );
      if (loteIdRelacionado) {
        await this.atualizarStatusLoteAposCancelamentoItem(loteIdRelacionado);
      }
    }
  }

  /**
   * Atualiza o status do lote após cancelamento de item(s)
   * @param loteId ID do lote a ser atualizado
   */
  private async atualizarStatusLoteAposCancelamentoItem(loteId: number): Promise<void> {
    // Buscar lote com todos os itens para verificar status geral
    const lote = await this.prisma.pagamentoApiLote.findUnique({
      where: { id: loteId },
      include: {
        itensPagamento: true,
      },
    });
    
    if (!lote) {
      console.warn(`⚠️ [PAGAMENTOS-SERVICE] Lote ID ${loteId} não encontrado para atualização de status`);
      return;
    }
    
    const totalItens = lote.itensPagamento.length;
    const itensCancelados = lote.itensPagamento.filter(
      (item) => item.status === StatusPagamentoItem.REJEITADO && item.dataCancelamento !== null
    ).length;
    const itensProcessados = lote.itensPagamento.filter(
      (item) => item.status === StatusPagamentoItem.PROCESSADO
    ).length;
    const itensPendentes = lote.itensPagamento.filter(
      (item) => item.status === StatusPagamentoItem.PENDENTE
    ).length;
    
    // Determinar novo status do lote
    let novoStatusLote: StatusPagamentoLote;
    if (itensCancelados === totalItens) {
      // Todos os itens foram cancelados
      novoStatusLote = StatusPagamentoLote.REJEITADO;
    } else if (itensCancelados > 0 && itensProcessados === 0 && itensPendentes > 0) {
      // Alguns itens cancelados, mas ainda há pendentes
      novoStatusLote = StatusPagamentoLote.PENDENTE;
    } else if (itensCancelados > 0 && (itensProcessados > 0 || itensPendentes === 0)) {
      // Alguns itens cancelados, mas há processados ou todos foram processados/cancelados
      novoStatusLote = StatusPagamentoLote.PROCESSANDO;
    } else {
      // Manter status atual se não houver mudança significativa
      novoStatusLote = lote.status;
    }
    
    await this.prisma.pagamentoApiLote.update({
      where: { id: loteId },
      data: {
        status: novoStatusLote,
      },
    });
    
    console.log(`💾 [PAGAMENTOS-SERVICE] Lote ID ${loteId} (numeroRequisicao ${lote.numeroRequisicao}) atualizado: status=${novoStatusLote} (${itensCancelados}/${totalItens} itens cancelados)`);
  }

  private normalizarEstadoPagamentoPix(
    estado: string | null,
  ): string | null {
    if (!estado) {
      return null;
    }

    return estado
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
  }

  private classificarEstadoPagamentoPix(
    estado: string | null,
  ):
    | 'PENDENTE'
    | 'SUCESSO'
    | 'CANCELADO'
    | 'REJEITADO'
    | 'BLOQUEADO'
    | 'DESCONHECIDO' {
    if (!estado) {
      return 'DESCONHECIDO';
    }

    if (this.ITEM_ESTADOS_PENDENTES.has(estado)) {
      return 'PENDENTE';
    }

    if (this.ITEM_ESTADOS_SUCESSO.has(estado)) {
      return 'SUCESSO';
    }

    if (this.ITEM_ESTADOS_CANCELADO.has(estado)) {
      return 'CANCELADO';
    }

    if (this.ITEM_ESTADOS_REJEITADO.has(estado)) {
      return 'REJEITADO';
    }

    if (estado === 'BLOQUEADO') {
      return 'BLOQUEADO';
    }

    return 'DESCONHECIDO';
  }

  private converterDataPagamentoBB(valor: any): Date | null {
    if (!valor) {
      return null;
    }

    if (valor instanceof Date) {
      return valor;
    }

    const texto = String(valor).trim();

    if (/^\d{8}$/.test(texto)) {
      const dia = parseInt(texto.slice(0, 2), 10);
      const mes = parseInt(texto.slice(2, 4), 10) - 1;
      const ano = parseInt(texto.slice(4, 8), 10);
      return new Date(Date.UTC(ano, mes, dia, 12, 0, 0));
    }

    const timestamp = Date.parse(texto);
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp);
    }

    return null;
  }

  private async atualizarColheitasDoItemParaPago(
    itemId: number,
    dataPagamento: Date,
  ): Promise<void> {
    const colheitas = await this.prisma.pagamentoApiItemColheita.findMany({
      where: { pagamentoApiItemId: itemId },
      include: { turmaColheitaCusto: true },
    });

    if (colheitas.length === 0) {
      return;
    }

    for (const rel of colheitas) {
      await this.prisma.turmaColheitaPedidoCusto.update({
        where: { id: rel.turmaColheitaCustoId },
        data: {
          statusPagamento: 'PAGO',
          pagamentoEfetuado: true,
          dataPagamento: dataPagamento,
        },
      });
    }
  }

  private async reverterColheitasDoItemParaPendente(
    itemId: number,
  ): Promise<void> {
    const colheitas = await this.prisma.pagamentoApiItemColheita.findMany({
      where: { pagamentoApiItemId: itemId },
      select: { turmaColheitaCustoId: true },
    });

    if (colheitas.length === 0) {
      return;
    }

    const ids = colheitas.map((rel) => rel.turmaColheitaCustoId);

    await this.prisma.turmaColheitaPedidoCusto.updateMany({
      where: {
        id: { in: ids },
        statusPagamento: { in: ['PROCESSANDO', 'PAGO'] },
      },
      data: {
        statusPagamento: 'PENDENTE',
        pagamentoEfetuado: false,
        dataPagamento: null,
      },
    });
  }

  /**
   * Atualiza o FuncionarioPagamento associado a um PagamentoApiItem
   * @param itemId ID do PagamentoApiItem
   * @param status Status a ser definido ('PAGO' ou 'REJEITADO')
   * @param dataPagamento Data do pagamento (null para rejeição)
   */
  private async atualizarFuncionarioPagamentoDoItem(
    itemId: number,
    status: 'PAGO' | 'REJEITADO',
    dataPagamento: Date | null,
  ): Promise<void> {
    // Buscar o item para obter o funcionarioPagamentoId
    const item = await this.prisma.pagamentoApiItem.findUnique({
      where: { id: itemId },
      select: { funcionarioPagamentoId: true },
    });

    // Se não tem funcionário associado, retornar
    if (!item?.funcionarioPagamentoId) {
      return;
    }

    console.log(`📝 [PAGAMENTOS-SERVICE] Atualizando FuncionarioPagamento ID ${item.funcionarioPagamentoId} para status ${status}`);

    if (status === 'PAGO') {
      await this.prisma.funcionarioPagamento.update({
        where: { id: item.funcionarioPagamentoId },
        data: {
          statusPagamento: 'PAGO',
          pagamentoEfetuado: true,
          dataPagamento: dataPagamento,
        },
      });
    } else if (status === 'REJEITADO') {
      await this.prisma.funcionarioPagamento.update({
        where: { id: item.funcionarioPagamentoId },
        data: {
          statusPagamento: 'REJEITADO',
          pagamentoEfetuado: false,
        },
      });
    }

    console.log(`✅ [PAGAMENTOS-SERVICE] FuncionarioPagamento ID ${item.funcionarioPagamentoId} atualizado com sucesso`);
  }

  private async atualizarStatusLoteAposProcessamento(
    loteId: number,
  ): Promise<void> {
    const itens = await this.prisma.pagamentoApiItem.findMany({
      where: { loteId },
      select: { status: true },
    });

    if (itens.length === 0) {
      return;
    }

    const todosProcessados = itens.every(
      (registro) => registro.status === StatusPagamentoItem.PROCESSADO,
    );

    if (todosProcessados) {
      await this.prisma.pagamentoApiLote.update({
        where: { id: loteId },
        data: {
          estadoRequisicaoAtual: 6,
          status: StatusPagamentoLote.CONCLUIDO,
          processadoComSucesso: true,
        },
      });
    }
  }

  /**
   * Consulta status individual de pagamento de boleto
   * @param codigoIdentificadorPagamento Código identificador do pagamento de boleto (retornado pelo BB)
   * @param contaCorrenteId ID da conta corrente (opcional, busca no banco se não informado)
   * @returns Status individual do pagamento
   */
  async consultarStatusBoletoIndividual(
    codigoIdentificadorPagamento: string,
    contaCorrenteId?: number
  ): Promise<any> {
    try {
      // Buscar item no banco de dados pelo codigoIdentificadorPagamento
      const item = await this.prisma.pagamentoApiItem.findFirst({
        where: { codigoIdentificadorPagamento },
        include: {
          lote: {
            include: {
              contaCorrente: true,
            },
          },
        },
      });

      // Se item não existe, usar contaCorrenteId informado ou buscar em todas as contas
      const contaId = item ? item.lote.contaCorrenteId : contaCorrenteId;

      // Buscar credenciais de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException('Credencial de pagamentos não cadastrada.');
      }

      // Se contaId foi informado ou encontrado no banco, usar essa conta
      if (contaId) {
        const contaCorrente = await this.contaCorrenteService.findOne(contaId);
        const credencialPagamento = credenciaisPagamentos.find(c => c.contaCorrenteId === contaCorrente.id);
        
        if (!credencialPagamento) {
          throw new NotFoundException('Credenciais de pagamentos não encontradas para esta conta.');
        }

        const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_BOLETO_INFO);
        const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

        // Consultar status individual no BB
        const response = await apiClient.get(
          `/boletos/${codigoIdentificadorPagamento}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const respostaData = response.data as any;

        // Se item existe no banco, atualizar com resposta
        if (item) {
          await this.prisma.pagamentoApiItem.update({
            where: { id: item.id },
            data: {
              estadoPagamentoIndividual: respostaData?.estadoPagamento || null,
              payloadConsultaIndividual: respostaData || null,
              ultimaConsultaIndividual: new Date(),
              listaDevolucao: respostaData?.listaDevolucao || null,
            },
          });

          console.log(`💾 [PAGAMENTOS-SERVICE] Item ${item.id} (Boleto) atualizado com status individual`);
        }

        return respostaData;
      }

      // Se não informou contaCorrenteId e não encontrou no banco, tentar todas as contas
      for (const credencialPagamento of credenciaisPagamentos) {
        try {
          const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_BOLETO_INFO);
          const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

          const response = await apiClient.get(
            `/boletos/${codigoIdentificadorPagamento}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          return response.data as any;
        } catch (error) {
          // Se erro 404, continua tentando outras contas
          if (error.response?.status === 404) {
            continue;
          }
          // Se outro erro, propaga
          throw error;
        }
      }

      throw new NotFoundException(`Pagamento ${codigoIdentificadorPagamento} não encontrado em nenhuma conta cadastrada.`);

    } catch (error) {
      console.error('❌ [PAGAMENTOS-SERVICE] Erro ao consultar status individual de pagamento de boleto:', {
        error: error.message,
        response: error.response?.data
      });

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao consultar status individual de pagamento de boleto');
    }
  }

  /**
   * Consulta status individual de pagamento de guia
   * @param codigoPagamento Código do pagamento de guia (retornado pelo BB)
   * @param contaCorrenteId ID da conta corrente (opcional, busca no banco se não informado)
   * @returns Status individual do pagamento
   */
  async consultarStatusGuiaIndividual(
    codigoPagamento: string,
    contaCorrenteId?: number
  ): Promise<any> {
    try {
      // Buscar item no banco de dados pelo codigoPagamento
      const item = await this.prisma.pagamentoApiItem.findFirst({
        where: { codigoPagamento },
        include: {
          lote: {
            include: {
              contaCorrente: true,
            },
          },
        },
      });

      // Se item não existe, usar contaCorrenteId informado ou buscar em todas as contas
      const contaId = item ? item.lote.contaCorrenteId : contaCorrenteId;

      // Buscar credenciais de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        throw new NotFoundException('Credencial de pagamentos não cadastrada.');
      }

      // Se contaId foi informado ou encontrado no banco, usar essa conta
      if (contaId) {
        const contaCorrente = await this.contaCorrenteService.findOne(contaId);
        const credencialPagamento = credenciaisPagamentos.find(c => c.contaCorrenteId === contaCorrente.id);
        
        if (!credencialPagamento) {
          throw new NotFoundException('Credenciais de pagamentos não encontradas para esta conta.');
        }

        const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_GUIA_INFO);
        const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

        // Consultar status individual no BB
        const response = await apiClient.get(
          `/guias-codigo-barras/${codigoPagamento}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const respostaData = response.data as any;

        // Se item existe no banco, atualizar com resposta
        if (item) {
          await this.prisma.pagamentoApiItem.update({
            where: { id: item.id },
            data: {
              estadoPagamentoIndividual: respostaData?.estadoPagamento || null,
              payloadConsultaIndividual: respostaData || null,
              ultimaConsultaIndividual: new Date(),
              listaDevolucao: respostaData?.listaDevolucao || null,
            },
          });

          console.log(`💾 [PAGAMENTOS-SERVICE] Item ${item.id} (Guia) atualizado com status individual`);
        }

        return respostaData;
      }

      // Se não informou contaCorrenteId e não encontrou no banco, tentar todas as contas
      for (const credencialPagamento of credenciaisPagamentos) {
        try {
          const token = await this.obterTokenDeAcesso(credencialPagamento, this.SCOPES_GUIA_INFO);
          const apiClient = createPagamentosApiClient(credencialPagamento.developerAppKey);

          const response = await apiClient.get(
            `/guias-codigo-barras/${codigoPagamento}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          return response.data as any;
        } catch (error) {
          // Se erro 404, continua tentando outras contas
          if (error.response?.status === 404) {
            continue;
          }
          // Se outro erro, propaga
          throw error;
        }
      }

      throw new NotFoundException(`Pagamento ${codigoPagamento} não encontrado em nenhuma conta cadastrada.`);

    } catch (error) {
      console.error('❌ [PAGAMENTOS-SERVICE] Erro ao consultar status individual de pagamento de guia:', {
        error: error.message,
        response: error.response?.data
      });

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao consultar status individual de pagamento de guia');
    }
  }
}

