import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaFornecedorDto, UpdateAreaFornecedorDto, AreaFornecedorResponseDto } from './dto';

@Injectable()
export class AreasFornecedoresService {
  constructor(private prisma: PrismaService) {}

  // Função auxiliar para converter null para undefined
  private convertNullToUndefined(obj: any): any {
    if (obj === null) return undefined;
    if (typeof obj === 'object') {
      const converted = { ...obj };
      for (const key in converted) {
        if (converted[key] === null) {
          converted[key] = undefined;
        }
      }
      return converted;
    }
    return obj;
  }

  async create(createAreaFornecedorDto: CreateAreaFornecedorDto): Promise<AreaFornecedorResponseDto> {
    // Verificar se o fornecedor existe
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id: createAreaFornecedorDto.fornecedorId },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    // Verificar se já existe área com mesmo nome para este fornecedor
    const existingArea = await this.prisma.areaFornecedor.findFirst({
      where: {
        fornecedorId: createAreaFornecedorDto.fornecedorId,
        nome: createAreaFornecedorDto.nome,
      },
    });

    if (existingArea) {
      throw new ConflictException('Já existe área com este nome para este fornecedor');
    }

    const area = await this.prisma.areaFornecedor.create({
      data: createAreaFornecedorDto,
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return this.convertNullToUndefined(area);
  }

  async findAll(): Promise<AreaFornecedorResponseDto[]> {
    const areas = await this.prisma.areaFornecedor.findMany({
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: [
        { fornecedor: { nome: 'asc' } },
        { nome: 'asc' },
      ],
    });

    return areas.map(area => this.convertNullToUndefined(area));
  }

  async findByFornecedor(fornecedorId: number): Promise<AreaFornecedorResponseDto[]> {
    // Verificar se o fornecedor existe
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id: fornecedorId },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    const areas = await this.prisma.areaFornecedor.findMany({
      where: { fornecedorId },
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return areas.map(area => this.convertNullToUndefined(area));
  }

  async findOne(id: number): Promise<AreaFornecedorResponseDto> {
    const area = await this.prisma.areaFornecedor.findUnique({
      where: { id },
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!area) {
      throw new NotFoundException('Área não encontrada');
    }

    return this.convertNullToUndefined(area);
  }

  async update(id: number, updateAreaFornecedorDto: UpdateAreaFornecedorDto): Promise<AreaFornecedorResponseDto> {
    // Verificar se a área existe
    const existingArea = await this.prisma.areaFornecedor.findUnique({
      where: { id },
    });

    if (!existingArea) {
      throw new NotFoundException('Área não encontrada');
    }

    // Se estiver alterando o fornecedor, verificar se existe
    if (updateAreaFornecedorDto.fornecedorId) {
      const fornecedor = await this.prisma.fornecedor.findUnique({
        where: { id: updateAreaFornecedorDto.fornecedorId },
      });

      if (!fornecedor) {
        throw new NotFoundException('Fornecedor não encontrado');
      }
    }

    // Se estiver alterando o nome, verificar se já existe área com mesmo nome para o fornecedor
    if (updateAreaFornecedorDto.nome) {
      const fornecedorId = updateAreaFornecedorDto.fornecedorId || existingArea.fornecedorId;
      
      const existingAreaName = await this.prisma.areaFornecedor.findFirst({
        where: {
          fornecedorId,
          nome: updateAreaFornecedorDto.nome,
          id: { not: id },
        },
      });

      if (existingAreaName) {
        throw new ConflictException('Já existe área com este nome para este fornecedor');
      }
    }

    const area = await this.prisma.areaFornecedor.update({
      where: { id },
      data: updateAreaFornecedorDto,
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return this.convertNullToUndefined(area);
  }

  async remove(id: number): Promise<void> {
    // Verificar se a área existe
    const existingArea = await this.prisma.areaFornecedor.findUnique({
      where: { id },
    });

    if (!existingArea) {
      throw new NotFoundException('Área não encontrada');
    }

    // Verificar se a área tem frutas associadas (futuro)
    // Por enquanto, permitir remoção

    await this.prisma.areaFornecedor.delete({
      where: { id },
    });
  }
}

