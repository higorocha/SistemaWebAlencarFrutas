import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, StatusFuncionario, TipoContratoFuncionario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';
import { ListCargoQueryDto } from './dto/list-cargo-query.dto';
import { UpdateCargoStatusDto } from './dto/update-cargo-status.dto';
import { capitalizeName } from '../../utils/formatters';

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
    const cargoAtual = await this.ensureExists(id);
    
    // Validar se está tentando desmarcar cargo gerencial que tem gerentes com subordinados
    if (dto.isGerencial === false && cargoAtual.isGerencial === true) {
      await this.validarDesmarcarGerencial(id);
    }
    
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
      isGerencial: dto.isGerencial ?? false,
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
    if (dto.isGerencial !== undefined) {
      data.isGerencial = dto.isGerencial;
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

  private async validarDesmarcarGerencial(cargoId: number) {
    // Buscar funcionários mensalistas ativos com esse cargo
    const funcionariosMensalistas = await this.prisma.funcionario.findMany({
      where: {
        cargoId,
        status: StatusFuncionario.ATIVO,
        tipoContrato: TipoContratoFuncionario.MENSALISTA,
      },
      select: {
        id: true,
        nome: true,
      },
    });

    if (funcionariosMensalistas.length === 0) {
      // Se não há funcionários mensalistas, pode desmarcar
      return;
    }

    // Verificar se algum desses funcionários tem subordinados (diaristas vinculados)
    const funcionariosComSubordinados: Array<{
      nome: string;
      quantidadeSubordinados: number;
    }> = [];
    
    for (const funcionario of funcionariosMensalistas) {
      const subordinados = await this.prisma.funcionario.count({
        where: {
          gerenteId: funcionario.id,
          status: StatusFuncionario.ATIVO,
        },
      });

      if (subordinados > 0) {
        funcionariosComSubordinados.push({
          nome: funcionario.nome,
          quantidadeSubordinados: subordinados,
        });
      }
    }

    if (funcionariosComSubordinados.length > 0) {
      const nomesGerentes = funcionariosComSubordinados
        .map((f) => `${capitalizeName(f.nome)} (${f.quantidadeSubordinados} subordinado${f.quantidadeSubordinados > 1 ? 's' : ''})`)
        .join(', ');

      throw new BadRequestException(
        `Não é possível desmarcar este cargo como gerencial. Os seguintes funcionários com este cargo possuem funcionários diaristas vinculados: ${nomesGerentes}. ` +
        `Primeiro, remova os vínculos de gerência ou altere o gerente dos funcionários diaristas.`,
      );
    }
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

