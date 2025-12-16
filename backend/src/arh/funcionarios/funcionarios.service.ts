import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Funcionario,
  Prisma,
  StatusFuncionario,
  TipoContratoFuncionario,
  Cargo,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { ListFuncionarioQueryDto } from './dto/list-funcionario-query.dto';
import { UpdateFuncionarioStatusDto } from './dto/update-funcionario-status.dto';

type FuncionarioInput = Partial<CreateFuncionarioDto> & Partial<UpdateFuncionarioDto>;

@Injectable()
export class FuncionariosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListFuncionarioQueryDto) {
    // Quando page e limit não forem informados, retornar TODOS os registros
    const shouldPaginate = Boolean(query.page && query.limit);
    const skip = shouldPaginate ? (Number(query.page) - 1) * Number(query.limit) : undefined;
    const take = shouldPaginate ? Number(query.limit) : undefined;

    const where: Prisma.FuncionarioWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.tipoContrato) {
      where.tipoContrato = query.tipoContrato;
    }

    if (query.cargoId) {
      where.cargoId = query.cargoId;
    }

    if (query.funcaoId) {
      where.funcaoId = query.funcaoId;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { nome: { contains: term, mode: 'insensitive' } },
        { cpf: { contains: term.replace(/\D/g, ''), mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.funcionario.findMany({
        where,
        // Aplicar paginação apenas quando requisitada
        skip,
        take,
        orderBy: { nome: 'asc' },
        include: {
          cargo: true,
          funcao: true,
          gerente: {
            select: {
              id: true,
              nome: true,
              cpf: true,
            },
          },
        },
      }),
      this.prisma.funcionario.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: shouldPaginate ? Number(query.page) : 1,
        limit: shouldPaginate ? Number(query.limit) : data.length,
        totalPages: shouldPaginate ? Math.ceil(total / Number(query.limit)) || 1 : 1,
      },
    };
  }

  async listResumo() {
    return this.prisma.funcionario.findMany({
      where: { status: StatusFuncionario.ATIVO },
      select: {
        id: true,
        nome: true,
        cpf: true,
        tipoContrato: true,
        cargoId: true,
        funcaoId: true,
        gerenteId: true,
        cargo: {
          select: {
            id: true,
            nome: true,
          },
        },
        funcao: {
          select: {
            id: true,
            nome: true,
          },
        },
        gerente: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async listGerentes() {
    return this.prisma.funcionario.findMany({
      where: {
        status: StatusFuncionario.ATIVO,
        tipoContrato: TipoContratoFuncionario.MENSALISTA,
        cargo: {
          isGerencial: true,
          ativo: true,
        },
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
        cargo: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: number) {
    const funcionario = await this.prisma.funcionario.findUnique({
      where: { id },
      include: {
        cargo: true,
        funcao: true,
        gerente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
      },
    });
    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado.');
    }
    return funcionario;
  }

  async create(dto: CreateFuncionarioDto) {
    const payload = await this.prepareData(dto, { mode: 'create' });
    try {
      return await this.prisma.funcionario.create({ data: payload });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateFuncionarioDto) {
    const current = await this.findOne(id);
    const payload = await this.prepareData(dto, { mode: 'update', current });
    try {
      return await this.prisma.funcionario.update({
        where: { id },
        data: payload,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateStatus(id: number, dto: UpdateFuncionarioStatusDto) {
    await this.findOne(id);
    return this.prisma.funcionario.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  private async prepareData(
    dto: FuncionarioInput,
    options: { mode: 'create' | 'update'; current?: Funcionario },
  ) {
    const tipoContrato = dto.tipoContrato ?? options.current?.tipoContrato;
    if (!tipoContrato) {
      throw new BadRequestException('Tipo de contrato é obrigatório.');
    }

    const cpfLimpo =
      dto.cpf !== undefined
        ? dto.cpf.replace(/\D/g, '')
        : options.current?.cpf ?? undefined;

    const cargoIdTarget = dto.cargoId ?? options.current?.cargoId ?? undefined;
    const funcaoIdTarget = dto.funcaoId ?? options.current?.funcaoId ?? undefined;

    if (tipoContrato === TipoContratoFuncionario.MENSALISTA && !cargoIdTarget) {
      throw new BadRequestException(
        'Cargos são obrigatórios para funcionários mensalistas.',
      );
    }

    if (tipoContrato === TipoContratoFuncionario.DIARISTA && !funcaoIdTarget) {
      throw new BadRequestException(
        'Funções diaristas são obrigatórias para funcionários diaristas.',
      );
    }

    // Validar e buscar cargo se necessário
    let cargoAtual: Cargo | null = null;
    if (
      dto.cargoId !== undefined &&
      tipoContrato !== TipoContratoFuncionario.DIARISTA
    ) {
      cargoAtual = await this.ensureCargo(dto.cargoId);
    } else if (
      options.current?.cargoId &&
      tipoContrato !== TipoContratoFuncionario.DIARISTA
    ) {
      cargoAtual = await this.ensureCargo(options.current.cargoId);
    }

    if (
      dto.funcaoId !== undefined &&
      tipoContrato !== TipoContratoFuncionario.MENSALISTA
    ) {
      await this.ensureFuncao(dto.funcaoId);
    }

    // Validar gerenteId
    const gerenteIdTarget = dto.gerenteId ?? options.current?.gerenteId ?? undefined;
    
    // Se o funcionário tem cargo gerencial, não pode ter gerente
    if (cargoAtual?.isGerencial === true && (dto.gerenteId !== undefined && dto.gerenteId !== null)) {
      throw new BadRequestException(
        'Funcionários com cargo gerencial não podem ter um gerente vinculado.',
      );
    }

    // Se está definindo um gerente, validar
    if (dto.gerenteId !== undefined && dto.gerenteId !== null) {
      // Não pode ser gerente de si mesmo
      const funcionarioId = options.mode === 'update' ? options.current?.id : undefined;
      if (funcionarioId && funcionarioId === dto.gerenteId) {
        throw new BadRequestException(
          'Um funcionário não pode ser gerente de si mesmo.',
        );
      }

      // Validar que o gerente existe e é válido
      await this.ensureGerente(dto.gerenteId);
    }

    const data =
      {} as Prisma.FuncionarioUncheckedCreateInput &
        Prisma.FuncionarioUncheckedUpdateInput;

    if (dto.nome !== undefined) {
      data.nome = dto.nome.trim();
    } else if (options.mode === 'create') {
      throw new BadRequestException('Nome do funcionário é obrigatório.');
    }

    if (cpfLimpo !== undefined) {
      data.cpf = cpfLimpo;
    } else if (options.mode === 'create') {
      throw new BadRequestException('CPF do funcionário é obrigatório.');
    }
    if (dto.rg !== undefined) data.rg = dto.rg?.trim() || null;
    if (dto.pis !== undefined) data.pis = dto.pis?.trim() || null;
    if (dto.ctps !== undefined) data.ctps = dto.ctps?.trim() || null;
    if (dto.dataNascimento !== undefined) {
      data.dataNascimento = dto.dataNascimento ? new Date(dto.dataNascimento) : null;
    }
    if (dto.telefone !== undefined) data.telefone = dto.telefone?.trim() || null;
    if (dto.celular !== undefined) data.celular = dto.celular?.trim() || null;
    if (dto.email !== undefined) data.email = dto.email?.trim() || null;
    if (dto.estadoCivil !== undefined) {
      data.estadoCivil = dto.estadoCivil?.trim() || null;
    }

    if (dto.cep !== undefined) {
      data.cep = dto.cep?.trim() || null;
    }

    if (dto.logradouro !== undefined) {
      data.logradouro = dto.logradouro?.trim() || null;
    }

    if (dto.numero !== undefined) {
      data.numero = dto.numero?.trim() || null;
    }

    if (dto.complemento !== undefined) {
      data.complemento = dto.complemento?.trim() || null;
    }

    if (dto.bairro !== undefined) {
      data.bairro = dto.bairro?.trim() || null;
    }

    if (dto.cidade !== undefined) {
      data.cidade = dto.cidade?.trim() || null;
    }

    if (dto.estado !== undefined) {
      data.estado = dto.estado?.trim() || null;
    }

    if (dto.tipoContrato !== undefined) {
      data.tipoContrato = dto.tipoContrato;
    } else if (options.mode === 'create') {
      data.tipoContrato = tipoContrato;
    }

    if (dto.cargoId !== undefined) {
      data.cargoId = dto.cargoId;
    } else if (options.mode === 'create') {
      data.cargoId = cargoIdTarget ?? null;
    }

    if (dto.funcaoId !== undefined) {
      data.funcaoId = dto.funcaoId;
    } else if (options.mode === 'create') {
      data.funcaoId = funcaoIdTarget ?? null;
    }

    if (dto.salarioCustomizado !== undefined) {
      data.salarioCustomizado = new Prisma.Decimal(dto.salarioCustomizado);
    }

    if (dto.valorDiariaCustomizada !== undefined) {
      data.valorDiariaCustomizada = new Prisma.Decimal(dto.valorDiariaCustomizada);
    }

    if (dto.apelido !== undefined) {
      data.apelido = dto.apelido;
    }

    if (dto.tipoChavePix !== undefined) {
      data.tipoChavePix = dto.tipoChavePix;
    }

    if (dto.modalidadeChave !== undefined) {
      data.modalidadeChave = dto.modalidadeChave;
    }

    if (dto.chavePix !== undefined) {
      data.chavePix = dto.chavePix;
    }

    if (dto.responsavelChavePix !== undefined) {
      data.responsavelChavePix = dto.responsavelChavePix;
    }

    if (dto.ajudaCusto !== undefined) {
      data.ajudaCusto = new Prisma.Decimal(dto.ajudaCusto);
    }

    if (dto.pixTerceiro !== undefined) {
      data.pixTerceiro = dto.pixTerceiro;
    }

    if (dto.endereco !== undefined) {
      data.endereco = dto.endereco
        ? (dto.endereco as Prisma.InputJsonValue)
        : Prisma.DbNull;
    }

    if (dto.dadosBancarios !== undefined) {
      data.dadosBancarios = dto.dadosBancarios
        ? (dto.dadosBancarios as Prisma.InputJsonValue)
        : Prisma.DbNull;
    }

    if (dto.dependentes !== undefined) {
      data.dependentes = dto.dependentes
        ? (dto.dependentes as Prisma.InputJsonValue)
        : Prisma.DbNull;
    }

    if (dto.observacoes !== undefined) {
      data.observacoes = dto.observacoes?.trim() || null;
    }

    if (dto.dataAdmissao !== undefined) {
      data.dataAdmissao = dto.dataAdmissao ? new Date(dto.dataAdmissao) : null;
    }

    if (dto.dataDemissao !== undefined) {
      data.dataDemissao = dto.dataDemissao ? new Date(dto.dataDemissao) : null;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    } else if (options.mode === 'create') {
      data.status = dto.status ?? StatusFuncionario.ATIVO;
    }

    // Atribuir gerenteId - se o cargo for gerencial, forçar null
    if (cargoAtual?.isGerencial === true) {
      data.gerenteId = null;
    } else if (dto.gerenteId !== undefined) {
      data.gerenteId = dto.gerenteId ?? null;
    } else if (options.mode === 'create') {
      data.gerenteId = gerenteIdTarget ?? null;
    }

    return data;
  }

  private async ensureCargo(id: number) {
    const cargo = await this.prisma.cargo.findFirst({
      where: { id, ativo: true },
    });
    if (!cargo) {
      throw new NotFoundException('Cargo não encontrado ou inativo.');
    }
    return cargo;
  }

  private async ensureFuncao(id: number) {
    const funcao = await this.prisma.funcaoDiarista.findFirst({
      where: { id, ativo: true },
    });
    if (!funcao) {
      throw new NotFoundException('Função não encontrada ou inativa.');
    }
    return funcao;
  }

  private async ensureGerente(id: number) {
    const gerente = await this.prisma.funcionario.findUnique({
      where: { id },
      include: {
        cargo: true,
      },
    });

    if (!gerente) {
      throw new NotFoundException('Gerente não encontrado.');
    }

    if (gerente.status !== StatusFuncionario.ATIVO) {
      throw new BadRequestException('O gerente deve estar ativo.');
    }

    if (gerente.tipoContrato !== TipoContratoFuncionario.MENSALISTA) {
      throw new BadRequestException(
        'Apenas funcionários mensalistas podem ser gerentes.',
      );
    }

    if (!gerente.cargo) {
      throw new BadRequestException(
        'O gerente deve ter um cargo vinculado.',
      );
    }

    if (!gerente.cargo.isGerencial) {
      throw new BadRequestException(
        'O cargo do gerente deve ser marcado como gerencial.',
      );
    }

    return gerente;
  }

  private handlePrismaError(error: any): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Já existe um funcionário com este CPF.');
    }

    throw new InternalServerErrorException(
      'Não foi possível processar a operação para o funcionário.',
    );
  }
}

