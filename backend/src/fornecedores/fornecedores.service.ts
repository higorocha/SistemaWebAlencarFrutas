import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFornecedorDto, UpdateFornecedorDto, FornecedorResponseDto } from './dto';

@Injectable()
export class FornecedoresService {
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

  async create(createFornecedorDto: CreateFornecedorDto): Promise<FornecedorResponseDto> {
    // Processar campo documento se fornecido
    let dataToCreate = { ...createFornecedorDto };
    
    // Sempre remover o campo documento, pois ele não existe no banco
    delete dataToCreate.documento;
    
    if (createFornecedorDto.documento && createFornecedorDto.documento.trim()) {
      const documento = createFornecedorDto.documento.replace(/\D/g, ''); // Remove caracteres não numéricos
      
      if (documento.length === 11) {
        // É um CPF
        dataToCreate.cpf = createFornecedorDto.documento;
        dataToCreate.cnpj = undefined;
      } else if (documento.length === 14) {
        // É um CNPJ
        dataToCreate.cnpj = createFornecedorDto.documento;
        dataToCreate.cpf = undefined;
      }
    } else {
      // Se documento está vazio, limpar ambos os campos
      dataToCreate.cpf = undefined;
      dataToCreate.cnpj = undefined;
    }

    // Verificar se já existe fornecedor com mesmo CNPJ ou CPF
    if (dataToCreate.cnpj) {
      const existingCnpj = await this.prisma.fornecedor.findUnique({
        where: { cnpj: dataToCreate.cnpj },
      });
      if (existingCnpj) {
        throw new ConflictException('Já existe fornecedor com este CNPJ');
      }
    }

    if (dataToCreate.cpf) {
      const existingCpf = await this.prisma.fornecedor.findUnique({
        where: { cpf: dataToCreate.cpf },
      });
      if (existingCpf) {
        throw new ConflictException('Já existe fornecedor com este CPF');
      }
    }

    const fornecedor = await this.prisma.fornecedor.create({
      data: dataToCreate,
      include: {
        areas: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return this.convertNullToUndefined(fornecedor);
  }

  async findAll(search?: string): Promise<FornecedorResponseDto[]> {
    const where = search ? {
      OR: [
        { nome: { contains: search, mode: 'insensitive' as any } },
        { cnpj: { contains: search, mode: 'insensitive' as any } },
        { cpf: { contains: search, mode: 'insensitive' as any } },
        { documento: { contains: search, mode: 'insensitive' as any } },
      ],
    } : {};

    const fornecedores = await this.prisma.fornecedor.findMany({
      where,
      include: {
        areas: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    // Adicionar campo documento para compatibilidade com o frontend
    return fornecedores.map(fornecedor => {
      const converted = this.convertNullToUndefined(fornecedor);
      // Se não tem documento, usar cpf ou cnpj como fallback
      if (!converted.documento) {
        converted.documento = converted.cpf || converted.cnpj || undefined;
      }
      return converted;
    });
  }

  async findOne(id: number): Promise<FornecedorResponseDto> {
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id },
      include: {
        areas: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    const converted = this.convertNullToUndefined(fornecedor);
    // Se não tem documento, usar cpf ou cnpj como fallback
    if (!converted.documento) {
      converted.documento = converted.cpf || converted.cnpj || undefined;
    }
    
    return converted;
  }

  async update(id: number, updateFornecedorDto: UpdateFornecedorDto): Promise<FornecedorResponseDto> {
    // Verificar se o fornecedor existe
    const existingFornecedor = await this.prisma.fornecedor.findUnique({
      where: { id },
    });

    if (!existingFornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    // Processar campo documento se fornecido
    let dataToUpdate: any = { ...updateFornecedorDto };
    
    // Sempre remover o campo documento, pois ele não existe no banco
    delete dataToUpdate.documento;
    
    if (updateFornecedorDto.documento && updateFornecedorDto.documento.trim()) {
      const documento = updateFornecedorDto.documento.replace(/\D/g, ''); // Remove caracteres não numéricos
      
      if (documento.length === 11) {
        // É um CPF
        dataToUpdate.cpf = updateFornecedorDto.documento;
        dataToUpdate.cnpj = undefined;
      } else if (documento.length === 14) {
        // É um CNPJ
        dataToUpdate.cnpj = updateFornecedorDto.documento;
        dataToUpdate.cpf = undefined;
      }
    } else {
      // Se documento está vazio, limpar ambos os campos
      dataToUpdate.cpf = undefined;
      dataToUpdate.cnpj = undefined;
    }

    // Verificar se já existe fornecedor com mesmo CNPJ ou CPF (exceto o atual)
    if (dataToUpdate.cnpj) {
      const existingCnpj = await this.prisma.fornecedor.findFirst({
        where: { 
          cnpj: dataToUpdate.cnpj,
          id: { not: id }
        },
      });
      if (existingCnpj) {
        throw new ConflictException('Já existe fornecedor com este CNPJ');
      }
    }

    if (dataToUpdate.cpf) {
      const existingCpf = await this.prisma.fornecedor.findFirst({
        where: { 
          cpf: dataToUpdate.cpf,
          id: { not: id }
        },
      });
      if (existingCpf) {
        throw new ConflictException('Já existe fornecedor com este CPF');
      }
    }

    const fornecedor = await this.prisma.fornecedor.update({
      where: { id },
      data: dataToUpdate,
      include: {
        areas: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return this.convertNullToUndefined(fornecedor);
  }

  async remove(id: number): Promise<void> {
    // Verificar se o fornecedor existe
    const existingFornecedor = await this.prisma.fornecedor.findUnique({
      where: { id },
    });

    if (!existingFornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    // Verificar se o fornecedor tem áreas associadas
    const areasCount = await this.prisma.areaFornecedor.count({
      where: { fornecedorId: id },
    });

    if (areasCount > 0) {
      throw new ConflictException('Não é possível remover fornecedor com áreas associadas');
    }

    await this.prisma.fornecedor.delete({
      where: { id },
    });
  }
}

