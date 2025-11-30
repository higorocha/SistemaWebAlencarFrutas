import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  MeioPagamentoFuncionario,
  Prisma,
  StatusFolhaPagamento,
  StatusFuncionario,
  StatusFuncionarioPagamento,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFolhaDto } from './dto/create-folha.dto';
import { ListFolhaQueryDto } from './dto/list-folha-query.dto';
import { AddFuncionariosFolhaDto } from './dto/add-funcionarios.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';
import { ListLancamentosQueryDto } from './dto/list-lancamentos-query.dto';
import { MarcarPagamentoDto } from './dto/marcar-pagamento.dto';
import { FinalizarFolhaDto } from './dto/finalizar-folha.dto';
import { ProcessarPagamentoPixApiDto } from './dto/processar-pix-api.dto';
import { FolhaCalculoService } from './folha-calculo.service';
import { FuncionarioPagamentoStatusService } from './funcionario-pagamento-status.service';
import { PagamentosService } from '../../pagamentos/pagamentos.service';
import { formatarDataParaAPIBB } from '../../utils/formatters';

@Injectable()
export class FolhaPagamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculoService: FolhaCalculoService,
    private readonly statusService: FuncionarioPagamentoStatusService,
    @Inject(forwardRef(() => PagamentosService))
    private readonly pagamentosService: PagamentosService,
  ) {}

  async listarFolhas(query: ListFolhaQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.FolhaPagamentoWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.mes) {
      where.competenciaMes = query.mes;
    }

    if (query.ano) {
      where.competenciaAno = query.ano;
    }

    if (query.periodo) {
      where.periodo = query.periodo;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.folhaPagamento.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ competenciaAno: 'desc' }, { competenciaMes: 'desc' }],
        include: {
          usuarioCriacao: {
            select: {
              id: true,
              nome: true,
            },
          },
          usuarioLiberacao: {
            select: {
              id: true,
              nome: true,
            },
          },
          contaCorrente: {
            select: {
              id: true,
              agencia: true,
              agenciaDigito: true,
              contaCorrente: true,
              contaCorrenteDigito: true,
            },
          },
        },
      }),
      this.prisma.folhaPagamento.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async criarFolha(dto: CreateFolhaDto, usuarioId: number) {
    try {
      // Verificar se existem funcionários ativos
      const funcionariosAtivos = await this.prisma.funcionario.findMany({
        where: {
          status: StatusFuncionario.ATIVO,
        },
        include: { cargo: true, funcao: true },
      });

      if (funcionariosAtivos.length === 0) {
        throw new BadRequestException(
          'Não é possível criar uma folha de pagamento sem funcionários ativos cadastrados.',
        );
      }

      // Criar folha e adicionar todos os funcionários ativos em uma transação
      const folha = await this.prisma.$transaction(async (tx) => {
        const novaFolha = await tx.folhaPagamento.create({
          data: {
            competenciaMes: dto.competenciaMes,
            competenciaAno: dto.competenciaAno,
            periodo: dto.periodo,
            dataInicial: new Date(dto.dataInicial),
            dataFinal: new Date(dto.dataFinal),
            referencia: dto.referencia?.trim(),
            observacoes: dto.observacoes?.trim(),
            status: StatusFolhaPagamento.RASCUNHO,
            usuarioCriacaoId: usuarioId,
          },
        });

        // Adicionar todos os funcionários ativos automaticamente
        for (const funcionario of funcionariosAtivos) {
          await tx.funcionarioPagamento.create({
            data: this.buildLancamentoData(novaFolha.id, funcionario),
          });
        }

        // Recalcular totais da folha
        await this.recalcularFolha(tx, novaFolha.id);

        return novaFolha;
      });

      return folha;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const periodoText = dto.periodo === 1 ? '1ª quinzena' : '2ª quinzena';
        throw new ConflictException(
          `Já existe uma folha criada para ${dto.competenciaMes}/${dto.competenciaAno} - ${periodoText}.`,
        );
      }
      throw new InternalServerErrorException(
        'Erro ao criar folha de pagamento.',
      );
    }
  }

  async detalhesFolha(id: number) {
    return this.ensureFolha(id, true);
  }

  async listarLancamentos(folhaId: number, filtros: ListLancamentosQueryDto) {
    await this.ensureFolha(folhaId);

    const where: Prisma.FuncionarioPagamentoWhereInput = { folhaId };

    if (filtros.meioPagamento) {
      where.meioPagamento = filtros.meioPagamento;
    }

    if (filtros.statusPagamento) {
      where.statusPagamento = filtros.statusPagamento;
    }

    return this.prisma.funcionarioPagamento.findMany({
      where,
      orderBy: [{ pagamentoEfetuado: 'asc' }, { createdAt: 'desc' }],
      include: {
        funcionario: {
          select: {
            nome: true,
            cpf: true,
            tipoContrato: true,
            gerente: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        cargo: {
          select: {
            id: true,
            nome: true,
            isGerencial: true,
          },
        },
        funcao: true,
      },
    });
  }

  async adicionarFuncionarios(folhaId: number, dto: AddFuncionariosFolhaDto) {
    const folha = await this.ensureFolha(folhaId);
    if (folha.status === StatusFolhaPagamento.FECHADA || folha.status === StatusFolhaPagamento.CANCELADA) {
      throw new BadRequestException('Não é possível adicionar funcionários em folhas encerradas.');
    }

    const funcionarios = await this.prisma.funcionario.findMany({
      where: {
        id: { in: dto.funcionarioIds },
        status: StatusFuncionario.ATIVO,
      },
      include: { cargo: true, funcao: true },
    });

    if (funcionarios.length !== dto.funcionarioIds.length) {
      throw new BadRequestException('Alguns funcionários informados não foram encontrados.');
    }

    const existentes = await this.prisma.funcionarioPagamento.findMany({
      where: {
        folhaId,
        funcionarioId: { in: dto.funcionarioIds },
      },
      select: { funcionarioId: true },
    });

    if (existentes.length) {
      const ids = existentes.map((e) => e.funcionarioId).join(', ');
      throw new BadRequestException(
        `Funcionários já vinculados a esta folha: ${ids}.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const funcionario of funcionarios) {
        await tx.funcionarioPagamento.create({
          data: this.buildLancamentoData(folhaId, funcionario),
        });
      }
      await this.recalcularFolha(tx, folhaId);
    });

    return this.listarLancamentos(folhaId, {});
  }

  async removerFuncionario(folhaId: number, lancamentoId: number) {
    const folha = await this.ensureFolha(folhaId);
    if (folha.status === StatusFolhaPagamento.FECHADA || folha.status === StatusFolhaPagamento.CANCELADA) {
      throw new BadRequestException('Não é possível remover funcionários de folhas encerradas.');
    }

    const lancamento = await this.prisma.funcionarioPagamento.findFirst({
      where: { id: lancamentoId, folhaId },
    });

    if (!lancamento) {
      throw new NotFoundException('Lançamento não encontrado nesta folha.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.funcionarioPagamento.delete({
        where: { id: lancamentoId },
      });
      await this.recalcularFolha(tx, folhaId);
    });

    return this.listarLancamentos(folhaId, {});
  }

  async atualizarLancamento(
    folhaId: number,
    lancamentoId: number,
    dto: UpdateLancamentoDto,
  ) {
    const folha = await this.ensureFolha(folhaId);
    if (folha.status === StatusFolhaPagamento.FECHADA) {
      throw new BadRequestException('Folhas fechadas não podem ser editadas.');
    }

    const lancamento = await this.prisma.funcionarioPagamento.findFirst({
      where: { id: lancamentoId, folhaId },
      include: {
        funcionario: {
          include: { cargo: true, funcao: true },
        },
      },
    });

    if (!lancamento) {
      throw new NotFoundException('Lançamento não encontrado.');
    }

    const salarioBase = this.toNumber(lancamento.salarioBaseReferencia);
    const valorDiaria = this.toNumber(lancamento.valorDiariaAplicada);
    const diasTrabalhados = dto.diasTrabalhados ?? lancamento.diasTrabalhados;
    const horasExtras = dto.horasExtras ?? this.toNumber(lancamento.horasExtras);
    const valorHoraExtra = dto.valorHoraExtra ?? this.toNumber(lancamento.valorHoraExtra);
    const ajudaCusto = dto.ajudaCusto ?? this.toNumber(lancamento.ajudaCusto);
    const descontosExtras =
      dto.descontosExtras ?? this.toNumber(lancamento.descontosExtras);
    const adiantamento = dto.adiantamento ?? this.toNumber(lancamento.adiantamento);

    const calculo = this.calculoService.calcularValores({
      tipoContrato: lancamento.tipoContrato,
      salarioBaseReferencia: salarioBase,
      valorDiariaAplicada: valorDiaria,
      diasTrabalhados,
      horasExtras,
      valorHoraExtra,
      ajudaCusto,
      descontosExtras,
      adiantamento,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.funcionarioPagamento.update({
        where: { id: lancamentoId },
        data: {
          diasTrabalhados: dto.diasTrabalhados ?? undefined,
          faltas: dto.faltas ?? undefined,
          horasExtras:
            dto.horasExtras !== undefined ? new Prisma.Decimal(dto.horasExtras) : undefined,
          valorHoraExtra:
            dto.valorHoraExtra !== undefined
              ? new Prisma.Decimal(dto.valorHoraExtra)
              : undefined,
          ajudaCusto:
            dto.ajudaCusto !== undefined
              ? new Prisma.Decimal(dto.ajudaCusto)
              : undefined,
          descontosExtras:
            dto.descontosExtras !== undefined
              ? new Prisma.Decimal(dto.descontosExtras)
              : undefined,
          adiantamento:
            dto.adiantamento !== undefined
              ? new Prisma.Decimal(dto.adiantamento)
              : undefined,
          valorBruto: new Prisma.Decimal(calculo.valorBruto),
          valorLiquido: new Prisma.Decimal(calculo.valorLiquido),
          meioPagamento: dto.meioPagamento ?? undefined,
          statusPagamento: dto.statusPagamento ?? undefined,
          observacoes: dto.observacoes?.trim() ?? undefined,
        },
      });

      await this.recalcularFolha(tx, folhaId);
    });

    return this.listarLancamentos(folhaId, {});
  }

  async marcarPagamento(
    folhaId: number,
    lancamentoId: number,
    dto: MarcarPagamentoDto,
  ) {
    await this.ensureFolha(folhaId);
    const lancamento = await this.prisma.funcionarioPagamento.findFirst({
      where: { id: lancamentoId, folhaId },
    });

    if (!lancamento) {
      throw new NotFoundException('Lançamento não encontrado.');
    }

    const payload = this.statusService.buildStatusPayload(dto);
    if (
      payload.meioPagamento === MeioPagamentoFuncionario.PIX_API &&
      !dto.pagamentoApiItemId
    ) {
      // Integração futura; apenas registrar intenção
      payload.statusPagamento = dto.statusPagamento ?? StatusFuncionarioPagamento.ENVIADO;
      payload.pagamentoEfetuado = false;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.funcionarioPagamento.update({
        where: { id: lancamentoId },
        data: {
          meioPagamento: payload.meioPagamento ?? undefined,
          statusPagamento: payload.statusPagamento ?? undefined,
          pagamentoEfetuado: payload.pagamentoEfetuado ?? undefined,
          dataPagamento: payload.dataPagamento ?? undefined,
          pagamentoApiItemId: payload.pagamentoApiItemId ?? undefined,
        },
      });
      await this.recalcularFolha(tx, folhaId);
    });

    return this.listarLancamentos(folhaId, {});
  }

  async finalizarFolha(id: number, dto: FinalizarFolhaDto, _usuarioId: number) {
    const folha = await this.ensureFolha(id);

    if (folha.status !== StatusFolhaPagamento.RASCUNHO) {
      throw new BadRequestException(
        'Somente folhas em rascunho podem ser finalizadas.',
      );
    }

    // Validar conta corrente se for PIX_API
    if (dto.meioPagamento === MeioPagamentoFuncionario.PIX_API) {
      if (!dto.contaCorrenteId || typeof dto.contaCorrenteId !== 'number' || dto.contaCorrenteId <= 0) {
        throw new BadRequestException(
          'A conta corrente é obrigatória para pagamento via PIX-API e deve ser um número inteiro válido.',
        );
      }
      
      // Verificar se a conta existe
      const conta = await this.prisma.contaCorrente.findUnique({
        where: { id: dto.contaCorrenteId },
      });
      if (!conta) {
        throw new BadRequestException('Conta corrente não encontrada.');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Atualizar todos os lançamentos não pagos com o meio de pagamento e data
      await tx.funcionarioPagamento.updateMany({
        where: {
          folhaId: id,
          pagamentoEfetuado: false, // Apenas os que não foram pagos individualmente
        },
        data: {
          meioPagamento: dto.meioPagamento,
          dataPagamento: new Date(dto.dataPagamento),
          statusPagamento: StatusFuncionarioPagamento.PENDENTE,
        },
      });

      // Atualizar status e dados de pagamento da folha
      await tx.folhaPagamento.update({
        where: { id },
        data: {
          status: StatusFolhaPagamento.PENDENTE_LIBERACAO,
          meioPagamento: dto.meioPagamento,
          dataPagamento: new Date(dto.dataPagamento),
          contaCorrenteId: dto.contaCorrenteId ?? null,
          dataProcessamento: new Date(),
          observacoes: dto.observacoes?.trim() ?? undefined,
        },
      });
    });

    return this.detalhesFolha(id);
  }

  async reabrirFolha(id: number, _usuarioId: number) {
    const folha = await this.ensureFolha(id);

    if (folha.status !== StatusFolhaPagamento.PENDENTE_LIBERACAO) {
      throw new BadRequestException(
        'Somente folhas pendentes de liberação podem ser reabertas.',
      );
    }

    // Nota: O envio ao BB (processarPagamentoPixApi) só ocorre ao "Liberar Folha",
    // então é seguro reabrir folhas em PENDENTE_LIBERACAO mesmo com PIX_API,
    // pois nenhum lote foi criado ainda.

    // Limpar dados de pagamento da folha e dos lançamentos
    await this.prisma.$transaction(async (tx) => {
      // Limpar meio de pagamento e data dos lançamentos não pagos
      await tx.funcionarioPagamento.updateMany({
        where: {
          folhaId: id,
          pagamentoEfetuado: false,
        },
        data: {
          meioPagamento: MeioPagamentoFuncionario.PIX, // Volta ao default
          dataPagamento: null,
          statusPagamento: StatusFuncionarioPagamento.PENDENTE,
        },
      });

      // Limpar dados de pagamento da folha
      await tx.folhaPagamento.update({
        where: { id },
        data: {
          status: StatusFolhaPagamento.RASCUNHO,
          meioPagamento: null,
          dataPagamento: null,
          contaCorrenteId: null,
          dataProcessamento: null,
        },
      });
    });

    return this.detalhesFolha(id);
  }

  /**
   * Libera uma folha de pagamento
   * Orquestra automaticamente o processamento PIX-API (se aplicável) e a liberação
   * 
   * @param id ID da folha de pagamento
   * @param usuarioId ID do usuário que está liberando
   * @returns Detalhes da folha liberada
   */
  async liberarFolha(id: number, usuarioId: number) {
    const folha = await this.ensureFolha(id);

    // Aceitar folhas em PENDENTE_LIBERACAO ou EM_PROCESSAMENTO (quando PIX_API já foi processado)
    if (
      folha.status !== StatusFolhaPagamento.PENDENTE_LIBERACAO &&
      folha.status !== StatusFolhaPagamento.EM_PROCESSAMENTO
    ) {
      throw new BadRequestException(
        'Somente folhas pendentes de liberação ou em processamento podem ser liberadas.',
      );
    }

    // Se PIX_API, processar internamente primeiro (com idempotência)
    if (folha.meioPagamento === MeioPagamentoFuncionario.PIX_API) {
      await this.processarPixApiSeNecessario(folha.id, usuarioId);
    }

    // Liberar folha (funciona para todos os meios de pagamento)
    await this.liberarFolhaInterna(folha.id, usuarioId);

    return this.detalhesFolha(id);
  }

  /**
   * Processa PIX-API se necessário (com idempotência)
   * Verifica se já existem lotes criados antes de criar novos
   * 
   * @param folhaId ID da folha de pagamento
   * @param usuarioId ID do usuário
   * @private
   */
  private async processarPixApiSeNecessario(
    folhaId: number,
    usuarioId: number,
  ): Promise<void> {
    // Buscar lançamentos sem lote criado (idempotência)
    const lancamentos = await this.prisma.funcionarioPagamento.findMany({
      where: {
        folhaId,
        meioPagamento: MeioPagamentoFuncionario.PIX_API,
        pagamentoEfetuado: false,
        pagamentoApiItemId: null, // ⭐ IDEMPOTÊNCIA: só os que não têm lote
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            chavePix: true,
            tipoChavePix: true,
            responsavelChavePix: true,
          },
        },
      },
    });

    // ⭐ IDEMPOTÊNCIA: Se todos já têm lote, não precisa processar
    if (lancamentos.length === 0) {
      console.log(
        `✅ [LIBERAR-FOLHA] Todos os lançamentos da folha ${folhaId} já têm lotes criados. Pulando criação de lotes.`,
      );
      return;
    }

    // Verificar estado inconsistente (alguns têm lote, outros não)
    const todosLancamentos = await this.prisma.funcionarioPagamento.findMany({
      where: {
        folhaId,
        meioPagamento: MeioPagamentoFuncionario.PIX_API,
        pagamentoEfetuado: false,
      },
      select: {
        id: true,
        pagamentoApiItemId: true,
      },
    });

    const algunsComLote = todosLancamentos.some(
      (l) => l.pagamentoApiItemId !== null,
    );

    if (algunsComLote) {
      console.warn(
        `⚠️ [LIBERAR-FOLHA] Estado inconsistente detectado na folha ${folhaId}: alguns lançamentos já têm lotes. Criando lotes apenas para os faltantes.`,
      );
    }

    // Buscar dados da folha e conta
    const folha = await this.prisma.folhaPagamento.findUnique({
      where: { id: folhaId },
    });

    if (!folha) {
      throw new NotFoundException('Folha não encontrada.');
    }

    if (!folha.contaCorrenteId) {
      throw new BadRequestException(
        'Conta corrente não definida para a folha. Reabra a folha e finalize novamente selecionando a conta corrente.',
      );
    }

    // Validar tudo antes de chamar BB
    // Validar chaves PIX
    const funcionariosSemChave = lancamentos.filter(
      (l) => !l.funcionario.chavePix || !l.funcionario.tipoChavePix,
    );

    if (funcionariosSemChave.length > 0) {
      const nomes = funcionariosSemChave
        .map((l) => l.funcionario.nome)
        .join(', ');
      throw new BadRequestException(
        `Os seguintes funcionários não possuem chave PIX cadastrada: ${nomes}. Configure a chave PIX antes de processar.`,
      );
    }

    // Validar valores > 0
    const lancamentosSemValor = lancamentos.filter(
      (l) => Number(l.valorLiquido) <= 0,
    );

    if (lancamentosSemValor.length > 0) {
      const nomes = lancamentosSemValor
        .map((l) => l.funcionario.nome)
        .join(', ');
      throw new BadRequestException(
        `Os seguintes funcionários têm valor líquido igual a zero: ${nomes}. Ajuste os valores antes de processar.`,
      );
    }

    // Buscar conta corrente
    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id: folha.contaCorrenteId },
    });

    if (!contaCorrente) {
      throw new NotFoundException(
        `Conta corrente ID ${folha.contaCorrenteId} não encontrada.`,
      );
    }

    // Criar lotes para os lançamentos que não têm
    await this.criarLotesParaLancamentos(
      lancamentos,
      folha,
      contaCorrente,
      usuarioId,
    );
  }

  /**
   * Cria lotes de pagamento PIX no BB para os lançamentos fornecidos
   * 
   * @param lancamentos Lançamentos que precisam de lotes (já validados com chave PIX)
   * @param folha Folha de pagamento
   * @param contaCorrente Conta corrente para débito
   * @param usuarioId ID do usuário
   * @private
   */
  private async criarLotesParaLancamentos(
    lancamentos: Array<{
      id: number;
      valorLiquido: Prisma.Decimal;
      funcionario: {
        id: number;
        nome: string;
        cpf: string;
        chavePix: string | null;
        tipoChavePix: number | null;
      };
    }>,
    folha: {
      id: number;
      competenciaMes: number;
      competenciaAno: number;
      periodo: number | null;
      observacoes: string | null;
    },
    contaCorrente: {
      id: number;
      agencia: string;
      contaCorrente: string;
      contaCorrenteDigito: string | null;
    },
    usuarioId: number,
  ): Promise<void> {
    // Montar lista de transferências (1 por funcionário)
    const dataAtual = new Date();
    const dataPagamentoFormatada = formatarDataParaAPIBB(dataAtual.toISOString());
    const competenciaRef = `${String(folha.competenciaMes).padStart(2, '0')}/${folha.competenciaAno}`;
    const quinzenaRef = folha.periodo === 1 ? '1Q' : '2Q';

    const transferenciasComLancamento = lancamentos.map((lancamento) => {
      const func = lancamento.funcionario;
      const valor = Number(lancamento.valorLiquido).toFixed(2);

      // Validação: chave PIX e tipo devem estar presentes (já validado antes, mas TypeScript precisa)
      if (!func.chavePix || !func.tipoChavePix) {
        throw new BadRequestException(
          `Funcionário ${func.nome} não possui chave PIX cadastrada.`,
        );
      }

      const descricaoPagamento = func.nome.substring(0, 40);
      const descricaoPagamentoInstantaneo = `FOLHA ${competenciaRef} ${quinzenaRef}`.substring(0, 26);

      const transferencia: any = {
        data: dataPagamentoFormatada,
        valor,
        descricaoPagamento,
        descricaoPagamentoInstantaneo,
        formaIdentificacao: func.tipoChavePix,
      };

      const chavePix = func.chavePix.trim();

      switch (func.tipoChavePix) {
        case 1: // Telefone
          const telefoneLimpo = chavePix.replace(/\D/g, '');
          transferencia.dddTelefone = telefoneLimpo.substring(0, 2);
          transferencia.telefone = telefoneLimpo.substring(2);
          break;
        case 2: // Email
          transferencia.email = chavePix;
          break;
        case 3: // CPF/CNPJ
          const documento = chavePix.replace(/\D/g, '');
          if (documento.length === 11) {
            transferencia.cpf = documento;
          } else if (documento.length === 14) {
            transferencia.cnpj = documento;
          }
          break;
        case 4: // Chave Aleatória
          transferencia.identificacaoAleatoria = chavePix;
          break;
      }

      return { transferencia, lancamento };
    });

    // Dividir em lotes de no máximo 320 transferências
    const LIMITE_TRANSFERENCIAS_POR_LOTE = 320;
    const chunks: typeof transferenciasComLancamento[] = [];

    for (
      let i = 0;
      i < transferenciasComLancamento.length;
      i += LIMITE_TRANSFERENCIAS_POR_LOTE
    ) {
      chunks.push(
        transferenciasComLancamento.slice(i, i + LIMITE_TRANSFERENCIAS_POR_LOTE),
      );
    }

    const periodoLabel = folha.periodo === 1 ? '1ª Quinzena' : '2ª Quinzena';
    const origemNomeFolha = `Folha de Pagamento ${competenciaRef} - ${periodoLabel}`;

    console.log(
      `📤 [LIBERAR-FOLHA] Processando ${lancamentos.length} transferência(s) em ${chunks.length} lote(s) para folha ${folha.id}`,
    );

    // Processar cada lote
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const listaTransferencias = chunk.map((c) => c.transferencia);

      const payloadPagamento = {
        contaCorrenteId: contaCorrente.id,
        agenciaDebito: contaCorrente.agencia,
        contaCorrenteDebito: contaCorrente.contaCorrente,
        digitoVerificadorContaCorrente: contaCorrente.contaCorrenteDigito || 'X',
        tipoPagamento: 128, // 128 = Pagamentos diversos
        listaTransferencias,
        origemTipo: 'FOLHA_PAGAMENTO',
        origemNome: origemNomeFolha,
      };

      console.log(
        `📤 [LIBERAR-FOLHA] Enviando lote ${chunkIndex + 1}/${chunks.length} com ${listaTransferencias.length} transferência(s)`,
      );

      let respostaApi;
      try {
        respostaApi = await this.pagamentosService.solicitarTransferenciaPix(
          payloadPagamento,
          usuarioId,
        );
      } catch (error) {
        console.error(
          `❌ [LIBERAR-FOLHA] Erro ao criar lote ${chunkIndex + 1}:`,
          error.message,
        );
        throw new InternalServerErrorException(
          `Erro ao criar lote de pagamentos ${chunkIndex + 1}/${chunks.length} no Banco do Brasil: ${error.message}`,
        );
      }

      const numeroRequisicao = respostaApi?.numeroRequisicao;
      if (!numeroRequisicao) {
        throw new InternalServerErrorException(
          `Resposta da API do lote ${chunkIndex + 1} não contém número da requisição.`,
        );
      }

      const lote = await this.prisma.pagamentoApiLote.findUnique({
        where: { numeroRequisicao },
        include: {
          itensPagamento: {
            orderBy: { indiceLote: 'asc' },
          },
        },
      });

      if (!lote) {
        throw new InternalServerErrorException(
          `Lote ${numeroRequisicao} não encontrado após criação.`,
        );
      }

      // Vincular cada item do lote ao respectivo lançamento (1:1)
      await this.prisma.$transaction(async (tx) => {
        for (let i = 0; i < chunk.length; i++) {
          const { lancamento } = chunk[i];
          const item = lote.itensPagamento[i];

          if (item) {
            await tx.funcionarioPagamento.update({
              where: { id: lancamento.id },
              data: {
                pagamentoApiItemId: item.id,
                statusPagamento: StatusFuncionarioPagamento.ENVIADO,
              },
            });

            await tx.pagamentoApiItem.update({
              where: { id: item.id },
              data: {
                funcionarioPagamentoId: lancamento.id,
              },
            });
          }
        }
      });

      console.log(
        `✅ [LIBERAR-FOLHA] Lote ${chunkIndex + 1}/${chunks.length} (numeroRequisicao: ${numeroRequisicao}) criado com ${chunk.length} transferência(s)`,
      );
    }

    // Atualizar status da folha para EM_PROCESSAMENTO
    await this.prisma.$transaction(async (tx) => {
      await tx.folhaPagamento.update({
        where: { id: folha.id },
        data: {
          status: StatusFolhaPagamento.EM_PROCESSAMENTO,
        },
      });

      await this.recalcularFolha(tx, folha.id);
    });

    console.log(
      `✅ [LIBERAR-FOLHA] ${chunks.length} lote(s) criado(s) com total de ${lancamentos.length} transferência(s) para folha ${folha.id}`,
    );
  }

  /**
   * Libera a folha internamente (atualiza status dos lançamentos e fecha a folha)
   * 
   * @param folhaId ID da folha de pagamento
   * @param usuarioId ID do usuário
   * @private
   */
  private async liberarFolhaInterna(
    folhaId: number,
    usuarioId: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Buscar todos os lançamentos não pagos
      const lancamentosPendentes = await tx.funcionarioPagamento.findMany({
        where: {
          folhaId,
          pagamentoEfetuado: false,
        },
      });

      // Processar cada lançamento conforme o meio de pagamento
      for (const lancamento of lancamentosPendentes) {
        if (lancamento.meioPagamento === MeioPagamentoFuncionario.PIX_API) {
          // PIX_API: Manter ENVIADO (já foi atualizado no processamento)
          await tx.funcionarioPagamento.update({
            where: { id: lancamento.id },
            data: {
              statusPagamento: StatusFuncionarioPagamento.ENVIADO,
            },
          });
        } else {
          // PIX Manual ou ESPÉCIE: Marcar como PAGO imediatamente
          await tx.funcionarioPagamento.update({
            where: { id: lancamento.id },
            data: {
              statusPagamento: StatusFuncionarioPagamento.PAGO,
              pagamentoEfetuado: true,
            },
          });
        }
      }

      // Recalcular totais da folha
      await this.recalcularFolha(tx, folhaId);

      // Fechar a folha
      await tx.folhaPagamento.update({
        where: { id: folhaId },
        data: {
          status: StatusFolhaPagamento.FECHADA,
          dataFechamento: new Date(),
          dataLiberacao: new Date(),
          usuarioLiberacaoId: usuarioId,
        },
      });
    });
  }

  /**
   * Processa pagamentos da folha via PIX-API do Banco do Brasil
   * Cria um lote de transferências PIX com 1 item por funcionário
   * O lote ficará pendente de liberação por um administrador
   * 
   * @deprecated Use `liberarFolha` que orquestra automaticamente o processamento PIX-API e a liberação.
   * Este método será mantido apenas para compatibilidade e uso manual em casos específicos.
   * 
   * @param folhaId ID da folha de pagamento
   * @param dto Dados do processamento (conta corrente, data, observações)
   * @param usuarioId ID do usuário que está processando
   * @returns Resumo do processamento com dados do lote criado
   */
  async processarPagamentoPixApi(
    folhaId: number,
    dto: ProcessarPagamentoPixApiDto,
    usuarioId: number,
  ) {
    // 1. Validar que a folha está em status PENDENTE_LIBERACAO
    const folha = await this.ensureFolha(folhaId);

    if (folha.status !== StatusFolhaPagamento.PENDENTE_LIBERACAO) {
      throw new BadRequestException(
        'Somente folhas pendentes de liberação podem ser processadas via PIX-API.',
      );
    }

    // 2. Buscar lançamentos com PIX_API não pagos, incluindo dados do funcionário
    const lancamentos = await this.prisma.funcionarioPagamento.findMany({
      where: {
        folhaId,
        meioPagamento: MeioPagamentoFuncionario.PIX_API,
        pagamentoEfetuado: false,
        pagamentoApiItemId: null, // Apenas os que ainda não foram enviados
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            chavePix: true,
            tipoChavePix: true,
            responsavelChavePix: true,
          },
        },
      },
    });

    if (lancamentos.length === 0) {
      throw new BadRequestException(
        'Não há lançamentos pendentes com PIX-API para processar nesta folha.',
      );
    }

    // 3. Validar que todos os funcionários têm chave PIX cadastrada
    const funcionariosSemChave = lancamentos.filter(
      (l) => !l.funcionario.chavePix || !l.funcionario.tipoChavePix,
    );

    if (funcionariosSemChave.length > 0) {
      const nomes = funcionariosSemChave.map((l) => l.funcionario.nome).join(', ');
      throw new BadRequestException(
        `Os seguintes funcionários não possuem chave PIX cadastrada: ${nomes}. Configure a chave PIX antes de processar.`,
      );
    }

    // 4. Validar que todos têm valor > 0
    const lancamentosSemValor = lancamentos.filter(
      (l) => Number(l.valorLiquido) <= 0,
    );

    if (lancamentosSemValor.length > 0) {
      const nomes = lancamentosSemValor.map((l) => l.funcionario.nome).join(', ');
      throw new BadRequestException(
        `Os seguintes funcionários têm valor líquido igual a zero: ${nomes}. Ajuste os valores antes de processar.`,
      );
    }

    // 5. Buscar dados da conta corrente antes de montar as transferências
    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id: dto.contaCorrenteId },
    });

    if (!contaCorrente) {
      throw new NotFoundException(
        `Conta corrente ID ${dto.contaCorrenteId} não encontrada.`,
      );
    }

    // 6. Montar lista de transferências (1 por funcionário)
    // IMPORTANTE: Usar data atual (hoje) ao invés da data salva na folha
    // para evitar enviar remessas com data retroativa ao banco
    const dataAtual = new Date();
    const dataPagamentoFormatada = formatarDataParaAPIBB(dataAtual.toISOString());
    const competenciaRef = `${String(folha.competenciaMes).padStart(2, '0')}/${folha.competenciaAno}`;
    const quinzenaRef = folha.periodo === 1 ? '1Q' : '2Q';

    // Mapeamento: índice na lista -> lançamento (para vincular depois)
    const transferenciasComLancamento = lancamentos.map((lancamento) => {
      const func = lancamento.funcionario;
      const valor = Number(lancamento.valorLiquido).toFixed(2);

      // Descrição limitada a 40 caracteres (nome do funcionário)
      const descricaoPagamento = func.nome.substring(0, 40);
      
      // Descrição instantânea limitada a 26 caracteres (FOLHA MM/AAAA Q)
      const descricaoPagamentoInstantaneo = `FOLHA ${competenciaRef} ${quinzenaRef}`.substring(0, 26);

      // Montar transferência base
      const transferencia: any = {
        data: dataPagamentoFormatada,
        valor,
        descricaoPagamento,
        descricaoPagamentoInstantaneo,
        formaIdentificacao: func.tipoChavePix,
      };

      // Adicionar campos condicionais por tipo de chave PIX
      const chavePix = (func.chavePix || '').trim();
      
      switch (func.tipoChavePix) {
        case 1: // Telefone
          const telefoneLimpo = chavePix.replace(/\D/g, '');
          transferencia.dddTelefone = telefoneLimpo.substring(0, 2);
          transferencia.telefone = telefoneLimpo.substring(2);
          break;
        case 2: // Email
          transferencia.email = chavePix;
          break;
        case 3: // CPF/CNPJ
          const documento = chavePix.replace(/\D/g, '');
          if (documento.length === 11) {
            transferencia.cpf = documento;
          } else if (documento.length === 14) {
            transferencia.cnpj = documento;
          }
          break;
        case 4: // Chave Aleatória
          transferencia.identificacaoAleatoria = chavePix;
          break;
      }

      return { transferencia, lancamento };
    });

    // 7. Dividir em lotes de no máximo 320 transferências (limite do BB para PIX)
    const LIMITE_TRANSFERENCIAS_POR_LOTE = 320;
    const chunks: typeof transferenciasComLancamento[] = [];
    
    for (let i = 0; i < transferenciasComLancamento.length; i += LIMITE_TRANSFERENCIAS_POR_LOTE) {
      chunks.push(transferenciasComLancamento.slice(i, i + LIMITE_TRANSFERENCIAS_POR_LOTE));
    }

    // Preparar informações de origem para notificações
    const periodoLabel = folha.periodo === 1 ? '1ª Quinzena' : '2ª Quinzena';
    const origemNomeFolha = `Folha de Pagamento ${competenciaRef} - ${periodoLabel}`;

    console.log(`📤 [FOLHA-PIX-API] Processando ${lancamentos.length} transferência(s) em ${chunks.length} lote(s) para folha ${folhaId}`);

    // 8. Processar cada lote
    const lotesProcessados: Array<{
      numeroRequisicao: number;
      loteId: number;
      quantidadeItens: number;
    }> = [];

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const listaTransferencias = chunk.map((c) => c.transferencia);

      // Montar DTO para PagamentosService
      const payloadPagamento = {
        contaCorrenteId: dto.contaCorrenteId,
        agenciaDebito: contaCorrente.agencia,
        contaCorrenteDebito: contaCorrente.contaCorrente,
        digitoVerificadorContaCorrente: contaCorrente.contaCorrenteDigito || 'X',
        tipoPagamento: 128, // 128 = Pagamentos diversos
        listaTransferencias,
        origemTipo: 'FOLHA_PAGAMENTO',
        origemNome: origemNomeFolha,
      };

      console.log(`📤 [FOLHA-PIX-API] Enviando lote ${chunkIndex + 1}/${chunks.length} com ${listaTransferencias.length} transferência(s)`);

      // Chamar PagamentosService para criar o lote
      let respostaApi;
      try {
        respostaApi = await this.pagamentosService.solicitarTransferenciaPix(
          payloadPagamento,
          usuarioId,
        );
      } catch (error) {
        console.error(`❌ [FOLHA-PIX-API] Erro ao criar lote ${chunkIndex + 1}:`, error.message);
        throw new InternalServerErrorException(
          `Erro ao criar lote de pagamentos ${chunkIndex + 1}/${chunks.length} no Banco do Brasil: ${error.message}`,
        );
      }

      // Buscar o lote criado para obter os IDs dos itens
      const numeroRequisicao = respostaApi?.numeroRequisicao;
      if (!numeroRequisicao) {
        throw new InternalServerErrorException(
          `Resposta da API do lote ${chunkIndex + 1} não contém número da requisição.`,
        );
      }

      const lote = await this.prisma.pagamentoApiLote.findUnique({
        where: { numeroRequisicao },
        include: {
          itensPagamento: {
            orderBy: { indiceLote: 'asc' },
          },
        },
      });

      if (!lote) {
        throw new InternalServerErrorException(
          `Lote ${numeroRequisicao} não encontrado após criação.`,
        );
      }

      // Vincular cada item do lote ao respectivo lançamento (1:1)
      await this.prisma.$transaction(async (tx) => {
        for (let i = 0; i < chunk.length; i++) {
          const { lancamento } = chunk[i];
          const item = lote.itensPagamento[i];

          if (item) {
            // Atualizar o lançamento com o ID do item de pagamento
            await tx.funcionarioPagamento.update({
              where: { id: lancamento.id },
              data: {
                pagamentoApiItemId: item.id,
                statusPagamento: StatusFuncionarioPagamento.ENVIADO,
              },
            });

            // Atualizar o item com o ID do funcionário
            await tx.pagamentoApiItem.update({
              where: { id: item.id },
              data: {
                funcionarioPagamentoId: lancamento.id,
              },
            });
          }
        }
      });

      lotesProcessados.push({
        numeroRequisicao,
        loteId: lote.id,
        quantidadeItens: chunk.length,
      });

      console.log(`✅ [FOLHA-PIX-API] Lote ${chunkIndex + 1}/${chunks.length} (numeroRequisicao: ${numeroRequisicao}) criado com ${chunk.length} transferência(s)`);
    }

    // 9. Atualizar status da folha para EM_PROCESSAMENTO
    await this.prisma.$transaction(async (tx) => {
      await tx.folhaPagamento.update({
        where: { id: folhaId },
        data: {
          status: StatusFolhaPagamento.EM_PROCESSAMENTO,
          observacoes: dto.observacoes 
            ? `${folha.observacoes || ''} | PIX-API: ${dto.observacoes}`.trim()
            : folha.observacoes,
        },
      });

      // Recalcular totais
      await this.recalcularFolha(tx, folhaId);
    });

    console.log(`✅ [FOLHA-PIX-API] ${lotesProcessados.length} lote(s) criado(s) com total de ${lancamentos.length} transferência(s)`);

    // 10. Retornar resumo
    const valorTotalEnviado = lancamentos.reduce((acc, l) => acc + Number(l.valorLiquido), 0);
    
    return {
      sucesso: true,
      mensagem: lotesProcessados.length === 1
        ? `Lote de pagamentos criado com sucesso. ${lancamentos.length} transferência(s) enviada(s) para processamento.`
        : `${lotesProcessados.length} lotes de pagamentos criados com sucesso. ${lancamentos.length} transferência(s) enviada(s) para processamento.`,
      lotes: lotesProcessados.map((lp) => ({
        id: lp.loteId,
        numeroRequisicao: lp.numeroRequisicao,
        quantidadeTransferencias: lp.quantidadeItens,
      })),
      resumo: {
        totalLotes: lotesProcessados.length,
        totalTransferencias: lancamentos.length,
        valorTotalEnviado,
      },
      proximoPasso: lotesProcessados.length === 1
        ? 'Aguarde a liberação do lote por um administrador para que os pagamentos sejam processados pelo banco.'
        : `Aguarde a liberação dos ${lotesProcessados.length} lotes por um administrador para que os pagamentos sejam processados pelo banco.`,
    };
  }

  private buildLancamentoData(
    folhaId: number,
    funcionario: Prisma.FuncionarioGetPayload<{
      include: { cargo: true; funcao: true };
    }>,
  ): Prisma.FuncionarioPagamentoUncheckedCreateInput {
    const salarioBase =
      Number(funcionario.salarioCustomizado ?? 0) ||
      Number(funcionario.cargo?.salarioMensal ?? 0);
    const valorDiaria =
      Number(funcionario.valorDiariaCustomizada ?? 0) ||
      Number(funcionario.funcao?.valorDiariaBase ?? 0);

    const calculo = this.calculoService.calcularValores({
      tipoContrato: funcionario.tipoContrato,
      salarioBaseReferencia: salarioBase,
      valorDiariaAplicada: valorDiaria,
      diasTrabalhados: 0,
      horasExtras: 0,
      valorHoraExtra: 0,
      ajudaCusto: 0,
      descontosExtras: 0,
      adiantamento: 0,
    });

    return {
      folhaId,
      funcionarioId: funcionario.id,
      cargoId: funcionario.cargoId ?? null,
      funcaoId: funcionario.funcaoId ?? null,
      tipoContrato: funcionario.tipoContrato,
      referenciaNomeCargo: funcionario.cargo?.nome,
      referenciaNomeFuncao: funcionario.funcao?.nome,
      salarioBaseReferencia: new Prisma.Decimal(salarioBase),
      valorDiariaAplicada: new Prisma.Decimal(valorDiaria),
      diasTrabalhados: 0,
      faltas: 0,
      ajudaCusto: new Prisma.Decimal(0),
      descontosExtras: new Prisma.Decimal(0),
      adiantamento: new Prisma.Decimal(0),
      valorBruto: new Prisma.Decimal(calculo.valorBruto),
      valorLiquido: new Prisma.Decimal(calculo.valorLiquido),
      meioPagamento: MeioPagamentoFuncionario.PIX,
      statusPagamento: StatusFuncionarioPagamento.PENDENTE,
      pagamentoEfetuado: false,
      funcionarioSnapshot: {
        id: funcionario.id,
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        tipoContrato: funcionario.tipoContrato,
        cargo: funcionario.cargo ? { id: funcionario.cargo.id, nome: funcionario.cargo.nome } : null,
        funcao: funcionario.funcao ? { id: funcionario.funcao.id, nome: funcionario.funcao.nome } : null,
      },
    };
  }

  private async ensureFolha(id: number, withLancamentos = false) {
    const folha = await this.prisma.folhaPagamento.findUnique({
      where: { id },
      include: {
        usuarioCriacao: {
          select: {
            id: true,
            nome: true,
          },
        },
        usuarioLiberacao: {
          select: {
            id: true,
            nome: true,
          },
        },
        contaCorrente: {
          select: {
            id: true,
            agencia: true,
            agenciaDigito: true,
            contaCorrente: true,
            contaCorrenteDigito: true,
          },
        },
        ...(withLancamentos
          ? {
              pagamentos: {
                include: { funcionario: { select: { nome: true, cpf: true } } },
              },
            }
          : {}),
      },
    });

    if (!folha) {
      throw new NotFoundException('Folha não encontrada.');
    }

    return folha;
  }

  private async recalcularFolha(tx: Prisma.TransactionClient, folhaId: number) {
    const agregados = await tx.funcionarioPagamento.aggregate({
      where: { folhaId },
      _sum: {
        valorBruto: true,
        valorLiquido: true,
      },
    });

    const pagos = await tx.funcionarioPagamento.aggregate({
      where: { folhaId, pagamentoEfetuado: true },
      _sum: {
        valorLiquido: true,
      },
    });

    const quantidade = await tx.funcionarioPagamento.count({ where: { folhaId } });

    const totalBruto = Number(agregados._sum.valorBruto ?? 0);
    const totalLiquido = Number(agregados._sum.valorLiquido ?? 0);
    const totalPago = Number(pagos._sum.valorLiquido ?? 0);

    await tx.folhaPagamento.update({
      where: { id: folhaId },
      data: {
        totalBruto: new Prisma.Decimal(totalBruto),
        totalLiquido: new Prisma.Decimal(totalLiquido),
        totalPago: new Prisma.Decimal(totalPago),
        totalPendente: new Prisma.Decimal(Math.max(totalLiquido - totalPago, 0)),
        quantidadeLancamentos: quantidade,
      },
    });
  }

  /**
   * Reprocessa os salários brutos da folha
   * Atualiza os valores base (salário/diária) dos lançamentos com os valores atuais dos cargos/funções
   * Recalcula valor bruto e líquido de todos os lançamentos
   */
  async reprocessarFolha(folhaId: number, _usuarioId: number) {
    const folha = await this.ensureFolha(folhaId);
    
    if (folha.status === StatusFolhaPagamento.FECHADA || folha.status === StatusFolhaPagamento.CANCELADA) {
      throw new BadRequestException('Não é possível reprocessar folhas encerradas.');
    }

    // Buscar todos os lançamentos com seus funcionários e cargos/funções
    const lancamentos = await this.prisma.funcionarioPagamento.findMany({
      where: { folhaId },
      include: {
        funcionario: {
          include: { cargo: true, funcao: true },
        },
      },
    });

    if (lancamentos.length === 0) {
      throw new BadRequestException('Não há lançamentos para reprocessar.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Atualizar cada lançamento com os valores atuais
      for (const lancamento of lancamentos) {
        const funcionario = lancamento.funcionario;
        
        // Obter valores atuais do cargo/função
        const salarioBaseAtual =
          Number(funcionario.salarioCustomizado ?? 0) ||
          Number(funcionario.cargo?.salarioMensal ?? 0);
        const valorDiariaAtual =
          Number(funcionario.valorDiariaCustomizada ?? 0) ||
          Number(funcionario.funcao?.valorDiariaBase ?? 0);

        // Recalcular valores com os novos salários base
        const calculo = this.calculoService.calcularValores({
          tipoContrato: lancamento.tipoContrato,
          salarioBaseReferencia: salarioBaseAtual,
          valorDiariaAplicada: valorDiariaAtual,
          diasTrabalhados: lancamento.diasTrabalhados,
          horasExtras: this.toNumber(lancamento.horasExtras),
          valorHoraExtra: this.toNumber(lancamento.valorHoraExtra),
          ajudaCusto: this.toNumber(lancamento.ajudaCusto),
          descontosExtras: this.toNumber(lancamento.descontosExtras),
          adiantamento: this.toNumber(lancamento.adiantamento),
        });

        // Atualizar lançamento
        await tx.funcionarioPagamento.update({
          where: { id: lancamento.id },
          data: {
            salarioBaseReferencia: new Prisma.Decimal(salarioBaseAtual),
            valorDiariaAplicada: new Prisma.Decimal(valorDiariaAtual),
            valorBruto: new Prisma.Decimal(calculo.valorBruto),
            valorLiquido: new Prisma.Decimal(calculo.valorLiquido),
            // Atualizar também os nomes de referência caso tenham mudado
            referenciaNomeCargo: funcionario.cargo?.nome ?? null,
            referenciaNomeFuncao: funcionario.funcao?.nome ?? null,
          },
        });
      }

      // Recalcular totais da folha
      await this.recalcularFolha(tx, folhaId);
    });

    return {
      mensagem: `Folha reprocessada com sucesso. ${lancamentos.length} lançamento(s) atualizado(s).`,
      quantidadeLancamentos: lancamentos.length,
    };
  }

  /**
   * Exclui uma folha de pagamento
   * Só é permitido se a folha estiver em status RASCUNHO
   */
  async excluirFolha(folhaId: number, _usuarioId: number) {
    const folha = await this.ensureFolha(folhaId);
    
    if (folha.status !== StatusFolhaPagamento.RASCUNHO) {
      throw new BadRequestException(
        'Somente folhas em rascunho podem ser excluídas.',
      );
    }

    // Excluir folha (os lançamentos serão excluídos em cascata pelo Prisma)
    await this.prisma.folhaPagamento.delete({
      where: { id: folhaId },
    });

    return {
      mensagem: 'Folha de pagamento excluída com sucesso.',
    };
  }

  private toNumber(value?: Prisma.Decimal | number | null): number {
    if (value === null || value === undefined) {
      return 0;
    }
    return typeof value === 'number' ? value : Number(value);
  }
}

