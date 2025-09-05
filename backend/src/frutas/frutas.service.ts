import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFrutaDto, UpdateFrutaDto, FrutaResponseDto } from './dto';

@Injectable()
export class FrutasService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma nova fruta
   */
  async create(createFrutaDto: CreateFrutaDto): Promise<FrutaResponseDto> {
    try {
      // Verifica se já existe uma fruta com o mesmo código (se fornecido)
      if (createFrutaDto.codigo) {
        const existingFruta = await this.prisma.fruta.findUnique({
          where: { codigo: createFrutaDto.codigo },
        });

        if (existingFruta) {
          throw new ConflictException('Já existe uma fruta com este código');
        }
      }

      const fruta = await this.prisma.fruta.create({
        data: {
          nome: createFrutaDto.nome,
          codigo: createFrutaDto.codigo,
          categoria: createFrutaDto.categoria,
          descricao: createFrutaDto.descricao,
          status: createFrutaDto.status,
          nomeCientifico: createFrutaDto.nomeCientifico,
          corPredominante: createFrutaDto.corPredominante,
          epocaColheita: createFrutaDto.epocaColheita,
          observacoes: createFrutaDto.observacoes,
        },
      });

      return this.mapToResponseDto(fruta);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('Erro ao criar fruta');
    }
  }

  /**
   * Busca todas as frutas com paginação e filtros
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoria?: string,
    status?: string,
  ): Promise<{ data: FrutaResponseDto[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (status) {
      where.status = status;
    }

    const [frutas, total] = await Promise.all([
      this.prisma.fruta.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
      }),
      this.prisma.fruta.count({ where }),
    ]);

    return {
      data: frutas.map(fruta => this.mapToResponseDto(fruta)),
      total,
      page,
      limit,
    };
  }

  /**
   * Busca uma fruta por ID
   */
  async findOne(id: number): Promise<FrutaResponseDto> {
    const fruta = await this.prisma.fruta.findUnique({
      where: { id },
    });

    if (!fruta) {
      throw new NotFoundException('Fruta não encontrada');
    }

    return this.mapToResponseDto(fruta);
  }

  /**
   * Atualiza uma fruta
   */
  async update(id: number, updateFrutaDto: UpdateFrutaDto): Promise<FrutaResponseDto> {
    // Verifica se a fruta existe
    const existingFruta = await this.prisma.fruta.findUnique({
      where: { id },
    });

    if (!existingFruta) {
      throw new NotFoundException('Fruta não encontrada');
    }

    // Verifica se o código já existe em outra fruta (se fornecido)
    if (updateFrutaDto.codigo && updateFrutaDto.codigo !== existingFruta.codigo) {
      const frutaWithCode = await this.prisma.fruta.findUnique({
        where: { codigo: updateFrutaDto.codigo },
      });

      if (frutaWithCode) {
        throw new ConflictException('Já existe uma fruta com este código');
      }
    }

    const fruta = await this.prisma.fruta.update({
      where: { id },
      data: {
        nome: updateFrutaDto.nome,
        codigo: updateFrutaDto.codigo,
        categoria: updateFrutaDto.categoria,
        descricao: updateFrutaDto.descricao,
        status: updateFrutaDto.status,
        nomeCientifico: updateFrutaDto.nomeCientifico,
        corPredominante: updateFrutaDto.corPredominante,
        epocaColheita: updateFrutaDto.epocaColheita,
        observacoes: updateFrutaDto.observacoes,
      },
    });

    return this.mapToResponseDto(fruta);
  }

  /**
   * Remove uma fruta
   */
  async remove(id: number): Promise<void> {
    const fruta = await this.prisma.fruta.findUnique({
      where: { id },
    });

    if (!fruta) {
      throw new NotFoundException('Fruta não encontrada');
    }

    await this.prisma.fruta.delete({
      where: { id },
    });
  }

  /**
   * Busca frutas ativas para seleção
   */
  async findActive(): Promise<FrutaResponseDto[]> {
    const frutas = await this.prisma.fruta.findMany({
      where: { status: 'ATIVA' },
      orderBy: { nome: 'asc' },
    });

    return frutas.map(fruta => this.mapToResponseDto(fruta));
  }

  /**
   * Mapeia o modelo do Prisma para o DTO de resposta
   */
  private mapToResponseDto(fruta: any): FrutaResponseDto {
    return {
      id: fruta.id,
      nome: fruta.nome,
      codigo: fruta.codigo,
      categoria: fruta.categoria,
      descricao: fruta.descricao,
      status: fruta.status,
      nomeCientifico: fruta.nomeCientifico,
      corPredominante: fruta.corPredominante,
      epocaColheita: fruta.epocaColheita,
      observacoes: fruta.observacoes,
      createdAt: fruta.createdAt,
      updatedAt: fruta.updatedAt,
    };
  }
} 