import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';
import { ListCargoQueryDto } from './dto/list-cargo-query.dto';
import { UpdateCargoStatusDto } from './dto/update-cargo-status.dto';

@Injectable()
export class CargosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListCargoQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CargoWhereInput = {};

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
      this.prisma.cargo.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nome: 'asc' },
      }),
      this.prisma.cargo.count({ where }),
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
    return this.prisma.cargo.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async create(dto: CreateCargoDto) {
    try {
      return await this.prisma.cargo.create({
        data: this.buildCreateData(dto),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateCargoDto) {
    await this.ensureExists(id);
    try {
      return await this.prisma.cargo.update({
        where: { id },
        data: this.buildUpdateData(dto),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateStatus(id: number, dto: UpdateCargoStatusDto) {
    await this.ensureExists(id);
    return this.prisma.cargo.update({
      where: { id },
      data: { ativo: dto.ativo },
    });
  }

  private buildCreateData(dto: CreateCargoDto): Prisma.CargoUncheckedCreateInput {
    if (dto.salarioMensal === undefined) {
      throw new BadRequestException('Salário mensal é obrigatório.');
    }

    return {
      nome: dto.nome.trim(),
      descricao: dto.descricao?.trim() || null,
      salarioMensal: new Prisma.Decimal(dto.salarioMensal),
      cargaHorariaMensal: dto.cargaHorariaMensal ?? null,
      adicionalPericulosidade:
        dto.adicionalPericulosidade !== undefined
          ? new Prisma.Decimal(dto.adicionalPericulosidade)
          : null,
      ativo: dto.ativo ?? true,
    };
  }

  private buildUpdateData(
    dto: UpdateCargoDto,
  ): Prisma.CargoUncheckedUpdateInput {
    const data: Prisma.CargoUncheckedUpdateInput = {};

    if (dto.nome !== undefined) {
      data.nome = dto.nome.trim();
    }
    if (dto.descricao !== undefined) {
      data.descricao = dto.descricao?.trim() || null;
    }
    if (dto.salarioMensal !== undefined) {
      data.salarioMensal = new Prisma.Decimal(dto.salarioMensal);
    }
    if (dto.cargaHorariaMensal !== undefined) {
      data.cargaHorariaMensal = dto.cargaHorariaMensal;
    }
    if (dto.adicionalPericulosidade !== undefined) {
      data.adicionalPericulosidade = new Prisma.Decimal(
        dto.adicionalPericulosidade,
      );
    }
    if (dto.ativo !== undefined) {
      data.ativo = dto.ativo;
    }

    return data;
  }

  private async ensureExists(id: number) {
    const cargo = await this.prisma.cargo.findUnique({ where: { id } });
    if (!cargo) {
      throw new NotFoundException('Cargo não encontrado.');
    }
    return cargo;
  }

  private handlePrismaError(error: any): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Já existe um cargo com este nome.');
    }

    throw new InternalServerErrorException(
      'Não foi possível processar a operação para o cargo.',
    );
  }
}

