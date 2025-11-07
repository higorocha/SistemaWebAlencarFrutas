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
  BuscarProcessarExtratosResponseDto,
  BuscarProcessarExtratosTodosClientesDto
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
   * Busca e processa extratos da API BB, filtrando por cliente(s) e tipo crédito
   * Salva os pagamentos encontrados no banco de dados
   * Suporta múltiplos clientes para evitar múltiplas chamadas à API
   */
  async buscarEProcessarExtratos(
    dto: BuscarProcessarExtratosDto
  ): Promise<BuscarProcessarExtratosResponseDto> {
    // Determinar lista de IDs de clientes (suporta clienteId único ou clienteIds array)
    const clienteIds: number[] = dto.clienteIds && dto.clienteIds.length > 0 
      ? dto.clienteIds 
      : (dto.clienteId ? [dto.clienteId] : []);

    if (clienteIds.length === 0) {
      throw new BadRequestException('É necessário informar pelo menos um cliente (clienteId ou clienteIds)');
    }

    // Buscar todos os clientes
    const clientes = await this.prisma.cliente.findMany({
      where: { id: { in: clienteIds } },
    });

    if (clientes.length === 0) {
      throw new NotFoundException(`Nenhum cliente encontrado com os IDs fornecidos: ${clienteIds.join(', ')}`);
    }

    // Verificar se todos os IDs foram encontrados
    const idsEncontrados = clientes.map(c => c.id);
    const idsNaoEncontrados = clienteIds.filter(id => !idsEncontrados.includes(id));
    if (idsNaoEncontrados.length > 0) {
      throw new NotFoundException(`Clientes não encontrados: ${idsNaoEncontrados.join(', ')}`);
    }

    // Formatar data para exibição (antes de processar)
    const dataInicioExibicao = `${dto.dataInicio.slice(0, 2)}/${dto.dataInicio.slice(2, 4)}/${dto.dataInicio.slice(4)}`;
    const dataFimExibicao = `${dto.dataFim.slice(0, 2)}/${dto.dataFim.slice(2, 4)}/${dto.dataFim.slice(4)}`;
    const nomesClientes = clientes.map(c => c.nome || `ID ${c.id}`).join(', ');
    console.log(`📅 Buscando extratos para ${clientes.length} cliente(s): ${nomesClientes}, período ${dataInicioExibicao} a ${dataFimExibicao}`);

    // Validar e buscar conta corrente
    const contaCorrente = await this.contaCorrenteService.findOne(dto.contaCorrenteId);

    // Formatar datas para API do BB
    // Conforme documentação: Formato DDMMAAAA, omitir zeros à esquerda APENAS no DIA
    // Exemplo: 19042023 (dia 19, mês 04, ano 2023)
    // - DIA: 1 ou 2 dígitos (sem zero à esquerda se dia < 10)
    // - MÊS: SEMPRE 2 dígitos (com zero à esquerda se mês < 10)
    // - ANO: SEMPRE 4 dígitos
    const formatDateForAPI = (dateStr: string): string => {
      if (!/^\d{8}$/.test(dateStr)) {
        throw new BadRequestException(`Data inválida: ${dateStr}. Formato esperado: DDMMYYYY`);
      }
      
      const dia = parseInt(dateStr.slice(0, 2), 10);
      const mes = parseInt(dateStr.slice(2, 4), 10);
      const ano = parseInt(dateStr.slice(4), 10);
      
      // Dia: omitir zeros à esquerda (conforme documentação da API)
      // Mês: SEMPRE 2 dígitos (com zero à esquerda se < 10)
      // Ano: sempre 4 dígitos
      const diaFormatado = dia.toString(); // Sem zero à esquerda (ex: 1, 8, 19, 23)
      const mesFormatado = mes.toString().padStart(2, '0'); // Sempre 2 dígitos (ex: 01, 04, 09, 11)
      return `${diaFormatado}${mesFormatado}${ano}`;
    };

    const dataInicioFormatada = formatDateForAPI(dto.dataInicio);
    const dataFimFormatada = formatDateForAPI(dto.dataFim);

    // Log antes de buscar na API
    console.log(`🔍 [BUSCAR-PROCESSAR] Iniciando busca na API BB:`, {
      contaCorrenteId: dto.contaCorrenteId,
      agencia: contaCorrente.agencia,
      conta: contaCorrente.contaCorrente,
      dataInicio: dto.dataInicio,
      dataInicioFormatada,
      dataFim: dto.dataFim,
      dataFimFormatada,
      clientes: clientes.map(c => ({ id: c.id, nome: c.nome, cpf: c.cpf, cnpj: c.cnpj }))
    });

    // Buscar extratos brutos da API
    let extratosBrutos: any[] = [];
    try {
      extratosBrutos = await this.extratosService.consultarExtratosBrutos(
        dataInicioFormatada,
        dataFimFormatada,
        dto.contaCorrenteId
      );
      console.log(`✅ [BUSCAR-PROCESSAR] API retornou ${extratosBrutos.length} extratos brutos`);
    } catch (error) {
      console.error(`❌ [BUSCAR-PROCESSAR] Erro ao consultar extratos brutos na API BB:`, {
        error: error.message,
        stack: error.stack,
        contaCorrenteId: dto.contaCorrenteId,
        agencia: contaCorrente.agencia,
        conta: contaCorrente.contaCorrente,
        dataInicioFormatada,
        dataFimFormatada,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error; // Re-throw para o controller tratar
    }

    // LOG: Estrutura completa de todos os extratos retornados pela API
    // Descomente abaixo caso precise visualizar a estrutura completa do JSON retornado pela API do BB
    // Útil para debug quando houver mudanças na estrutura ou problemas de extração de dados
    // if (extratosBrutos && extratosBrutos.length > 0) {
    //   console.log('📋 [API RESPONSE] JSON de todos os extratos retornados pela API:');
    //   console.log(JSON.stringify(extratosBrutos, null, 2));
    // }

    // Preparar mapa de CPF/CNPJ normalizados para cada cliente
    // Estrutura: { cpfCnpjNormalizado: { clienteId, tamanhoEsperado } }
    const mapaCpfCnpjClientes: Map<string, { clienteId: number; tamanhoEsperado: number }> = new Map();
    
    for (const cliente of clientes) {
      const cpfCnpjClienteRaw = (cliente.cnpj || cliente.cpf || '').replace(/\D/g, '');
      
      if (!cpfCnpjClienteRaw) {
        console.warn(`⚠️ Cliente ${cliente.id} (${cliente.nome}) não possui CPF ou CNPJ cadastrado. Será ignorado na busca.`);
        continue;
      }

      // Determinar tamanho esperado (CPF = 11 dígitos, CNPJ = 14 dígitos)
      const tamanhoEsperado = cliente.cnpj ? 14 : 11;
      
      // Normalizar CPF/CNPJ do cliente: adicionar zeros à esquerda se necessário
      const cpfCnpjCliente = cpfCnpjClienteRaw.padStart(tamanhoEsperado, '0');
      
      mapaCpfCnpjClientes.set(cpfCnpjCliente, { clienteId: cliente.id, tamanhoEsperado });
    }

    if (mapaCpfCnpjClientes.size === 0) {
      throw new BadRequestException('Nenhum dos clientes informados possui CPF ou CNPJ cadastrado');
    }

    // Função auxiliar para normalizar CPF/CNPJ do extrato
    const normalizarCpfCnpj = (cpfCnpj: string, tamanhoEsperado: number): string => {
      const numeros = cpfCnpj.replace(/\D/g, '');
      if (!numeros) return '';
      
      // Se já tem o tamanho esperado, retorna como está
      if (numeros.length === tamanhoEsperado) {
        return numeros;
      }
      
      // Adiciona zeros à esquerda até completar o tamanho esperado
      return numeros.padStart(tamanhoEsperado, '0');
    };

    // Função para extrair CPF/CNPJ do extrato
    const extrairCpfCnpjExtrato = (extrato: any): string => {
      let cpfCnpjExtratoOriginal = '';
      
      // 1. PRIMEIRA TENTATIVA: Verificar 'numeroCpfCnpjContrapartida' (campo direto)
      if (extrato.numeroCpfCnpjContrapartida && Number(extrato.numeroCpfCnpjContrapartida) !== 0) {
        cpfCnpjExtratoOriginal = String(extrato.numeroCpfCnpjContrapartida);
      }
      
      // 2. SEGUNDA TENTATIVA: Se não encontrou no campo direto, extrair do 'textoInformacaoComplementar'
      if (!cpfCnpjExtratoOriginal || cpfCnpjExtratoOriginal === '0') {
        const infoComplementar = extrato.textoInformacaoComplementar || '';
        const cpfCnpjMatch = infoComplementar.match(/\b(\d{11,14})\b/);
        if (cpfCnpjMatch) {
          cpfCnpjExtratoOriginal = cpfCnpjMatch[1];
        }
      }
      
      // 3. FALLBACK: Tentar outros campos possíveis
      if (!cpfCnpjExtratoOriginal || cpfCnpjExtratoOriginal === '0') {
        cpfCnpjExtratoOriginal = String(
          extrato.numeroCpfCnpj || 
          extrato.cpfCnpjContrapartida || 
          extrato.cpfCnpj || 
          extrato.numeroDocumentoContrapartida ||
          extrato.documentoContrapartida ||
          ''
        );
      }
      
      return cpfCnpjExtratoOriginal.replace(/\D/g, '');
    };

    // Filtrar: apenas créditos (C) e de QUALQUER um dos clientes informados
    // E identificar qual cliente pertence cada extrato
    const extratosFiltradosComCliente: Array<{ extrato: any; clienteId: number }> = [];
    
    for (const extrato of extratosBrutos) {
      // Apenas créditos
      if (extrato.indicadorSinalLancamento !== 'C') {
        continue;
      }

      const cpfCnpjExtratoRaw = extrairCpfCnpjExtrato(extrato);
      
      if (!cpfCnpjExtratoRaw) {
        continue;
      }

      // Tentar encontrar correspondência com qualquer cliente
      // Como os clientes podem ter CPF (11) ou CNPJ (14), tentamos ambos os tamanhos
      let clienteEncontrado: { clienteId: number; tamanhoEsperado: number } | null = null;

      // Tentar primeiro como CPF (11 dígitos)
      if (cpfCnpjExtratoRaw.length === 11) {
        const cpfCnpjNormalizado = normalizarCpfCnpj(cpfCnpjExtratoRaw, 11);
        clienteEncontrado = mapaCpfCnpjClientes.get(cpfCnpjNormalizado) || null;
      }
      
      // Se não encontrou como CPF, tentar como CNPJ (14 dígitos)
      if (!clienteEncontrado && cpfCnpjExtratoRaw.length === 14) {
        const cpfCnpjNormalizado = normalizarCpfCnpj(cpfCnpjExtratoRaw, 14);
        clienteEncontrado = mapaCpfCnpjClientes.get(cpfCnpjNormalizado) || null;
      }

      // Se ainda não encontrou, tentar normalizar para ambos os tamanhos e verificar
      if (!clienteEncontrado) {
        // Tentar como CPF (11 dígitos)
        const comoCPF = normalizarCpfCnpj(cpfCnpjExtratoRaw, 11);
        clienteEncontrado = mapaCpfCnpjClientes.get(comoCPF) || null;
        
        // Se não encontrou, tentar como CNPJ (14 dígitos)
        if (!clienteEncontrado) {
          const comoCNPJ = normalizarCpfCnpj(cpfCnpjExtratoRaw, 14);
          clienteEncontrado = mapaCpfCnpjClientes.get(comoCNPJ) || null;
        }
      }

      if (clienteEncontrado) {
        extratosFiltradosComCliente.push({
          extrato,
          clienteId: clienteEncontrado.clienteId,
        });
      }
    }

    // Processar e salvar cada lançamento com o clienteId correto
    let totalSalvos = 0;
    let totalDuplicados = 0;

    for (const { extrato, clienteId } of extratosFiltradosComCliente) {
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
          clienteId: clienteId, // Usar o clienteId identificado para este extrato específico
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

      } catch (error) {
        // Erro silencioso - continua processando os demais
        // Continua processando os demais
      }
    }

    console.log(`✅ Busca concluída: ${totalSalvos} salvos, ${totalDuplicados} duplicados`);

    return {
      totalEncontrados: extratosBrutos.length,
      totalFiltrados: extratosFiltradosComCliente.length,
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
        id: clientes[0].id, // Manter compatibilidade com resposta anterior (primeiro cliente)
        nome: clientes[0].nome,
      },
      clientes: clientes.map(c => ({ // Nova propriedade com todos os clientes
        id: c.id,
        nome: c.nome,
      })),
    };
  }

  /**
   * Busca e processa extratos da API BB para TODOS os clientes com CPF/CNPJ cadastrado
   * Este método será reutilizado por jobs automáticos
   * Faz uma única chamada à API e filtra os lançamentos comparando com todos os CPF/CNPJ da base
   */
  async buscarEProcessarExtratosTodosClientes(
    dto: BuscarProcessarExtratosTodosClientesDto
  ): Promise<BuscarProcessarExtratosResponseDto> {
    // Buscar TODOS os clientes que têm CPF ou CNPJ cadastrado (não nulo e não vazio)
    const clientes = await this.prisma.cliente.findMany({
      where: {
        OR: [
          { 
            AND: [
              { cpf: { not: null } },
              { cpf: { not: '' } }
            ]
          },
          { 
            AND: [
              { cnpj: { not: null } },
              { cnpj: { not: '' } }
            ]
          }
        ]
      },
    });

    if (clientes.length === 0) {
      throw new NotFoundException('Nenhum cliente com CPF ou CNPJ cadastrado encontrado');
    }

    // Formatar data para exibição (antes de processar)
    const dataInicioExibicao = `${dto.dataInicio.slice(0, 2)}/${dto.dataInicio.slice(2, 4)}/${dto.dataInicio.slice(4)}`;
    const dataFimExibicao = `${dto.dataFim.slice(0, 2)}/${dto.dataFim.slice(2, 4)}/${dto.dataFim.slice(4)}`;
    console.log(`📅 Buscando extratos para TODOS os ${clientes.length} clientes com CPF/CNPJ, período ${dataInicioExibicao} a ${dataFimExibicao}`);

    // Validar e buscar conta corrente
    const contaCorrente = await this.contaCorrenteService.findOne(dto.contaCorrenteId);

    // Formatar datas para API do BB
    const formatDateForAPI = (dateStr: string): string => {
      if (!/^\d{8}$/.test(dateStr)) {
        throw new BadRequestException(`Data inválida: ${dateStr}. Formato esperado: DDMMYYYY`);
      }
      
      const dia = parseInt(dateStr.slice(0, 2), 10);
      const mes = parseInt(dateStr.slice(2, 4), 10);
      const ano = parseInt(dateStr.slice(4), 10);
      
      const diaFormatado = dia.toString();
      const mesFormatado = mes.toString().padStart(2, '0');
      return `${diaFormatado}${mesFormatado}${ano}`;
    };

    const dataInicioFormatada = formatDateForAPI(dto.dataInicio);
    const dataFimFormatada = formatDateForAPI(dto.dataFim);

    // Log antes de buscar na API
    console.log(`🔍 [BUSCAR-TODOS-CLIENTES] Iniciando busca na API BB para todos os clientes:`, {
      contaCorrenteId: dto.contaCorrenteId,
      agencia: contaCorrente.agencia,
      conta: contaCorrente.contaCorrente,
      dataInicio: dto.dataInicio,
      dataInicioFormatada,
      dataFim: dto.dataFim,
      dataFimFormatada,
      totalClientes: clientes.length
    });

    // Buscar extratos brutos da API (UMA ÚNICA CHAMADA)
    let extratosBrutos: any[] = [];
    try {
      extratosBrutos = await this.extratosService.consultarExtratosBrutos(
        dataInicioFormatada,
        dataFimFormatada,
        dto.contaCorrenteId
      );
      console.log(`✅ [BUSCAR-TODOS-CLIENTES] API retornou ${extratosBrutos.length} extratos brutos`);
    } catch (error) {
      console.error(`❌ [BUSCAR-TODOS-CLIENTES] Erro ao consultar extratos brutos na API BB:`, {
        error: error.message,
        stack: error.stack,
        contaCorrenteId: dto.contaCorrenteId,
        agencia: contaCorrente.agencia,
        conta: contaCorrente.contaCorrente,
        dataInicioFormatada,
        dataFimFormatada,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error; // Re-throw para o controller tratar
    }

    // Preparar mapa de CPF/CNPJ normalizados para cada cliente
    const mapaCpfCnpjClientes: Map<string, { clienteId: number; tamanhoEsperado: number }> = new Map();
    
    for (const cliente of clientes) {
      const cpfCnpjClienteRaw = (cliente.cnpj || cliente.cpf || '').replace(/\D/g, '');
      
      if (!cpfCnpjClienteRaw) {
        continue; // Já filtramos, mas garantimos
      }

      const tamanhoEsperado = cliente.cnpj ? 14 : 11;
      const cpfCnpjCliente = cpfCnpjClienteRaw.padStart(tamanhoEsperado, '0');
      
      mapaCpfCnpjClientes.set(cpfCnpjCliente, { clienteId: cliente.id, tamanhoEsperado });
    }

    if (mapaCpfCnpjClientes.size === 0) {
      throw new BadRequestException('Nenhum dos clientes possui CPF ou CNPJ válido');
    }

    // Função auxiliar para normalizar CPF/CNPJ do extrato
    const normalizarCpfCnpj = (cpfCnpj: string, tamanhoEsperado: number): string => {
      const numeros = cpfCnpj.replace(/\D/g, '');
      if (!numeros) return '';
      
      if (numeros.length === tamanhoEsperado) {
        return numeros;
      }
      
      return numeros.padStart(tamanhoEsperado, '0');
    };

    // Função para extrair CPF/CNPJ do extrato (mesma lógica do método anterior)
    const extrairCpfCnpjExtrato = (extrato: any): string => {
      let cpfCnpjExtratoOriginal = '';
      
      if (extrato.numeroCpfCnpjContrapartida && Number(extrato.numeroCpfCnpjContrapartida) !== 0) {
        cpfCnpjExtratoOriginal = String(extrato.numeroCpfCnpjContrapartida);
      }
      
      if (!cpfCnpjExtratoOriginal || cpfCnpjExtratoOriginal === '0') {
        const infoComplementar = extrato.textoInformacaoComplementar || '';
        const cpfCnpjMatch = infoComplementar.match(/\b(\d{11,14})\b/);
        if (cpfCnpjMatch) {
          cpfCnpjExtratoOriginal = cpfCnpjMatch[1];
        }
      }
      
      if (!cpfCnpjExtratoOriginal || cpfCnpjExtratoOriginal === '0') {
        cpfCnpjExtratoOriginal = String(
          extrato.numeroCpfCnpj || 
          extrato.cpfCnpjContrapartida || 
          extrato.cpfCnpj || 
          extrato.numeroDocumentoContrapartida ||
          extrato.documentoContrapartida ||
          ''
        );
      }
      
      return cpfCnpjExtratoOriginal.replace(/\D/g, '');
    };

    // Filtrar: apenas créditos (C) e identificar qual cliente pertence cada extrato
    const extratosFiltradosComCliente: Array<{ extrato: any; clienteId: number }> = [];
    
    for (const extrato of extratosBrutos) {
      // Apenas créditos
      if (extrato.indicadorSinalLancamento !== 'C') {
        continue;
      }

      const cpfCnpjExtratoRaw = extrairCpfCnpjExtrato(extrato);
      
      if (!cpfCnpjExtratoRaw) {
        continue;
      }

      // Tentar encontrar correspondência com qualquer cliente
      let clienteEncontrado: { clienteId: number; tamanhoEsperado: number } | null = null;

      // Tentar primeiro como CPF (11 dígitos)
      if (cpfCnpjExtratoRaw.length === 11) {
        const cpfCnpjNormalizado = normalizarCpfCnpj(cpfCnpjExtratoRaw, 11);
        clienteEncontrado = mapaCpfCnpjClientes.get(cpfCnpjNormalizado) || null;
      }
      
      // Se não encontrou como CPF, tentar como CNPJ (14 dígitos)
      if (!clienteEncontrado && cpfCnpjExtratoRaw.length === 14) {
        const cpfCnpjNormalizado = normalizarCpfCnpj(cpfCnpjExtratoRaw, 14);
        clienteEncontrado = mapaCpfCnpjClientes.get(cpfCnpjNormalizado) || null;
      }

      // Se ainda não encontrou, tentar normalizar para ambos os tamanhos
      if (!clienteEncontrado) {
        const comoCPF = normalizarCpfCnpj(cpfCnpjExtratoRaw, 11);
        clienteEncontrado = mapaCpfCnpjClientes.get(comoCPF) || null;
        
        if (!clienteEncontrado) {
          const comoCNPJ = normalizarCpfCnpj(cpfCnpjExtratoRaw, 14);
          clienteEncontrado = mapaCpfCnpjClientes.get(comoCNPJ) || null;
        }
      }

      if (clienteEncontrado) {
        extratosFiltradosComCliente.push({
          extrato,
          clienteId: clienteEncontrado.clienteId,
        });
      }
    }

    // Processar e salvar cada lançamento com o clienteId correto
    let totalSalvos = 0;
    let totalDuplicados = 0;
    const clientesComLancamentosSalvos = new Set<number>(); // Rastrear clientes únicos com lançamentos salvos

    for (const { extrato, clienteId } of extratosFiltradosComCliente) {
      try {
        // Converter dataLancamento (número DDMMYYYY) para Date
        const dataLancamentoRaw = extrato.dataLancamento;
        const dataLancamentoStr = String(dataLancamentoRaw);
        let dia: number;
        let mes: number;
        let ano: number;

        if (dataLancamentoStr.length === 7) {
          dia = parseInt(dataLancamentoStr.slice(0, 1), 10);
          mes = parseInt(dataLancamentoStr.slice(1, 3), 10);
          ano = parseInt(dataLancamentoStr.slice(3), 10);
        } else if (dataLancamentoStr.length === 8) {
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

        // Extrair nome da contrapartida
        let nomeContrapartida: string | undefined = undefined;
        if (infoComplementar) {
          const partes = infoComplementar.trim().split(/\s+/);
          let encontrouCPFCNPJ = false;
          const partesNome: string[] = [];
          
          for (const parte of partes) {
            if (!encontrouCPFCNPJ && /^\d{11,14}$/.test(parte)) {
              encontrouCPFCNPJ = true;
              continue;
            }
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
          clienteId: clienteId, // Usar o clienteId identificado para este extrato específico
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
        clientesComLancamentosSalvos.add(clienteId); // Adicionar cliente ao Set de clientes com lançamentos salvos

      } catch (error) {
        // Erro silencioso - continua processando os demais
        console.error(`Erro ao processar extrato:`, error);
      }
    }

    // Buscar informações dos clientes que tiveram lançamentos salvos
    const clientesIdsArray = Array.from(clientesComLancamentosSalvos);
    const clientesComLancamentos = clientes.filter(c => clientesIdsArray.includes(c.id));

    console.log(`✅ Busca concluída para todos os clientes: ${totalSalvos} salvos, ${totalDuplicados} duplicados, ${clientesComLancamentos.length} clientes únicos com lançamentos`);

    return {
      totalEncontrados: extratosBrutos.length,
      totalFiltrados: extratosFiltradosComCliente.length,
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
        id: clientesComLancamentos.length > 0 ? clientesComLancamentos[0].id : clientes[0]?.id, // Manter compatibilidade
        nome: clientesComLancamentos.length > 0 ? clientesComLancamentos[0].nome : clientes[0]?.nome,
      },
      clientes: clientesComLancamentos.map(c => ({
        id: c.id,
        nome: c.nome,
      })),
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
      // ✅ Incluir dados do cliente vinculado
      cliente: lancamento.cliente ? {
        id: lancamento.cliente.id,
        nome: lancamento.cliente.nome,
        cnpj: lancamento.cliente.cnpj || undefined,
        cpf: lancamento.cliente.cpf || undefined,
      } : undefined,
      // ✅ Incluir dados do pedido vinculado
      // Se pedidoId existe, o relacionamento deve estar carregado
      pedido: lancamento.pedido ? {
        id: lancamento.pedido.id,
        numeroPedido: lancamento.pedido.numeroPedido,
        valorFinal: lancamento.pedido.valorFinal ? Number(lancamento.pedido.valorFinal) : undefined,
        status: lancamento.pedido.status,
      } : undefined,
    };
  }
}

