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

      // Valida se a cultura existe
      const cultura = await this.prisma.cultura.findUnique({
        where: { id: createFrutaDto.culturaId },
      });

      if (!cultura) {
        throw new NotFoundException(`Cultura com ID ${createFrutaDto.culturaId} não encontrada`);
      }

      const fruta = await this.prisma.fruta.create({
        data: {
          nome: createFrutaDto.nome,
          codigo: createFrutaDto.codigo,
          culturaId: createFrutaDto.culturaId,
          descricao: createFrutaDto.descricao,
          status: createFrutaDto.status,
          nomeCientifico: createFrutaDto.nomeCientifico,
          corPredominante: createFrutaDto.corPredominante,
          epocaColheita: createFrutaDto.epocaColheita,
          observacoes: createFrutaDto.observacoes,
        },
        include: {
          cultura: true, // Incluir cultura na resposta
        },
      });

      return this.mapToResponseDto(fruta);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Erro ao criar fruta');
    }
  }

  /**
   * Busca todas as frutas com paginação e filtros
   */
  async findAll(
    page?: number,
    limit?: number,
    search?: string,
    culturaId?: number,
    status?: string,
  ): Promise<{ data: FrutaResponseDto[]; total: number; page: number; limit: number }> {
    // Quando page e limit não forem informados, retornar TODOS os registros
    const shouldPaginate = Boolean(page && limit);
    const numericPage = shouldPaginate ? Number(page) : undefined;
    const numericLimit = shouldPaginate ? Number(limit) : undefined;
    const skip = shouldPaginate ? ((numericPage as number) - 1) * (numericLimit as number) : undefined;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (culturaId) {
      where.culturaId = culturaId;
    }

    if (status) {
      where.status = status;
    }

    const [frutas, total] = await Promise.all([
      this.prisma.fruta.findMany({
        where,
        // Aplicar paginação apenas quando requisitada
        skip,
        take: numericLimit,
        orderBy: { nome: 'asc' },
        include: {
          cultura: true, // Incluir cultura na resposta
        },
      }),
      this.prisma.fruta.count({ where }),
    ]);

    return {
      data: frutas.map(fruta => this.mapToResponseDto(fruta)),
      total,
      page: shouldPaginate ? (numericPage as number) : 1,
      limit: shouldPaginate ? (numericLimit as number) : frutas.length,
    };
  }

  /**
   * Busca uma fruta por ID
   */
  async findOne(id: number): Promise<FrutaResponseDto> {
    const fruta = await this.prisma.fruta.findUnique({
      where: { id },
      include: {
        cultura: true, // Incluir cultura na resposta
      },
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

    // Valida se a cultura existe (se fornecida)
    if (updateFrutaDto.culturaId) {
      const cultura = await this.prisma.cultura.findUnique({
        where: { id: updateFrutaDto.culturaId },
      });

      if (!cultura) {
        throw new NotFoundException(`Cultura com ID ${updateFrutaDto.culturaId} não encontrada`);
      }
    }

    const fruta = await this.prisma.fruta.update({
      where: { id },
      data: {
        nome: updateFrutaDto.nome,
        codigo: updateFrutaDto.codigo,
        culturaId: updateFrutaDto.culturaId,
        descricao: updateFrutaDto.descricao,
        status: updateFrutaDto.status,
        nomeCientifico: updateFrutaDto.nomeCientifico,
        corPredominante: updateFrutaDto.corPredominante,
        epocaColheita: updateFrutaDto.epocaColheita,
        observacoes: updateFrutaDto.observacoes,
      },
      include: {
        cultura: true, // Incluir cultura na resposta
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
      include: {
        cultura: true, // Incluir cultura na resposta
      },
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
      culturaId: fruta.culturaId,
      cultura: fruta.cultura ? {
        id: fruta.cultura.id,
        descricao: fruta.cultura.descricao,
      } : undefined,
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