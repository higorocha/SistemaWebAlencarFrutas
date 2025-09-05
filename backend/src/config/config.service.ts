import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateConfigDadosEmpresaDto, 
  UpdateConfigDadosEmpresaDto, 
  ConfigDadosEmpresaResponseDto 
} from './dto/config-dados-empresa.dto';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca os dados da empresa
   * Como só deve existir um registro, retorna o primeiro encontrado
   */
  async findDadosEmpresa(): Promise<ConfigDadosEmpresaResponseDto | null> {
    console.log('🔍 [CONFIG] Buscando dados da empresa...');
    
    const dadosEmpresa = await this.prisma.configDadosEmpresa.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!dadosEmpresa) {
      console.log('❌ [CONFIG] Nenhum dado de empresa encontrado');
      return null;
    }

    console.log('✅ [CONFIG] Dados da empresa encontrados:', dadosEmpresa.nome_fantasia);
    return dadosEmpresa;
  }

  /**
   * Cria ou atualiza os dados da empresa
   * Se já existir um registro, atualiza; senão, cria um novo
   */
  async saveDadosEmpresa(
    createConfigDadosEmpresaDto: CreateConfigDadosEmpresaDto
  ): Promise<ConfigDadosEmpresaResponseDto> {
    console.log('💾 [CONFIG] Salvando dados da empresa...', createConfigDadosEmpresaDto.nome_fantasia);
    
    try {
      // Verifica se já existe um registro
      const existingData = await this.prisma.configDadosEmpresa.findFirst();
      
      if (existingData) {
        // Atualiza o registro existente
        console.log('🔄 [CONFIG] Atualizando dados existentes da empresa');
        const updatedData = await this.prisma.configDadosEmpresa.update({
          where: { id: existingData.id },
          data: createConfigDadosEmpresaDto,
        });
        
        console.log('✅ [CONFIG] Dados da empresa atualizados com sucesso');
        return updatedData;
      } else {
        // Cria um novo registro
        console.log('🆕 [CONFIG] Criando novos dados da empresa');
        const newData = await this.prisma.configDadosEmpresa.create({
          data: createConfigDadosEmpresaDto,
        });
        
        console.log('✅ [CONFIG] Dados da empresa criados com sucesso');
        return newData;
      }
    } catch (error) {
      console.error('❌ [CONFIG] Erro ao salvar dados da empresa:', error);
      
      if (error.code === 'P2002') {
        throw new ConflictException('CNPJ já cadastrado no sistema');
      }
      
      throw error;
    }
  }

  /**
   * Atualiza os dados da empresa
   */
  async updateDadosEmpresa(
    id: number,
    updateConfigDadosEmpresaDto: UpdateConfigDadosEmpresaDto
  ): Promise<ConfigDadosEmpresaResponseDto> {
    console.log('🔄 [CONFIG] Atualizando dados da empresa ID:', id);
    
    try {
      const updatedData = await this.prisma.configDadosEmpresa.update({
        where: { id },
        data: updateConfigDadosEmpresaDto,
      });
      
      console.log('✅ [CONFIG] Dados da empresa atualizados com sucesso');
      return updatedData;
    } catch (error) {
      console.error('❌ [CONFIG] Erro ao atualizar dados da empresa:', error);
      
      if (error.code === 'P2025') {
        throw new NotFoundException('Dados da empresa não encontrados');
      }
      
      if (error.code === 'P2002') {
        throw new ConflictException('CNPJ já cadastrado no sistema');
      }
      
      throw error;
    }
  }

  /**
   * Deleta os dados da empresa
   */
  async deleteDadosEmpresa(id: number): Promise<{ message: string }> {
    console.log('🗑️ [CONFIG] Deletando dados da empresa ID:', id);
    
    try {
      await this.prisma.configDadosEmpresa.delete({
        where: { id },
      });
      
      console.log('✅ [CONFIG] Dados da empresa deletados com sucesso');
      return { message: 'Dados da empresa deletados com sucesso' };
    } catch (error) {
      console.error('❌ [CONFIG] Erro ao deletar dados da empresa:', error);
      
      if (error.code === 'P2025') {
        throw new NotFoundException('Dados da empresa não encontrados');
      }
      
      throw error;
    }
  }

  /**
   * Busca todos os registros de dados da empresa (para administração)
   */
  async findAllDadosEmpresa(): Promise<ConfigDadosEmpresaResponseDto[]> {
    console.log('🔍 [CONFIG] Buscando todos os dados da empresa...');
    
    const allData = await this.prisma.configDadosEmpresa.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`✅ [CONFIG] Encontrados ${allData.length} registros de dados da empresa`);
    return allData;
  }

  /**
   * Busca dados da empresa por ID
   */
  async findDadosEmpresaById(id: number): Promise<ConfigDadosEmpresaResponseDto> {
    console.log('🔍 [CONFIG] Buscando dados da empresa ID:', id);
    
    const dadosEmpresa = await this.prisma.configDadosEmpresa.findUnique({
      where: { id },
    });

    if (!dadosEmpresa) {
      console.log('❌ [CONFIG] Dados da empresa não encontrados');
      throw new NotFoundException('Dados da empresa não encontrados');
    }

    console.log('✅ [CONFIG] Dados da empresa encontrados:', dadosEmpresa.nome_fantasia);
    return dadosEmpresa;
  }
} 