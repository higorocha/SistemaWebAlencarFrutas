import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatusFuncionario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdiantamentoDto } from './dto/create-adiantamento.dto';
import { ListAdiantamentosQueryDto } from './dto/list-adiantamentos-query.dto';
import { AdiantamentoResponseDto } from './dto/adiantamento-response.dto';

@Injectable()
export class AdiantamentosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista adiantamentos de um funcionário
   * @param funcionarioId ID do funcionário
   * @param query Filtros de consulta (apenasAtivos)
   * @returns Lista de adiantamentos
   */
  async listarAdiantamentos(
    funcionarioId: number,
    query: ListAdiantamentosQueryDto,
  ): Promise<AdiantamentoResponseDto[]> {
    // Verificar se funcionário existe
    const funcionario = await this.prisma.funcionario.findUnique({
      where: { id: funcionarioId },
    });

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado.');
    }

    const where: Prisma.AdiantamentoFuncionarioWhereInput = {
      funcionarioId,
    };

    // Se apenasAtivos for true, filtrar apenas adiantamentos com saldo devedor > 0
    if (query.apenasAtivos === true) {
      where.saldoDevedor = {
        gt: new Prisma.Decimal(0),
      };
      where.quantidadeParcelasRemanescentes = {
        gt: 0,
      };
    }

    const adiantamentos = await this.prisma.adiantamentoFuncionario.findMany({
      where,
      orderBy: { createdAt: 'asc' }, // Mais antigo primeiro
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        usuarioCriacao: {
          select: {
            id: true,
            nome: true,
          },
        },
        lancamentosAdiantamento: {
          include: {
            folha: {
              select: {
                id: true,
                competenciaMes: true,
                competenciaAno: true,
                periodo: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return adiantamentos.map((adiantamento) => ({
      id: adiantamento.id,
      funcionarioId: adiantamento.funcionarioId,
      valorTotal: Number(adiantamento.valorTotal),
      quantidadeParcelas: adiantamento.quantidadeParcelas,
      saldoDevedor: Number(adiantamento.saldoDevedor),
      quantidadeParcelasRemanescentes: adiantamento.quantidadeParcelasRemanescentes,
      observacoes: adiantamento.observacoes ?? undefined,
      usuarioCriacaoId: adiantamento.usuarioCriacaoId,
      createdAt: adiantamento.createdAt,
      updatedAt: adiantamento.updatedAt,
      funcionario: adiantamento.funcionario,
      usuarioCriacao: adiantamento.usuarioCriacao,
      lancamentosAdiantamento: adiantamento.lancamentosAdiantamento.map(
        (lancamento) => {
          // Formatar competência: "MM/AAAA - 1Q" ou "MM/AAAA - 2Q"
          const competenciaFolha = lancamento.folha
            ? `${String(lancamento.folha.competenciaMes).padStart(2, '0')}/${lancamento.folha.competenciaAno} - ${lancamento.folha.periodo === 1 ? '1Q' : '2Q'}`
            : undefined;

          return {
            id: lancamento.id,
            folhaId: lancamento.folhaId,
            funcionarioPagamentoId: lancamento.funcionarioPagamentoId,
            valorDeduzido: Number(lancamento.valorDeduzido),
            parcelaNumero: lancamento.parcelaNumero,
            createdAt: lancamento.createdAt,
            competenciaFolha,
            folha: lancamento.folha,
          };
        },
      ),
    }));
  }

  /**
   * Lista apenas adiantamentos ativos de um funcionário
   * Usado internamente na criação de folha
   * @param funcionarioId ID do funcionário
   * @returns Lista de adiantamentos ativos
   */
  async listarAdiantamentosAtivos(funcionarioId: number) {
    return this.listarAdiantamentos(funcionarioId, { apenasAtivos: true });
  }

  /**
   * Cria um novo adiantamento para um funcionário
   * @param funcionarioId ID do funcionário
   * @param dto Dados do adiantamento
   * @param usuarioId ID do usuário que está criando
   * @returns Adiantamento criado
   */
  async criarAdiantamento(
    funcionarioId: number,
    dto: CreateAdiantamentoDto,
    usuarioId: number,
  ): Promise<AdiantamentoResponseDto> {
    // Verificar se funcionário existe e está ativo
    const funcionario = await this.prisma.funcionario.findUnique({
      where: { id: funcionarioId },
    });

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado.');
    }

    if (funcionario.status !== StatusFuncionario.ATIVO) {
      throw new BadRequestException(
        'Não é possível criar adiantamento para funcionário inativo.',
      );
    }

    // Validações
    if (dto.valorTotal <= 0) {
      throw new BadRequestException('O valor total deve ser maior que zero.');
    }

    if (dto.quantidadeParcelas <= 0) {
      throw new BadRequestException(
        'A quantidade de parcelas deve ser maior que zero.',
      );
    }

    // Criar adiantamento
    const adiantamento = await this.prisma.adiantamentoFuncionario.create({
      data: {
        funcionarioId,
        valorTotal: new Prisma.Decimal(dto.valorTotal),
        quantidadeParcelas: dto.quantidadeParcelas,
        saldoDevedor: new Prisma.Decimal(dto.valorTotal), // Inicializa com valor total
        quantidadeParcelasRemanescentes: dto.quantidadeParcelas, // Inicializa com quantidade total
        observacoes: dto.observacoes?.trim() || null,
        usuarioCriacaoId: usuarioId,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        usuarioCriacao: {
          select: {
            id: true,
            nome: true,
          },
        },
        lancamentosAdiantamento: true,
      },
    });

    return {
      id: adiantamento.id,
      funcionarioId: adiantamento.funcionarioId,
      valorTotal: Number(adiantamento.valorTotal),
      quantidadeParcelas: adiantamento.quantidadeParcelas,
      saldoDevedor: Number(adiantamento.saldoDevedor),
      quantidadeParcelasRemanescentes: adiantamento.quantidadeParcelasRemanescentes,
      observacoes: adiantamento.observacoes ?? undefined,
      usuarioCriacaoId: adiantamento.usuarioCriacaoId,
      createdAt: adiantamento.createdAt,
      updatedAt: adiantamento.updatedAt,
      funcionario: adiantamento.funcionario,
      usuarioCriacao: adiantamento.usuarioCriacao,
      lancamentosAdiantamento: [],
    };
  }

  /**
   * Atualiza um adiantamento existente
   * @param funcionarioId ID do funcionário
   * @param id ID do adiantamento
   * @param dto Dados para atualização
   * @returns Adiantamento atualizado
   */
  async atualizarAdiantamento(
    funcionarioId: number,
    id: number,
    dto: CreateAdiantamentoDto,
  ): Promise<AdiantamentoResponseDto> {
    // Verificar se adiantamento existe e pertence ao funcionário
    const adiantamentoExistente = await this.prisma.adiantamentoFuncionario.findFirst({
      where: {
        id,
        funcionarioId,
      },
      include: {
        lancamentosAdiantamento: true,
      },
    });

    if (!adiantamentoExistente) {
      throw new NotFoundException('Adiantamento não encontrado.');
    }

    // Validações
    if (dto.valorTotal <= 0) {
      throw new BadRequestException('O valor total deve ser maior que zero.');
    }

    if (dto.quantidadeParcelas <= 0) {
      throw new BadRequestException(
        'A quantidade de parcelas deve ser maior que zero.',
      );
    }

    // Calcular quantas parcelas já foram deduzidas
    const parcelasProcessadas = adiantamentoExistente.lancamentosAdiantamento.length;
    const valorTotalDeduzido = adiantamentoExistente.lancamentosAdiantamento.reduce(
      (total, lancamento) => total + Number(lancamento.valorDeduzido),
      0,
    );

    // Recalcular saldo devedor e parcelas remanescentes
    const novoSaldoDevedor = dto.valorTotal - valorTotalDeduzido;
    const novasParcelasRemanescentes = dto.quantidadeParcelas - parcelasProcessadas;

    // Validar se o novo saldo não é negativo
    if (novoSaldoDevedor < 0) {
      throw new BadRequestException(
        `O valor total não pode ser menor que o valor já deduzido (R$ ${valorTotalDeduzido.toFixed(2)}).`,
      );
    }

    // Validar se a nova quantidade de parcelas não é menor que as já processadas
    if (dto.quantidadeParcelas < parcelasProcessadas) {
      throw new BadRequestException(
        `A quantidade de parcelas não pode ser menor que as já processadas (${parcelasProcessadas}).`,
      );
    }

    // Atualizar adiantamento
    const adiantamentoAtualizado = await this.prisma.adiantamentoFuncionario.update({
      where: { id },
      data: {
        valorTotal: new Prisma.Decimal(dto.valorTotal),
        quantidadeParcelas: dto.quantidadeParcelas,
        saldoDevedor: new Prisma.Decimal(novoSaldoDevedor),
        quantidadeParcelasRemanescentes: novasParcelasRemanescentes,
        observacoes: dto.observacoes?.trim() || null,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        usuarioCriacao: {
          select: {
            id: true,
            nome: true,
          },
        },
        lancamentosAdiantamento: {
          include: {
            folha: {
              select: {
                id: true,
                competenciaMes: true,
                competenciaAno: true,
                periodo: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      id: adiantamentoAtualizado.id,
      funcionarioId: adiantamentoAtualizado.funcionarioId,
      valorTotal: Number(adiantamentoAtualizado.valorTotal),
      quantidadeParcelas: adiantamentoAtualizado.quantidadeParcelas,
      saldoDevedor: Number(adiantamentoAtualizado.saldoDevedor),
      quantidadeParcelasRemanescentes: adiantamentoAtualizado.quantidadeParcelasRemanescentes,
      observacoes: adiantamentoAtualizado.observacoes ?? undefined,
      usuarioCriacaoId: adiantamentoAtualizado.usuarioCriacaoId,
      createdAt: adiantamentoAtualizado.createdAt,
      updatedAt: adiantamentoAtualizado.updatedAt,
      funcionario: adiantamentoAtualizado.funcionario,
      usuarioCriacao: adiantamentoAtualizado.usuarioCriacao,
      lancamentosAdiantamento: adiantamentoAtualizado.lancamentosAdiantamento.map(
        (lancamento) => {
          // Formatar competência: "MM/AAAA - 1Q" ou "MM/AAAA - 2Q"
          const competenciaFolha = lancamento.folha
            ? `${String(lancamento.folha.competenciaMes).padStart(2, '0')}/${lancamento.folha.competenciaAno} - ${lancamento.folha.periodo === 1 ? '1Q' : '2Q'}`
            : undefined;

          return {
            id: lancamento.id,
            folhaId: lancamento.folhaId,
            funcionarioPagamentoId: lancamento.funcionarioPagamentoId,
            valorDeduzido: Number(lancamento.valorDeduzido),
            parcelaNumero: lancamento.parcelaNumero,
            createdAt: lancamento.createdAt,
            competenciaFolha,
            folha: lancamento.folha,
          };
        },
      ),
    };
  }

  /**
   * Exclui um adiantamento
   * Só permite exclusão se nenhuma parcela foi paga
   * @param funcionarioId ID do funcionário
   * @param id ID do adiantamento
   */
  async excluirAdiantamento(funcionarioId: number, id: number): Promise<{ message: string }> {
    // Verificar se adiantamento existe e pertence ao funcionário
    const adiantamento = await this.prisma.adiantamentoFuncionario.findFirst({
      where: {
        id,
        funcionarioId,
      },
      include: {
        lancamentosAdiantamento: true,
      },
    });

    if (!adiantamento) {
      throw new NotFoundException('Adiantamento não encontrado.');
    }

    // Validar se nenhuma parcela foi paga
    if (adiantamento.lancamentosAdiantamento.length > 0) {
      throw new BadRequestException(
        'Não é possível excluir adiantamento com parcelas já deduzidas. Use a edição para ajustar valores.',
      );
    }

    // Excluir adiantamento
    await this.prisma.adiantamentoFuncionario.delete({
      where: { id },
    });

    return {
      message: 'Adiantamento excluído com sucesso.',
    };
  }
}
