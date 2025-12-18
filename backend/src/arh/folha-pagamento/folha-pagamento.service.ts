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
  StatusPagamentoLote,
  StatusPagamentoItem,
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
import { ReprocessarPagamentosRejeitadosDto } from './dto/reprocessar-pagamentos-rejeitados.dto';
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
        orderBy: [
          { competenciaAno: 'desc' }, 
          { competenciaMes: 'desc' },
          { periodo: 'desc' }, // 2ª quinzena antes da 1ª quinzena (mais recente primeiro)
        ],
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

    // Adicionar informação sobre rejeitados em cada folha
    const folhasComRejeitados = await Promise.all(
      data.map(async (folha) => {
        const quantidadeRejeitados = await this.prisma.funcionarioPagamento.count({
          where: {
            folhaId: folha.id,
            statusPagamento: StatusFuncionarioPagamento.REJEITADO,
            pagamentoEfetuado: false,
          },
        });
        return {
          ...folha,
          temRejeitados: quantidadeRejeitados > 0,
          quantidadeRejeitados,
        };
      }),
    );

    return {
      data: folhasComRejeitados,
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

    // Verificar se deve incluir dados do PagamentoApiItem
    const includePagamentoApiItem = filtros.includePagamentoApiItem === true;

    return this.prisma.funcionarioPagamento.findMany({
      where,
      orderBy: [{ pagamentoEfetuado: 'asc' }, { createdAt: 'desc' }],
      include: {
        funcionario: {
          select: {
            nome: true,
            apelido: true,
            cpf: true,
            chavePix: true,
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
        ...(includePagamentoApiItem && {
          pagamentoApiItem: {
            select: {
              id: true,
              chavePixEnviada: true,
              responsavelChavePixEnviado: true,
              payloadItemEnviado: true,
              estadoPagamentoIndividual: true,
              status: true,
            },
          },
        }),
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
    const extras =
      dto.extras ?? this.toNumber(lancamento.extras);
    const adiantamento = dto.adiantamento ?? this.toNumber(lancamento.adiantamento);

    const calculo = this.calculoService.calcularValores({
      tipoContrato: lancamento.tipoContrato,
      salarioBaseReferencia: salarioBase,
      valorDiariaAplicada: valorDiaria,
      diasTrabalhados,
      horasExtras,
      valorHoraExtra,
      ajudaCusto,
      extras,
      adiantamento,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.funcionarioPagamento.update({
        where: { id: lancamentoId },
        data: {
          diasTrabalhados: dto.diasTrabalhados ?? undefined,
          faltas:
            dto.faltas !== undefined ? new Prisma.Decimal(dto.faltas) : undefined,
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
          extras:
            dto.extras !== undefined
              ? new Prisma.Decimal(dto.extras)
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

    // Preparar dados PIX baseado no meio de pagamento
    let chavePixEnviada: string | null = null;
    let responsavelChavePixEnviado: string | null = null;
    let pixTerceiro: boolean = false;

    // Se o meio de pagamento for PIX (manual), buscar dados do funcionário
    if (payload.meioPagamento === MeioPagamentoFuncionario.PIX) {
      // Buscar dados do funcionário
      const funcionario = await this.prisma.funcionario.findUnique({
        where: { id: lancamento.funcionarioId },
        select: {
          chavePix: true,
          responsavelChavePix: true,
          pixTerceiro: true,
        },
      });
      
      if (funcionario) {
        chavePixEnviada = funcionario.chavePix || null;
        responsavelChavePixEnviado = funcionario.responsavelChavePix || null;
        pixTerceiro = funcionario.pixTerceiro ?? false;
      }
    }
    // Se for ESPECIE, limpar os campos (null para strings, false para boolean) pois o pagamento não foi via PIX
    // Se for PIX_API, não deveria acontecer neste método, mas manter valores padrão por segurança

    await this.prisma.$transaction(async (tx) => {
      // Construir objeto data base
      const dataUpdate: any = {
        meioPagamento: payload.meioPagamento ?? undefined,
        statusPagamento: payload.statusPagamento ?? undefined,
        pagamentoEfetuado: payload.pagamentoEfetuado ?? undefined,
        dataPagamento: payload.dataPagamento ?? undefined,
        pagamentoApiItemId: payload.pagamentoApiItemId ?? undefined,
      };

      // Sempre atualizar os campos PIX (preencher se PIX, limpar se ESPECIE)
      dataUpdate.chavePixEnviada = chavePixEnviada;
      dataUpdate.responsavelChavePixEnviado = responsavelChavePixEnviado;
      dataUpdate.pixTerceiro = pixTerceiro; // Boolean não nullable, usar false quando ESPECIE

      await tx.funcionarioPagamento.update({
        where: { id: lancamentoId },
        data: dataUpdate,
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
        responsavelChavePix: string | null;
      };
    }>,
    folha: {
      id: number;
      competenciaMes: number;
      competenciaAno: number;
      periodo: number | null;
      observacoes: string | null;
      dataPagamento: Date | null;
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
    // Usar dataPagamento da folha se disponível, senão usar data atual
    const dataPagamento = folha.dataPagamento ? new Date(folha.dataPagamento) : new Date();
    const dataPagamentoFormatada = formatarDataParaAPIBB(dataPagamento.toISOString());
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
        // Campo customizado para salvar no item (não enviado ao BB)
        _responsavelChavePix: func.responsavelChavePix || null,
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
            // Buscar lançamento completo para ter acesso a pixTerceiro e pagamentoEfetuado
            const lancamentoCompleto = await tx.funcionarioPagamento.findUnique({
              where: { id: lancamento.id },
              select: {
                pixTerceiro: true,
                pagamentoEfetuado: true,
              },
            });

            // ✅ IMPORTANTE: Determinar status baseado no estado do item
            // - Item REJEITADO: funcionário REJEITADO
            // - Item BLOQUEADO (lote rejeitado): funcionário REPROCESSAR
            // - Item ACEITO/ENVIADO: funcionário ENVIADO
            const itemRejeitado = item.status === StatusPagamentoItem.REJEITADO;
            const itemBloqueado = item.status === StatusPagamentoItem.BLOQUEADO;
            
            let statusFuncionario: StatusFuncionarioPagamento;
            if (itemRejeitado) {
              statusFuncionario = StatusFuncionarioPagamento.REJEITADO;
            } else if (itemBloqueado) {
              // Item bloqueado porque o lote foi rejeitado - precisa ser reprocessado
              statusFuncionario = StatusFuncionarioPagamento.REPROCESSAR;
            } else {
              statusFuncionario = StatusFuncionarioPagamento.ENVIADO;
            }
            
            // Atualizar os 3 campos PIX (registro histórico) apenas se não estiver pago
            // Funcionários já pagos (pagamentoEfetuado === true) são excluídos do envio ao BB e não devem ter campos atualizados
            const dadosPix = lancamentoCompleto?.pagamentoEfetuado === false ? {
              pixTerceiro: lancamentoCompleto.pixTerceiro, // Atualizar também, mantendo valor existente
              // Sempre preencher quando disponível no item (registro histórico)
              chavePixEnviada: item.chavePixEnviada || null,
              responsavelChavePixEnviado: item.responsavelChavePixEnviado || null,
            } : {};
            
            await tx.funcionarioPagamento.update({
              where: { id: lancamento.id },
              data: {
                pagamentoApiItemId: item.id,
                statusPagamento: statusFuncionario,
                // ✅ Se rejeitado ou bloqueado, marcar pagamentoEfetuado como false
                pagamentoEfetuado: (itemRejeitado || itemBloqueado) ? false : undefined,
                ...dadosPix, // Incluir campos PIX apenas se não estiver pago
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
      // Buscar folha para verificar meio de pagamento
      const folha = await tx.folhaPagamento.findUnique({
        where: { id: folhaId },
        select: { meioPagamento: true, status: true },
      });

      if (!folha) {
        throw new NotFoundException('Folha não encontrada.');
      }

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
          // PIX_API: Manter status atual (ENVIADO ou REJEITADO)
          // Não alterar, já foi atualizado durante criação dos lotes
          continue;
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

      // ✅ Fechar folha apenas se NÃO for PIX_API
      // Para PIX_API, deixar em EM_PROCESSAMENTO para fechamento automático
      if (folha.meioPagamento !== MeioPagamentoFuncionario.PIX_API) {
        await tx.folhaPagamento.update({
          where: { id: folhaId },
          data: {
            status: StatusFolhaPagamento.FECHADA,
            dataFechamento: new Date(),
            dataLiberacao: new Date(),
            usuarioLiberacaoId: usuarioId,
          },
        });
      } else {
        // ✅ Para PIX_API, apenas registrar data de liberação
        // O status já está EM_PROCESSAMENTO (definido em criarLotesParaLancamentos)
        await tx.folhaPagamento.update({
          where: { id: folhaId },
          data: {
            dataLiberacao: new Date(),
            usuarioLiberacaoId: usuarioId,
          },
        });
      }
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
    // Usar dataPagamento do DTO (fornecido pelo usuário) se disponível, senão usar data atual
    const dataPagamento = dto.dataPagamento ? new Date(dto.dataPagamento) : new Date();
    const dataPagamentoFormatada = formatarDataParaAPIBB(dataPagamento.toISOString());
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
    
    // Usar ajudaCusto do funcionário se existir, caso contrário usar 0
    const ajudaCustoFuncionario = funcionario.ajudaCusto 
      ? Number(funcionario.ajudaCusto) 
      : 0;
    
    // Usar pixTerceiro do funcionário, padrão false se não existir
    const pixTerceiroFuncionario = funcionario.pixTerceiro ?? false;
    
    // Sempre preencher quando disponível (registro histórico)
    const chavePixEnviada = funcionario.chavePix || null;
    const responsavelChavePixEnviado = funcionario.responsavelChavePix || null;

    const calculo = this.calculoService.calcularValores({
      tipoContrato: funcionario.tipoContrato,
      salarioBaseReferencia: salarioBase,
      valorDiariaAplicada: valorDiaria,
      diasTrabalhados: 0,
      horasExtras: 0,
      valorHoraExtra: 0,
      ajudaCusto: ajudaCustoFuncionario,
      extras: 0,
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
      faltas: new Prisma.Decimal(0),
      ajudaCusto: new Prisma.Decimal(ajudaCustoFuncionario),
      extras: new Prisma.Decimal(0),
      adiantamento: new Prisma.Decimal(0),
      valorBruto: new Prisma.Decimal(calculo.valorBruto),
      valorLiquido: new Prisma.Decimal(calculo.valorLiquido),
      pixTerceiro: pixTerceiroFuncionario,
      chavePixEnviada: chavePixEnviada,
      responsavelChavePixEnviado: responsavelChavePixEnviado,
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

    // Calcular total pago: usar apenas pagamentoEfetuado (que deve estar sempre atualizado quando status é PAGO)
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
   * Recalcula os totais da folha de pagamento (método público para uso externo)
   * Usado após atualizações de pagamento via jobs/webhook
   * Verifica se todos os pagamentos estão PAGO e fecha a folha automaticamente se for PIX-API
   * @param folhaId ID da folha de pagamento
   */
  async recalcularFolhaNoBanco(folhaId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.recalcularFolha(tx, folhaId);

      // Verificar se a folha deve ser fechada automaticamente (PIX-API com todos os pagamentos concluídos)
      const folha = await tx.folhaPagamento.findUnique({
        where: { id: folhaId },
        select: {
          status: true,
          meioPagamento: true,
        },
      });

      if (
        folha &&
        folha.status === StatusFolhaPagamento.EM_PROCESSAMENTO &&
        folha.meioPagamento === MeioPagamentoFuncionario.PIX_API
      ) {
        // Verificar se todos os lançamentos estão pagos (pagamentoEfetuado: true)
        const totalLancamentos = await tx.funcionarioPagamento.count({
          where: { folhaId },
        });

        const lancamentosPagos = await tx.funcionarioPagamento.count({
          where: {
            folhaId,
            pagamentoEfetuado: true,
          },
        });

        // Verificar se há algum lançamento rejeitado
        const lancamentosRejeitados = await tx.funcionarioPagamento.count({
          where: {
            folhaId,
            statusPagamento: StatusFuncionarioPagamento.REJEITADO,
          },
        });

        // Fechar folha automaticamente apenas se:
        // 1. Todos os lançamentos estão pagos
        // 2. Não há lançamentos rejeitados (todos foram processados com sucesso)
        if (
          totalLancamentos > 0 &&
          lancamentosPagos === totalLancamentos &&
          lancamentosRejeitados === 0
        ) {
          await tx.folhaPagamento.update({
            where: { id: folhaId },
            data: {
              status: StatusFolhaPagamento.FECHADA,
              dataFechamento: new Date(),
            },
          });

          console.log(
            `✅ [FOLHA-PAGAMENTO] Folha ${folhaId} fechada automaticamente: todos os ${totalLancamentos} pagamento(s) PIX-API foram concluídos com sucesso`,
          );
        }
      }
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
        // Excluir funcionários já pagos da atualização (preservar dados históricos do pagamento)
        if (lancamento.pagamentoEfetuado === true) {
          continue;
        }

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
          extras: this.toNumber(lancamento.extras),
          adiantamento: this.toNumber(lancamento.adiantamento),
        });

        // Obter pixTerceiro atual do funcionário
        const pixTerceiroAtual = funcionario.pixTerceiro ?? false;
        
        // Sempre preencher quando disponível (registro histórico)
        const chavePixEnviada = funcionario.chavePix || null;
        const responsavelChavePixEnviado = funcionario.responsavelChavePix || null;

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
            // Atualizar pixTerceiro com o valor atual do funcionário
            pixTerceiro: pixTerceiroAtual,
            // Atualizar campos PIX (registro histórico)
            chavePixEnviada: chavePixEnviada,
            responsavelChavePixEnviado: responsavelChavePixEnviado,
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
   * Reprocessa pagamentos rejeitados de uma folha
   * Limpa os vínculos antigos e cria novos lotes ou marca como pago conforme o meio de pagamento
   */
  async reprocessarPagamentosRejeitados(
    folhaId: number,
    dto: ReprocessarPagamentosRejeitadosDto,
    usuarioId: number,
  ) {
    console.log('🔄 [REPROCESSAR-REJEITADOS] Iniciando reprocessamento:', {
      folhaId,
      dto,
      usuarioId,
    });

    const folha = await this.ensureFolha(folhaId);

    console.log('📋 [REPROCESSAR-REJEITADOS] Folha encontrada:', {
      id: folha.id,
      meioPagamento: folha.meioPagamento,
      status: folha.status,
    });

    // Verificar se a folha usa PIX_API
    if (folha.meioPagamento !== MeioPagamentoFuncionario.PIX_API) {
      console.warn('⚠️ [REPROCESSAR-REJEITADOS] Folha não usa PIX_API:', folha.meioPagamento);
      throw new BadRequestException(
        'Este endpoint é apenas para folhas que usam PIX-API.',
      );
    }

    // Buscar funcionários rejeitados ou que precisam ser reprocessados (bloqueados em lote rejeitado)
    console.log('🔍 [REPROCESSAR-REJEITADOS] Buscando funcionários rejeitados ou bloqueados...');
    const funcionariosRejeitados = await this.prisma.funcionarioPagamento.findMany({
      where: {
        folhaId,
        statusPagamento: {
          in: [
            StatusFuncionarioPagamento.REJEITADO, // Item realmente rejeitado pelo BB
            StatusFuncionarioPagamento.REPROCESSAR, // Item bloqueado em lote rejeitado
          ],
        },
        pagamentoApiItemId: { not: null },
        pagamentoEfetuado: false,
        pagamentoApiItem: {
          lote: {
            status: StatusPagamentoLote.REJEITADO,
          },
        },
      },
      include: {
        funcionario: {
          include: {
            cargo: true,
            funcao: true,
          },
        },
        pagamentoApiItem: {
          include: {
            lote: true,
          },
        },
      },
    });

    console.log(`📊 [REPROCESSAR-REJEITADOS] Funcionários rejeitados encontrados: ${funcionariosRejeitados.length}`);

    if (funcionariosRejeitados.length === 0) {
      console.warn('⚠️ [REPROCESSAR-REJEITADOS] Nenhum funcionário rejeitado encontrado');
      throw new BadRequestException(
        'Não há funcionários rejeitados para reprocessar nesta folha.',
      );
    }

    // Validar conta corrente se for PIX_API
    if (dto.meioPagamento === MeioPagamentoFuncionario.PIX_API) {
      if (!dto.contaCorrenteId) {
        console.warn('⚠️ [REPROCESSAR-REJEITADOS] Conta corrente não fornecida');
        throw new BadRequestException(
          'Conta corrente é obrigatória para pagamento via PIX-API.',
        );
      }
    }

    console.log('🔄 [REPROCESSAR-REJEITADOS] Limpando vínculos antigos e atualizando status...');
    // Limpar vínculos antigos e atualizar status
    await this.prisma.$transaction(async (tx) => {
      for (const funcionario of funcionariosRejeitados) {
        await tx.funcionarioPagamento.update({
          where: { id: funcionario.id },
          data: {
            pagamentoApiItemId: null,
            statusPagamento: StatusFuncionarioPagamento.PENDENTE,
            meioPagamento: dto.meioPagamento,
          },
        });
      }
    });
    console.log('✅ [REPROCESSAR-REJEITADOS] Vínculos limpos e status atualizados');

    // Processar conforme o meio de pagamento
    if (dto.meioPagamento === MeioPagamentoFuncionario.PIX_API) {
      console.log('💳 [REPROCESSAR-REJEITADOS] Processando via PIX_API...');
      // Buscar conta corrente
      const contaCorrente = await this.prisma.contaCorrente.findUnique({
        where: { id: dto.contaCorrenteId },
      });

      if (!contaCorrente) {
        console.error('❌ [REPROCESSAR-REJEITADOS] Conta corrente não encontrada:', dto.contaCorrenteId);
        throw new NotFoundException('Conta corrente não encontrada.');
      }

      console.log('🏦 [REPROCESSAR-REJEITADOS] Conta corrente encontrada:', {
        id: contaCorrente.id,
        agencia: contaCorrente.agencia,
        contaCorrente: contaCorrente.contaCorrente,
      });

      // Preparar lançamentos para criar novo lote
      const lancamentosParaReprocessar = funcionariosRejeitados.map((f) => ({
        id: f.id,
        valorLiquido: f.valorLiquido,
        funcionario: {
          id: f.funcionario.id,
          nome: f.funcionario.nome,
          cpf: f.funcionario.cpf,
          chavePix: f.funcionario.chavePix,
          tipoChavePix: f.funcionario.tipoChavePix,
          responsavelChavePix: f.funcionario.responsavelChavePix,
        },
      }));

      console.log(`📦 [REPROCESSAR-REJEITADOS] Criando lote para ${lancamentosParaReprocessar.length} lançamento(s)...`);

      try {
        // Criar novo lote apenas para os rejeitados
        // Usar dataPagamento do DTO se disponível, senão usar da folha, senão usar data atual
        const folhaComDataPagamento = {
          ...folha,
          dataPagamento: dto.dataPagamento ? new Date(dto.dataPagamento) : (folha.dataPagamento || null),
        };
        
        await this.criarLotesParaLancamentos(
          lancamentosParaReprocessar,
          folhaComDataPagamento,
          {
            id: contaCorrente.id,
            agencia: contaCorrente.agencia,
            contaCorrente: contaCorrente.contaCorrente,
            contaCorrenteDigito: contaCorrente.contaCorrenteDigito,
          },
          usuarioId,
        );

        console.log('✅ [REPROCESSAR-REJEITADOS] Lote criado com sucesso');
      } catch (error) {
        console.error('❌ [REPROCESSAR-REJEITADOS] Erro ao criar lote:', {
          error: error.message,
          stack: error.stack,
          lancamentos: lancamentosParaReprocessar.length,
        });
        throw error;
      }
    } else {
      // PIX Manual ou ESPÉCIE: Marcar como PAGO
      await this.prisma.$transaction(async (tx) => {
        for (const funcionario of funcionariosRejeitados) {
          await tx.funcionarioPagamento.update({
            where: { id: funcionario.id },
            data: {
              statusPagamento: StatusFuncionarioPagamento.PAGO,
              pagamentoEfetuado: true,
              dataPagamento: new Date(dto.dataPagamento),
              meioPagamento: dto.meioPagamento,
            },
          });
        }

        // Recalcular totais da folha
        await this.recalcularFolha(tx, folhaId);
      });
    }

    console.log('✅ [REPROCESSAR-REJEITADOS] Reprocessamento concluído com sucesso');
    return {
      mensagem: `${funcionariosRejeitados.length} pagamento(s) rejeitado(s) reprocessado(s) com sucesso.`,
      quantidadeReprocessados: funcionariosRejeitados.length,
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

