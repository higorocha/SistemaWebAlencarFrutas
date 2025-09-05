import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto, ClienteResponseDto } from './dto';

@Injectable()
export class ClientesService {
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

  async create(createClienteDto: CreateClienteDto): Promise<ClienteResponseDto> {
    // Processar o campo documento para separar em cpf ou cnpj
    let dataToCreate: any = { ...createClienteDto };
    
    // Sempre deletar o campo documento antes de enviar para o Prisma
    delete dataToCreate.documento;
    
    // Se documento foi fornecido, determinar se é CPF ou CNPJ
    if (createClienteDto.documento && createClienteDto.documento.trim()) {
      const documentoLimpo = createClienteDto.documento.replace(/\D/g, '');
      
      if (documentoLimpo.length === 11) {
        // É um CPF
        dataToCreate.cpf = createClienteDto.documento;
        dataToCreate.cnpj = undefined;
      } else if (documentoLimpo.length === 14) {
        // É um CNPJ
        dataToCreate.cnpj = createClienteDto.documento;
        dataToCreate.cpf = undefined;
      }
    } else {
      // Se documento está vazio, limpar ambos os campos
      dataToCreate.cpf = undefined;
      dataToCreate.cnpj = undefined;
    }

    // Verificar se já existe um cliente com o mesmo CNPJ ou CPF
    if (dataToCreate.cnpj) {
      const existingCnpj = await this.prisma.cliente.findFirst({
        where: { cnpj: dataToCreate.cnpj },
      });
      if (existingCnpj) {
        throw new ConflictException('Já existe um cliente com este CNPJ');
      }
    }

    if (dataToCreate.cpf) {
      const existingCpf = await this.prisma.cliente.findFirst({
        where: { cpf: dataToCreate.cpf },
      });
      if (existingCpf) {
        throw new ConflictException('Já existe um cliente com este CPF');
      }
    }

    const cliente = await this.prisma.cliente.create({
      data: dataToCreate,
    });

    return this.convertNullToUndefined(cliente);
  }

  async findAll(
    page?: number,
    limit?: number,
    search?: string,
    status?: string,
  ): Promise<{ data: ClienteResponseDto[]; total: number; page: number; limit: number }> {
    const skip = page && limit ? (page - 1) * limit : 0;
    const take = limit || 10;

    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { razaoSocial: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search } },
        { cpf: { contains: search } },
        { cidade: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [clientes, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        skip,
        take,
        orderBy: { nome: 'asc' },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return {
      data: clientes.map(cliente => {
        const converted = this.convertNullToUndefined(cliente);
        // Adicionar campo documento para compatibilidade com o frontend
        if (!converted.documento) {
          converted.documento = converted.cpf || converted.cnpj || '';
        }
        return converted;
      }),
      total,
      page: page || 1,
      limit: take,
    };
  }

  async findActive(): Promise<ClienteResponseDto[]> {
    const clientes = await this.prisma.cliente.findMany({
      where: { status: 'ATIVO' },
      orderBy: { nome: 'asc' },
    });

    return clientes.map(cliente => {
      const converted = this.convertNullToUndefined(cliente);
      // Adicionar campo documento para compatibilidade com o frontend
      if (!converted.documento) {
        converted.documento = converted.cpf || converted.cnpj || '';
      }
      return converted;
    });
  }

  async findOne(id: number): Promise<ClienteResponseDto> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const converted = this.convertNullToUndefined(cliente);
    // Adicionar campo documento para compatibilidade com o frontend
    if (!converted.documento) {
      converted.documento = converted.cpf || converted.cnpj || '';
    }
    return converted;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto): Promise<ClienteResponseDto> {
    // Verificar se o cliente existe
    const existingCliente = await this.prisma.cliente.findUnique({
      where: { id },
    });

    if (!existingCliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Processar o campo documento para separar em cpf ou cnpj
    let dataToUpdate: any = { ...updateClienteDto };
    
    // Sempre deletar o campo documento antes de enviar para o Prisma
    delete dataToUpdate.documento;
    
    // Se documento foi fornecido, determinar se é CPF ou CNPJ
    if (updateClienteDto.documento && updateClienteDto.documento.trim()) {
      const documentoLimpo = updateClienteDto.documento.replace(/\D/g, '');
      
      if (documentoLimpo.length === 11) {
        // É um CPF
        dataToUpdate.cpf = updateClienteDto.documento;
        dataToUpdate.cnpj = undefined;
      } else if (documentoLimpo.length === 14) {
        // É um CNPJ
        dataToUpdate.cnpj = updateClienteDto.documento;
        dataToUpdate.cpf = undefined;
      }
    } else if (updateClienteDto.documento !== undefined) {
      // Se documento foi explicitamente definido como vazio, limpar ambos os campos
      dataToUpdate.cpf = undefined;
      dataToUpdate.cnpj = undefined;
    }

    // Verificar se já existe outro cliente com o mesmo CNPJ ou CPF
    if (dataToUpdate.cnpj) {
      const existingCnpj = await this.prisma.cliente.findFirst({
        where: { 
          cnpj: dataToUpdate.cnpj,
          id: { not: id },
        },
      });
      if (existingCnpj) {
        throw new ConflictException('Já existe um cliente com este CNPJ');
      }
    }

    if (dataToUpdate.cpf) {
      const existingCpf = await this.prisma.cliente.findFirst({
        where: { 
          cpf: dataToUpdate.cpf,
          id: { not: id },
        },
      });
      if (existingCpf) {
        throw new ConflictException('Já existe um cliente com este CPF');
      }
    }

    const cliente = await this.prisma.cliente.update({
      where: { id },
      data: dataToUpdate,
    });

    return this.convertNullToUndefined(cliente);
  }

  async remove(id: number): Promise<void> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    await this.prisma.cliente.delete({
      where: { id },
    });
  }
} 