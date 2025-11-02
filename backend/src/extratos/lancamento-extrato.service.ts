import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExtratosService } from './extratos.service';
import { ContaCorrenteService } from '../conta-corrente/conta-corrente.service';
import { 
  CreateLancamentoExtratoDto, 
  UpdateLancamentoExtratoDto, 
  VincularLancamentoPedidoDto,
  QueryLancamentoExtratoDto,
  LancamentoExtratoResponseDto,
  BuscarProcessarExtratosDto,
  BuscarProcessarExtratosResponseDto
} from './dto/lancamento-extrato.dto';
import { TipoOperacaoExtrato } from '@prisma/client';

@Injectable()
export class LancamentoExtratoService {
  constructor(
    private prisma: PrismaService,
    private extratosService: ExtratosService,
    private contaCorrenteService: ContaCorrenteService
  ) {}

  /**
   * Cria um novo lançamento de extrato
   */
  async create(createDto: CreateLancamentoExtratoDto): Promise<LancamentoExtratoResponseDto> {
    // Verificar se o cliente existe
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: createDto.clienteId },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${createDto.clienteId} não encontrado`);
    }

    // Verificar se o pedido existe (se fornecido)
    if (createDto.pedidoId) {
      const pedido = await this.prisma.pedido.findUnique({
        where: { id: createDto.pedidoId },
      });

      if (!pedido) {
        throw new NotFoundException(`Pedido com ID ${createDto.pedidoId} não encontrado`);
      }

      // Verificar se o pedido pertence ao cliente
      if (pedido.clienteId !== createDto.clienteId) {
        throw new BadRequestException('O pedido não pertence ao cliente especificado');
      }
    }

    // Converter dataLancamento de string para Date
    const dataLancamento = new Date(createDto.dataLancamento);

    // Preparar dados para criação
    const dataToCreate: any = {
      ...createDto,
      dataLancamento,
      // Converter BigInt se necessário
      dataLancamentoRaw: createDto.dataLancamentoRaw ? BigInt(createDto.dataLancamentoRaw) : null,
      dataMovimento: createDto.dataMovimento ? BigInt(createDto.dataMovimento) : null,
      codigoAgenciaOrigem: createDto.codigoAgenciaOrigem ? BigInt(createDto.codigoAgenciaOrigem) : null,
      numeroLote: createDto.numeroLote ? BigInt(createDto.numeroLote) : null,
      codigoBancoContrapartida: createDto.codigoBancoContrapartida ? BigInt(createDto.codigoBancoContrapartida) : null,
      codigoAgenciaContrapartida: createDto.codigoAgenciaContrapartida ? BigInt(createDto.codigoAgenciaContrapartida) : null,
      processado: createDto.processado ?? false,
      vinculadoPedido: createDto.vinculadoPedido ?? false,
      vinculadoPagamento: createDto.vinculadoPagamento ?? false,
      vinculacaoAutomatica: createDto.vinculacaoAutomatica ?? false,
    };

    // Remover campos undefined
    Object.keys(dataToCreate).forEach(key => {
      if (dataToCreate[key] === undefined) {
        delete dataToCreate[key];
      }
    });

    const lancamento = await this.prisma.lancamentoExtrato.create({
      data: dataToCreate,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
          },
        },
        pedido: {
          select: {
            id: true,
            numeroPedido: true,
            valorFinal: true,
            status: true,
          },
        },
      },
    });

    return this.formatResponse(lancamento);
  }

  /**
   * Busca todos os lançamentos com filtros opcionais
   */
  async findAll(query?: QueryLancamentoExtratoDto): Promise<LancamentoExtratoResponseDto[]> {
    const where: any = {};

    if (query?.clienteId) {
      where.clienteId = query.clienteId;
    }

    if (query?.pedidoId !== undefined) {
      if (query.pedidoId === null) {
        where.pedidoId = null;
      } else {
        where.pedidoId = query.pedidoId;
      }
    }

    if (query?.dataInicio || query?.dataFim) {
      where.dataLancamento = {};
      if (query.dataInicio) {
        where.dataLancamento.gte = new Date(query.dataInicio);
      }
      if (query.dataFim) {
        const dataFim = new Date(query.dataFim);
        dataFim.setHours(23, 59, 59, 999); // Incluir todo o dia
        where.dataLancamento.lte = dataFim;
      }
    }

    if (query?.tipoOperacao) {
      where.tipoOperacao = query.tipoOperacao;
    }

    if (query?.categoriaOperacao) {
      where.categoriaOperacao = query.categoriaOperacao;
    }

    if (query?.processado !== undefined) {
      where.processado = query.processado;
    }

    if (query?.vinculadoPedido !== undefined) {
      where.vinculadoPedido = query.vinculadoPedido;
    }

    const lancamentos = await this.prisma.lancamentoExtrato.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
          },
        },
        pedido: {
          select: {
            id: true,
            numeroPedido: true,
            valorFinal: true,
            status: true,
          },
        },
      },
      orderBy: {
        dataLancamento: 'desc',
      },
    });

    return lancamentos.map(l => this.formatResponse(l));
  }

  /**
   * Busca um lançamento por ID
   */
  async findOne(id: bigint): Promise<LancamentoExtratoResponseDto> {
    const lancamento = await this.prisma.lancamentoExtrato.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
          },
        },
        pedido: {
          select: {
            id: true,
            numeroPedido: true,
            valorFinal: true,
            status: true,
          },
        },
      },
    });

    if (!lancamento) {
      throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
    }

    return this.formatResponse(lancamento);
  }

  /**
   * Atualiza um lançamento
   */
  async update(
    id: bigint,
    updateDto: UpdateLancamentoExtratoDto,
  ): Promise<LancamentoExtratoResponseDto> {
    // Verificar se o lançamento existe
    const lancamentoExistente = await this.prisma.lancamentoExtrato.findUnique({
      where: { id },
    });

    if (!lancamentoExistente) {
      throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
    }

    // Verificar se o pedido existe (se fornecido)
    if (updateDto.pedidoId !== undefined && updateDto.pedidoId !== null) {
      const pedido = await this.prisma.pedido.findUnique({
        where: { id: updateDto.pedidoId },
      });

      if (!pedido) {
        throw new NotFoundException(`Pedido com ID ${updateDto.pedidoId} não encontrado`);
      }

      // Verificar se o pedido pertence ao cliente do lançamento
      if (pedido.clienteId !== lancamentoExistente.clienteId) {
        throw new BadRequestException('O pedido não pertence ao cliente do lançamento');
      }
    }

    // Preparar dados para atualização
    const dataToUpdate: any = { ...updateDto };

    // Remover campos undefined
    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });

    const lancamento = await this.prisma.lancamentoExtrato.update({
      where: { id },
      data: dataToUpdate,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
          },
        },
        pedido: {
          select: {
            id: true,
            numeroPedido: true,
            valorFinal: true,
            status: true,
          },
        },
      },
    });

    return this.formatResponse(lancamento);
  }

  /**
   * Remove um lançamento
   */
  async remove(id: bigint): Promise<void> {
    const lancamento = await this.prisma.lancamentoExtrato.findUnique({
      where: { id },
    });

    if (!lancamento) {
      throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
    }

    await this.prisma.lancamentoExtrato.delete({
      where: { id },
    });
  }

  /**
   * Vincula manualmente um lançamento a um pedido
   */
  async vincularPedido(
    id: bigint,
    vincularDto: VincularLancamentoPedidoDto,
  ): Promise<LancamentoExtratoResponseDto> {
    // Verificar se o lançamento existe
    const lancamento = await this.prisma.lancamentoExtrato.findUnique({
      where: { id },
    });

    if (!lancamento) {
      throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
    }

    // Verificar se o pedido existe
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: vincularDto.pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido com ID ${vincularDto.pedidoId} não encontrado`);
    }

    // Verificar se o pedido pertence ao cliente do lançamento
    if (pedido.clienteId !== lancamento.clienteId) {
      throw new BadRequestException('O pedido não pertence ao cliente do lançamento');
    }

    // Atualizar o lançamento
    const lancamentoAtualizado = await this.prisma.lancamentoExtrato.update({
      where: { id },
      data: {
        pedidoId: vincularDto.pedidoId,
        vinculadoPedido: true,
        vinculacaoAutomatica: false,
        observacoesProcessamento: vincularDto.observacoes || null,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
          },
        },
        pedido: {
          select: {
            id: true,
            numeroPedido: true,
            valorFinal: true,
            status: true,
          },
        },
      },
    });

    return this.formatResponse(lancamentoAtualizado);
  }

  /**
   * Desvincula um lançamento de um pedido
   */
  async desvincularPedido(id: bigint): Promise<LancamentoExtratoResponseDto> {
    const lancamento = await this.prisma.lancamentoExtrato.findUnique({
      where: { id },
    });

    if (!lancamento) {
      throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
    }

    const lancamentoAtualizado = await this.prisma.lancamentoExtrato.update({
      where: { id },
      data: {
        pedidoId: null,
        vinculadoPedido: false,
        vinculadoPagamento: false, // Se desvinculou, também não tem pagamento
        vinculacaoAutomatica: false,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
          },
        },
        pedido: {
          select: {
            id: true,
            numeroPedido: true,
            valorFinal: true,
            status: true,
          },
        },
      },
    });

    return this.formatResponse(lancamentoAtualizado);
  }

  /**
   * Busca e processa extratos da API BB, filtrando por cliente e tipo crédito
   * Salva os pagamentos encontrados no banco de dados
   */
  async buscarEProcessarExtratos(
    dto: BuscarProcessarExtratosDto
  ): Promise<BuscarProcessarExtratosResponseDto> {
    console.log(`🔍 [LANCAMENTO-EXTRATO-SERVICE] Iniciando busca e processamento de extratos`, {
      dataInicio: dto.dataInicio,
      dataFim: dto.dataFim,
      clienteId: dto.clienteId,
      contaCorrenteId: dto.contaCorrenteId,
    });

    // Validar e buscar cliente
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.clienteId },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${dto.clienteId} não encontrado`);
    }

    // Validar e buscar conta corrente
    const contaCorrente = await this.contaCorrenteService.findOne(dto.contaCorrenteId);

    // Formatar datas para API (remover zeros à esquerda)
    const formatDateForAPI = (dateStr: string): string => {
      if (!/^\d{8}$/.test(dateStr)) {
        throw new BadRequestException(`Data inválida: ${dateStr}. Formato esperado: DDMMYYYY`);
      }
      const dia = parseInt(dateStr.slice(0, 2), 10);
      const mes = parseInt(dateStr.slice(2, 4), 10);
      const ano = parseInt(dateStr.slice(4), 10);
      return `${dia}${mes}${ano}`;
    };

    const dataInicioFormatada = formatDateForAPI(dto.dataInicio);
    const dataFimFormatada = formatDateForAPI(dto.dataFim);

    // Buscar extratos brutos da API
    const extratosBrutos = await this.extratosService.consultarExtratosBrutos(
      dataInicioFormatada,
      dataFimFormatada,
      dto.contaCorrenteId
    );

    console.log(`📊 [LANCAMENTO-EXTRATO-SERVICE] Encontrados ${extratosBrutos.length} lançamentos na API`);

    // Preparar CPF/CNPJ do cliente para comparação (sem formatação)
    const cpfCnpjClienteRaw = (cliente.cnpj || cliente.cpf || '').replace(/\D/g, '');

    if (!cpfCnpjClienteRaw) {
      throw new BadRequestException('Cliente não possui CPF ou CNPJ cadastrado');
    }

    // Determinar tamanho esperado (CPF = 11 dígitos, CNPJ = 14 dígitos)
    const tamanhoEsperado = cliente.cnpj ? 14 : 11;
    
    // Normalizar CPF/CNPJ do cliente: adicionar zeros à esquerda se necessário
    const cpfCnpjCliente = cpfCnpjClienteRaw.padStart(tamanhoEsperado, '0');

    // Função auxiliar para normalizar CPF/CNPJ do extrato
    const normalizarCpfCnpj = (cpfCnpj: string): string => {
      const numeros = cpfCnpj.replace(/\D/g, '');
      if (!numeros) return '';
      
      // Se já tem o tamanho esperado, retorna como está
      if (numeros.length === tamanhoEsperado) {
        return numeros;
      }
      
      // Adiciona zeros à esquerda até completar o tamanho esperado
      return numeros.padStart(tamanhoEsperado, '0');
    };

    // Filtrar: apenas créditos (C) e do cliente específico
    const extratosFiltrados = extratosBrutos.filter((extrato: any) => {
      // Apenas créditos
      if (extrato.indicadorSinalLancamento !== 'C') {
        return false;
      }

      // Comparar CPF/CNPJ (remover formatação e normalizar com zeros à esquerda)
      const cpfCnpjExtratoRaw = String(extrato.numeroCpfCnpjContrapartida || '').replace(/\D/g, '');
      if (!cpfCnpjExtratoRaw) {
        return false;
      }
      
      const cpfCnpjExtrato = normalizarCpfCnpj(cpfCnpjExtratoRaw);
      return cpfCnpjExtrato === cpfCnpjCliente;
    });

    console.log(`✅ [LANCAMENTO-EXTRATO-SERVICE] Filtrados ${extratosFiltrados.length} lançamentos de crédito do cliente`);

    // Processar e salvar cada lançamento
    let totalSalvos = 0;
    let totalDuplicados = 0;

    for (const extrato of extratosFiltrados) {
      try {
        // Converter dataLancamento (número DDMMYYYY) para Date
        const dataLancamentoRaw = extrato.dataLancamento;
        const dataLancamentoStr = String(dataLancamentoRaw);
        // A data vem como número (ex: 1102025 para 01/10/2025 ou 30102025 para 30/10/2025)
        let dia: number;
        let mes: number;
        let ano: number;

        if (dataLancamentoStr.length === 7) {
          // Formato sem zero à esquerda (ex: 1102025)
          dia = parseInt(dataLancamentoStr.slice(0, 1), 10);
          mes = parseInt(dataLancamentoStr.slice(1, 3), 10);
          ano = parseInt(dataLancamentoStr.slice(3), 10);
        } else if (dataLancamentoStr.length === 8) {
          // Formato com zero à esquerda (ex: 01102025)
          dia = parseInt(dataLancamentoStr.slice(0, 2), 10);
          mes = parseInt(dataLancamentoStr.slice(2, 4), 10);
          ano = parseInt(dataLancamentoStr.slice(4), 10);
        } else {
          throw new Error(`Formato de data inválido: ${dataLancamentoStr}`);
        }

        const dataLancamento = new Date(ano, mes - 1, dia);

        // Extrair informações do textoInformacaoComplementar
        const infoComplementar = extrato.textoInformacaoComplementar || '';
        const horarioMatch = infoComplementar.match(/(\d{2}:\d{2})/);
        const horarioLancamento = horarioMatch ? horarioMatch[1] : null;

        // Extrair nome da contrapartida do textoInformacaoComplementar
        // Formato típico: "01/10 11:56 52641514000120 AGC NORDEST"
        let nomeContrapartida: string | undefined = undefined;
        if (infoComplementar) {
          const partes = infoComplementar.trim().split(/\s+/);
          // Procurar palavras após o CPF/CNPJ (geralmente no final)
          // CPF/CNPJ geralmente tem 11 ou 14 dígitos
          let encontrouCPFCNPJ = false;
          const partesNome: string[] = [];
          
          for (const parte of partes) {
            // Verifica se é CPF/CNPJ (apenas números com 11 ou 14 dígitos)
            if (!encontrouCPFCNPJ && /^\d{11,14}$/.test(parte)) {
              encontrouCPFCNPJ = true;
              continue;
            }
            // Após encontrar CPF/CNPJ, as próximas partes são o nome
            if (encontrouCPFCNPJ && parte && !parte.match(/^\d{2}\/\d{2}/) && !parte.match(/^\d{2}:\d{2}$/)) {
              partesNome.push(parte);
            }
          }
          
          if (partesNome.length > 0) {
            nomeContrapartida = partesNome.join(' ');
          }
        }

        // Determinar categoria da operação
        let categoriaOperacao: string | undefined;
        const descricao = (extrato.textoDescricaoHistorico || '').toUpperCase();
        if (descricao.includes('PIX') && descricao.includes('RECEBIDO')) {
          categoriaOperacao = 'PIX_RECEBIDO';
        } else if (descricao.includes('PIX') && descricao.includes('ENVIADO')) {
          categoriaOperacao = 'PIX_ENVIADO';
        } else if (descricao.includes('TRANSFERÊNCIA') || descricao.includes('TRANSFERENCIA')) {
          categoriaOperacao = 'TRANSFERENCIA';
        }

        // Converter valor (sempre positivo para créditos)
        const valorLancamento = Math.abs(Number(extrato.valorLancamento || 0));

        // Verificar se já existe (evitar duplicatas)
        const numeroDocumento = String(extrato.numeroDocumento || '');
        const numeroLote = extrato.numeroLote ? BigInt(extrato.numeroLote) : null;

        const lancamentoExistente = await this.prisma.lancamentoExtrato.findUnique({
          where: {
            numeroDocumento_dataLancamentoRaw_numeroLote: {
              numeroDocumento,
              dataLancamentoRaw: BigInt(dataLancamentoRaw),
              numeroLote: numeroLote || BigInt(0),
            },
          },
        });

        if (lancamentoExistente) {
          totalDuplicados++;
          console.log(`⚠️ [LANCAMENTO-EXTRATO-SERVICE] Lançamento duplicado ignorado: ${numeroDocumento}`);
          continue;
        }

        // Criar lançamento
        const createDto: CreateLancamentoExtratoDto = {
          indicadorTipoLancamento: extrato.indicadorTipoLancamento,
          dataLancamentoRaw: Number(dataLancamentoRaw),
          dataMovimento: Number(extrato.dataMovimento || 0),
          codigoAgenciaOrigem: Number(extrato.codigoAgenciaOrigem || 0),
          numeroLote: extrato.numeroLote ? Number(extrato.numeroLote) : undefined,
          numeroDocumento,
          codigoHistorico: extrato.codigoHistorico,
          textoDescricaoHistorico: extrato.textoDescricaoHistorico,
          valorLancamentoRaw: Number(extrato.valorLancamento || 0),
          indicadorSinalLancamento: extrato.indicadorSinalLancamento,
          textoInformacaoComplementar: extrato.textoInformacaoComplementar,
          numeroCpfCnpjContrapartida: String(extrato.numeroCpfCnpjContrapartida || ''),
          indicadorTipoPessoaContrapartida: extrato.indicadorTipoPessoaContrapartida,
          codigoBancoContrapartida: Number(extrato.codigoBancoContrapartida || 0),
          codigoAgenciaContrapartida: Number(extrato.codigoAgenciaContrapartida || 0),
          numeroContaContrapartida: extrato.numeroContaContrapartida,
          textoDvContaContrapartida: extrato.textoDvContaContrapartida,
          dataLancamento: dataLancamento.toISOString(),
          valorLancamento,
          tipoOperacao: TipoOperacaoExtrato.CREDITO,
          categoriaOperacao,
          horarioLancamento,
          nomeContrapartida,
          clienteId: dto.clienteId,
          contaCorrenteId: dto.contaCorrenteId,
          agenciaConta: contaCorrente.agencia,
          numeroConta: contaCorrente.contaCorrente,
          processado: false,
          vinculadoPedido: false,
          vinculadoPagamento: false,
          vinculacaoAutomatica: false,
        };

        await this.create(createDto);
        totalSalvos++;
        console.log(`✅ [LANCAMENTO-EXTRATO-SERVICE] Lançamento salvo: ${numeroDocumento} - R$ ${valorLancamento.toFixed(2)}`);

      } catch (error) {
        console.error(`❌ [LANCAMENTO-EXTRATO-SERVICE] Erro ao processar lançamento:`, error);
        // Continua processando os demais
      }
    }

    console.log(`🎉 [LANCAMENTO-EXTRATO-SERVICE] Processamento concluído: ${totalSalvos} salvos, ${totalDuplicados} duplicados`);

    return {
      totalEncontrados: extratosBrutos.length,
      totalFiltrados: extratosFiltrados.length,
      totalSalvos,
      totalDuplicados,
      periodo: {
        inicio: dto.dataInicio,
        fim: dto.dataFim,
      },
      contaCorrente: {
        id: contaCorrente.id,
        agencia: contaCorrente.agencia,
        conta: contaCorrente.contaCorrente,
      },
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
      },
    };
  }

  /**
   * Formata a resposta do lançamento
   */
  private formatResponse(lancamento: any): LancamentoExtratoResponseDto {
    return {
      id: lancamento.id.toString(),
      indicadorTipoLancamento: lancamento.indicadorTipoLancamento || undefined,
      dataLancamentoRaw: lancamento.dataLancamentoRaw ? Number(lancamento.dataLancamentoRaw) : undefined,
      numeroDocumento: lancamento.numeroDocumento || undefined,
      textoDescricaoHistorico: lancamento.textoDescricaoHistorico || undefined,
      dataLancamento: lancamento.dataLancamento,
      valorLancamento: Number(lancamento.valorLancamento),
      tipoOperacao: lancamento.tipoOperacao,
      categoriaOperacao: lancamento.categoriaOperacao || undefined,
      nomeContrapartida: lancamento.nomeContrapartida || undefined,
      clienteId: lancamento.clienteId,
      pedidoId: lancamento.pedidoId || undefined,
      processado: lancamento.processado,
      vinculadoPedido: lancamento.vinculadoPedido,
      vinculadoPagamento: lancamento.vinculadoPagamento,
      vinculacaoAutomatica: lancamento.vinculacaoAutomatica,
      createdAt: lancamento.createdAt,
      updatedAt: lancamento.updatedAt,
    };
  }
}

