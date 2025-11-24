import {
  BadRequestException,
  ConflictException,
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
import { FolhaCalculoService } from './folha-calculo.service';
import { FuncionarioPagamentoStatusService } from './funcionario-pagamento-status.service';

@Injectable()
export class FolhaPagamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculoService: FolhaCalculoService,
    private readonly statusService: FuncionarioPagamentoStatusService,
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

    // Aplicar meio de pagamento e data para TODOS os lançamentos que não foram pagos individualmente
    await this.prisma.$transaction(async (tx) => {
      // Atualizar todos os lançamentos não pagos
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

      // Atualizar status da folha
      await tx.folhaPagamento.update({
        where: { id },
        data: {
          status: StatusFolhaPagamento.PENDENTE_LIBERACAO,
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

    return this.prisma.folhaPagamento.update({
      where: { id },
      data: {
        status: StatusFolhaPagamento.RASCUNHO,
        dataProcessamento: null,
      },
    });
  }

  async liberarFolha(id: number, usuarioId: number) {
    const folha = await this.ensureFolha(id);

    if (folha.status !== StatusFolhaPagamento.PENDENTE_LIBERACAO) {
      throw new BadRequestException(
        'Somente folhas pendentes de liberação podem ser liberadas.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Buscar todos os lançamentos não pagos
      const lancamentosPendentes = await tx.funcionarioPagamento.findMany({
        where: {
          folhaId: id,
          pagamentoEfetuado: false,
        },
      });

      // Processar cada lançamento conforme o meio de pagamento
      for (const lancamento of lancamentosPendentes) {
        if (lancamento.meioPagamento === MeioPagamentoFuncionario.PIX_API) {
          // PIX_API: Manter pendente, aguardar processamento da API (futuro)
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
      await this.recalcularFolha(tx, id);

      // Fechar a folha
      await tx.folhaPagamento.update({
        where: { id },
        data: {
          status: StatusFolhaPagamento.FECHADA,
          dataFechamento: new Date(),
          dataLiberacao: new Date(),
          usuarioLiberacaoId: usuarioId,
        },
      });
    });

    return this.detalhesFolha(id);
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
      include: withLancamentos
        ? {
            pagamentos: {
              include: { funcionario: { select: { nome: true, cpf: true } } },
            },
          }
        : undefined,
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

  private toNumber(value?: Prisma.Decimal | number | null): number {
    if (value === null || value === undefined) {
      return 0;
    }
    return typeof value === 'number' ? value : Number(value);
  }
}

