import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFuncaoDiaristaDto } from './dto/create-funcao-diarista.dto';
import { UpdateFuncaoDiaristaDto } from './dto/update-funcao-diarista.dto';
import { ListFuncaoQueryDto } from './dto/list-funcao-query.dto';
import { UpdateFuncaoStatusDto } from './dto/update-funcao-status.dto';

@Injectable()
export class FuncoesDiaristasService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListFuncaoQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.FuncaoDiaristaWhereInput = {};

    if (typeof query.ativo === 'boolean') {
      where.ativo = query.ativo;
    }

    if (query.search) {
      where.nome = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.funcaoDiarista.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nome: 'asc' },
      }),
      this.prisma.funcaoDiarista.count({ where }),
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

  async listActive() {
    return this.prisma.funcaoDiarista.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async create(dto: CreateFuncaoDiaristaDto) {
    try {
      return await this.prisma.funcaoDiarista.create({
        data: this.buildCreateData(dto),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateFuncaoDiaristaDto) {
    await this.ensureExists(id);
    try {
      return await this.prisma.funcaoDiarista.update({
        where: { id },
        data: this.buildUpdateData(dto),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateStatus(id: number, dto: UpdateFuncaoStatusDto) {
    await this.ensureExists(id);
    return this.prisma.funcaoDiarista.update({
      where: { id },
      data: { ativo: dto.ativo },
    });
  }

  private buildCreateData(
    dto: CreateFuncaoDiaristaDto,
  ): Prisma.FuncaoDiaristaUncheckedCreateInput {
    if (dto.valorDiariaBase === undefined) {
      throw new BadRequestException('Valor da diária é obrigatório.');
    }

    return {
      nome: dto.nome.trim(),
      descricao: dto.descricao?.trim() || null,
      valorDiariaBase: new Prisma.Decimal(dto.valorDiariaBase),
      duracaoPadraoHoras: dto.duracaoPadraoHoras ?? null,
      exigeEpi: dto.exigeEpi ?? false,
      ativo: dto.ativo ?? true,
    };
  }

  private buildUpdateData(
    dto: UpdateFuncaoDiaristaDto,
  ): Prisma.FuncaoDiaristaUncheckedUpdateInput {
    const data: Prisma.FuncaoDiaristaUncheckedUpdateInput = {};

    if (dto.nome !== undefined) {
      data.nome = dto.nome.trim();
    }
    if (dto.descricao !== undefined) {
      data.descricao = dto.descricao?.trim() || null;
    }
    if (dto.valorDiariaBase !== undefined) {
      data.valorDiariaBase = new Prisma.Decimal(dto.valorDiariaBase);
    }
    if (dto.duracaoPadraoHoras !== undefined) {
      data.duracaoPadraoHoras = dto.duracaoPadraoHoras;
    }
    if (dto.exigeEpi !== undefined) {
      data.exigeEpi = dto.exigeEpi;
    }
    if (dto.ativo !== undefined) {
      data.ativo = dto.ativo;
    }

    return data;
  }

  private async ensureExists(id: number) {
    const funcao = await this.prisma.funcaoDiarista.findUnique({ where: { id } });
    if (!funcao) {
      throw new NotFoundException('Função não encontrada.');
    }
    return funcao;
  }

  private handlePrismaError(error: any): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Já existe uma função com este nome.');
    }

    throw new InternalServerErrorException(
      'Não foi possível processar a operação para a função diarista.',
    );
  }
}

