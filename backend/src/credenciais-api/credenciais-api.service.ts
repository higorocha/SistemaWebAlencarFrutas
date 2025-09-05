import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateCredenciaisAPIDto, 
  UpdateCredenciaisAPIDto, 
  CredenciaisAPIResponseDto 
} from '../config/dto/credenciais-api.dto';

@Injectable()
export class CredenciaisAPIService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca todas as credenciais API com informações da conta corrente
   */
  async findAll(): Promise<CredenciaisAPIResponseDto[]> {
    console.log('🔍 [CREDENCIAIS-API] Buscando todas as credenciais API...');
    
    const credenciais = await this.prisma.credenciaisAPI.findMany({
      include: {
        contaCorrente: true, // Inclui dados da conta corrente
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ [CREDENCIAIS-API] Encontradas ${credenciais.length} credenciais`);
    return credenciais;
  }

  /**
   * Busca credenciais API específicas por ID
   */
  async findOne(id: number): Promise<CredenciaisAPIResponseDto> {
    console.log('🔍 [CREDENCIAIS-API] Buscando credenciais ID:', id);
    
    const credenciais = await this.prisma.credenciaisAPI.findUnique({
      where: { id },
      include: {
        contaCorrente: true,
      },
    });

    if (!credenciais) {
      console.log('❌ [CREDENCIAIS-API] Credenciais não encontradas');
      throw new NotFoundException('Credenciais API não encontradas');
    }

    console.log('✅ [CREDENCIAIS-API] Credenciais encontradas:', credenciais.modalidadeApi);
    return credenciais;
  }

  /**
   * Busca credenciais por conta corrente
   */
  async findByContaCorrente(contaCorrenteId: number): Promise<CredenciaisAPIResponseDto[]> {
    console.log('🔍 [CREDENCIAIS-API] Buscando credenciais da conta:', contaCorrenteId);
    
    const credenciais = await this.prisma.credenciaisAPI.findMany({
      where: { contaCorrenteId },
      include: {
        contaCorrente: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ [CREDENCIAIS-API] Encontradas ${credenciais.length} credenciais para a conta`);
    return credenciais;
  }

  /**
   * Cria novas credenciais API
   */
  async create(createCredenciaisAPIDto: CreateCredenciaisAPIDto): Promise<CredenciaisAPIResponseDto> {
    console.log('💾 [CREDENCIAIS-API] Criando novas credenciais...', {
      banco: createCredenciaisAPIDto.banco,
      contaCorrenteId: createCredenciaisAPIDto.contaCorrenteId,
      modalidadeApi: createCredenciaisAPIDto.modalidadeApi,
    });
    
    try {
      // Verifica se a conta corrente existe
      const contaCorrente = await this.prisma.contaCorrente.findUnique({
        where: { id: createCredenciaisAPIDto.contaCorrenteId },
      });

      if (!contaCorrente) {
        throw new BadRequestException('Conta corrente não encontrada');
      }

      // Verifica se já existem credenciais para esta combinação
      const existingCredenciais = await this.prisma.credenciaisAPI.findFirst({
        where: {
          banco: createCredenciaisAPIDto.banco,
          contaCorrenteId: createCredenciaisAPIDto.contaCorrenteId,
          modalidadeApi: createCredenciaisAPIDto.modalidadeApi,
        },
      });

      if (existingCredenciais) {
        throw new ConflictException(
          `Já existem credenciais para ${createCredenciaisAPIDto.banco} - ${createCredenciaisAPIDto.modalidadeApi} nesta conta corrente`
        );
      }

      const novasCredenciais = await this.prisma.credenciaisAPI.create({
        data: createCredenciaisAPIDto,
        include: {
          contaCorrente: true,
        },
      });
      
      console.log('✅ [CREDENCIAIS-API] Credenciais criadas com sucesso');
      return novasCredenciais;
    } catch (error) {
      console.error('❌ [CREDENCIAIS-API] Erro ao criar credenciais:', error);
      
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * Atualiza credenciais API existentes
   */
  async update(id: number, updateCredenciaisAPIDto: UpdateCredenciaisAPIDto): Promise<CredenciaisAPIResponseDto> {
    console.log('🔄 [CREDENCIAIS-API] Atualizando credenciais ID:', id);
    
    try {
      // Verifica se as credenciais existem
      await this.findOne(id);

      // Se estiver atualizando a conta corrente, verifica se ela existe
      if (updateCredenciaisAPIDto.contaCorrenteId) {
        const contaCorrente = await this.prisma.contaCorrente.findUnique({
          where: { id: updateCredenciaisAPIDto.contaCorrenteId },
        });

        if (!contaCorrente) {
          throw new BadRequestException('Conta corrente não encontrada');
        }
      }

      // Se estiver atualizando dados únicos, verifica duplicatas
      if (updateCredenciaisAPIDto.banco || 
          updateCredenciaisAPIDto.contaCorrenteId || 
          updateCredenciaisAPIDto.modalidadeApi) {
        
        // Busca as credenciais atuais para preencher campos não atualizados
        const credenciaisAtuais = await this.prisma.credenciaisAPI.findUnique({
          where: { id },
        });

        if (!credenciaisAtuais) {
          throw new NotFoundException('Credenciais API não encontradas');
        }

        const dadosCompletos = {
          banco: updateCredenciaisAPIDto.banco || credenciaisAtuais.banco,
          contaCorrenteId: updateCredenciaisAPIDto.contaCorrenteId || credenciaisAtuais.contaCorrenteId,
          modalidadeApi: updateCredenciaisAPIDto.modalidadeApi || credenciaisAtuais.modalidadeApi,
        };

        // Verifica se já existe outra credencial com esses dados
        const existingCredenciais = await this.prisma.credenciaisAPI.findFirst({
          where: {
            AND: [
              { id: { not: id } }, // Exclui as próprias credenciais da busca
              dadosCompletos,
            ],
          },
        });

        if (existingCredenciais) {
          throw new ConflictException(
            `Já existem credenciais para ${dadosCompletos.banco} - ${dadosCompletos.modalidadeApi} nesta conta corrente`
          );
        }
      }

      const credenciaisAtualizadas = await this.prisma.credenciaisAPI.update({
        where: { id },
        data: updateCredenciaisAPIDto,
        include: {
          contaCorrente: true,
        },
      });
      
      console.log('✅ [CREDENCIAIS-API] Credenciais atualizadas com sucesso');
      return credenciaisAtualizadas;
    } catch (error) {
      console.error('❌ [CREDENCIAIS-API] Erro ao atualizar credenciais:', error);
      
      if (error instanceof NotFoundException || 
          error instanceof ConflictException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * Remove credenciais API
   */
  async remove(id: number): Promise<{ message: string }> {
    console.log('🗑️ [CREDENCIAIS-API] Removendo credenciais ID:', id);
    
    try {
      // Verifica se as credenciais existem
      await this.findOne(id);

      await this.prisma.credenciaisAPI.delete({
        where: { id },
      });
      
      console.log('✅ [CREDENCIAIS-API] Credenciais removidas com sucesso');
      return { message: 'Credenciais API removidas com sucesso' };
    } catch (error) {
      console.error('❌ [CREDENCIAIS-API] Erro ao remover credenciais:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * Busca credenciais por banco e modalidade
   */
  async findByBancoAndModalidade(banco: string, modalidadeApi: string): Promise<CredenciaisAPIResponseDto[]> {
    console.log('🔍 [CREDENCIAIS-API] Buscando credenciais por banco e modalidade:', banco, modalidadeApi);
    
    const credenciais = await this.prisma.credenciaisAPI.findMany({
      where: {
        banco,
        modalidadeApi,
      },
      include: {
        contaCorrente: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ [CREDENCIAIS-API] Encontradas ${credenciais.length} credenciais`);
    return credenciais;
  }
} 