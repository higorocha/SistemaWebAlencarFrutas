import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto, CulturaAreaDto } from './dto';

@Injectable()
export class AreasService {
  constructor(private prisma: PrismaService) {}

  async create(createAreaDto: CreateAreaDto): Promise<AreaResponseDto> {
    const { culturas, ...areaData } = createAreaDto;

    try {
      const area = await this.prisma.areaAgricola.create({
        data: {
          ...areaData,
          lotes: {
            create: culturas.map(cultura => ({
              culturaId: cultura.culturaId,
              areaPlantada: cultura.areaPlantada,
              areaProduzindo: cultura.areaProduzindo,
            })),
          },
        },
        include: {
          lotes: {
            include: {
              cultura: true,
            },
          },
        },
      });

      return this.mapToResponseDto(area);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Área com este nome já existe');
      }
      throw error;
    }
  }

  async findAll(): Promise<AreaResponseDto[]> {
    const areas = await this.prisma.areaAgricola.findMany({
      include: {
        lotes: {
          include: {
            cultura: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return areas.map(this.mapToResponseDto);
  }

  async findOne(id: number): Promise<AreaResponseDto> {
    const area = await this.prisma.areaAgricola.findUnique({
      where: { id },
      include: {
        lotes: {
          include: {
            cultura: true,
          },
        },
      },
    });

    if (!area) {
      throw new NotFoundException('Área agrícola não encontrada');
    }

    return this.mapToResponseDto(area);
  }

  async update(id: number, updateAreaDto: UpdateAreaDto): Promise<AreaResponseDto> {
    // Verificar se a área existe
    const existingArea = await this.prisma.areaAgricola.findUnique({
      where: { id },
    });

    if (!existingArea) {
      throw new NotFoundException('Área agrícola não encontrada');
    }

    const { culturas, ...areaData } = updateAreaDto;

    try {
      // Se há culturas para atualizar, primeiro remove todas e depois cria as novas
      if (culturas) {
        await this.prisma.lotesCulturas.deleteMany({
          where: { areaAgricolaId: id },
        });
      }

      const area = await this.prisma.areaAgricola.update({
        where: { id },
        data: {
          ...areaData,
          ...(culturas && {
            lotes: {
              create: culturas.map(cultura => ({
                culturaId: cultura.culturaId,
                areaPlantada: cultura.areaPlantada,
                areaProduzindo: cultura.areaProduzindo,
              })),
            },
          }),
        },
        include: {
          lotes: {
            include: {
              cultura: true,
            },
          },
        },
      });

      return this.mapToResponseDto(area);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Área com este nome já existe');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    // Verificar se a área existe
    const area = await this.prisma.areaAgricola.findUnique({
      where: { id },
    });

    if (!area) {
      throw new NotFoundException('Área agrícola não encontrada');
    }

    // As culturas serão removidas automaticamente devido ao onDelete: Cascade
    await this.prisma.areaAgricola.delete({
      where: { id },
    });
  }

  private mapToResponseDto(area: any): AreaResponseDto {
    return {
      id: area.id,
      nome: area.nome,
      categoria: area.categoria,
      areaTotal: area.areaTotal,
      coordenadas: area.coordenadas,
      culturas: area.lotes.map(lc => ({
        culturaId: lc.culturaId,
        areaPlantada: lc.areaPlantada,
        areaProduzindo: lc.areaProduzindo,
        descricao: lc.cultura?.descricao || `Cultura ${lc.culturaId}`,
      })),
      createdAt: area.createdAt,
      updatedAt: area.updatedAt,
    };
  }
} 