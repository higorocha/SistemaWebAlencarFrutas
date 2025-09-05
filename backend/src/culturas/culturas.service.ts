import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCulturaDto, UpdateCulturaDto, CulturaResponseDto } from './dto';

@Injectable()
export class CulturasService {
  constructor(private prisma: PrismaService) {}

  async create(createCulturaDto: CreateCulturaDto): Promise<CulturaResponseDto> {
    try {
      const cultura = await this.prisma.cultura.create({
        data: createCulturaDto,
      });

      return this.mapToResponseDto(cultura);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Cultura com esta descrição já existe');
      }
      throw error;
    }
  }

  async findAll(): Promise<CulturaResponseDto[]> {
    const culturas = await this.prisma.cultura.findMany({
      orderBy: {
        descricao: 'asc',
      },
    });

    return culturas.map(this.mapToResponseDto);
  }

  async findOne(id: number): Promise<CulturaResponseDto> {
    const cultura = await this.prisma.cultura.findUnique({
      where: { id },
    });

    if (!cultura) {
      throw new NotFoundException('Cultura não encontrada');
    }

    return this.mapToResponseDto(cultura);
  }

  async update(id: number, updateCulturaDto: UpdateCulturaDto): Promise<CulturaResponseDto> {
    // Verificar se a cultura existe
    const existingCultura = await this.prisma.cultura.findUnique({
      where: { id },
    });

    if (!existingCultura) {
      throw new NotFoundException('Cultura não encontrada');
    }

    try {
      const cultura = await this.prisma.cultura.update({
        where: { id },
        data: updateCulturaDto,
      });

      return this.mapToResponseDto(cultura);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Cultura com esta descrição já existe');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    // Verificar se a cultura existe
    const cultura = await this.prisma.cultura.findUnique({
      where: { id },
      include: {
        lotesCulturas: true,
      },
    });

    if (!cultura) {
      throw new NotFoundException('Cultura não encontrada');
    }

    // Verificar se a cultura está sendo usada em algum lote
    if (cultura.lotesCulturas.length > 0) {
      throw new ConflictException('Não é possível excluir uma cultura que está sendo usada em lotes agrícolas');
    }

    await this.prisma.cultura.delete({
      where: { id },
    });
  }

  private mapToResponseDto(cultura: any): CulturaResponseDto {
    return {
      id: cultura.id,
      descricao: cultura.descricao,
      periodicidade: cultura.periodicidade,
      permitirConsorcio: cultura.permitirConsorcio,
      createdAt: cultura.createdAt,
      updatedAt: cultura.updatedAt,
    };
  }
} 