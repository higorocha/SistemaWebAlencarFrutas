import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateContaCorrenteDto, 
  UpdateContaCorrenteDto, 
  ContaCorrenteResponseDto 
} from '../config/dto/conta-corrente.dto';

@Injectable()
export class ContaCorrenteService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca todas as contas correntes
   */
  async findAll(): Promise<ContaCorrenteResponseDto[]> {
    console.log('🔍 [CONTA-CORRENTE] Buscando todas as contas correntes...');
    
    const contasCorrentes = await this.prisma.contaCorrente.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ [CONTA-CORRENTE] Encontradas ${contasCorrentes.length} contas correntes`);
    return contasCorrentes;
  }

  /**
   * Busca uma conta corrente específica por ID
   */
  async findOne(id: number): Promise<ContaCorrenteResponseDto> {
    console.log('🔍 [CONTA-CORRENTE] Buscando conta corrente ID:', id);
    
    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id },
    });

    if (!contaCorrente) {
      console.log('❌ [CONTA-CORRENTE] Conta corrente não encontrada');
      throw new NotFoundException('Conta corrente não encontrada');
    }

    console.log('✅ [CONTA-CORRENTE] Conta corrente encontrada:', contaCorrente.bancoCodigo);
    return contaCorrente;
  }

  /**
   * Cria uma nova conta corrente
   */
  async create(createContaCorrenteDto: CreateContaCorrenteDto): Promise<ContaCorrenteResponseDto> {
    console.log('💾 [CONTA-CORRENTE] Criando nova conta corrente...', createContaCorrenteDto);
    
    try {
      // Verifica se já existe uma conta com os mesmos dados
      const existingConta = await this.prisma.contaCorrente.findFirst({
        where: {
          bancoCodigo: createContaCorrenteDto.bancoCodigo,
          agencia: createContaCorrenteDto.agencia,
          agenciaDigito: createContaCorrenteDto.agenciaDigito,
          contaCorrente: createContaCorrenteDto.contaCorrente,
          contaCorrenteDigito: createContaCorrenteDto.contaCorrenteDigito,
        },
      });

      if (existingConta) {
        throw new ConflictException('Já existe uma conta corrente com esses dados');
      }

      const novaConta = await this.prisma.contaCorrente.create({
        data: createContaCorrenteDto,
      });
      
      console.log('✅ [CONTA-CORRENTE] Conta corrente criada com sucesso');
      return novaConta;
    } catch (error) {
      console.error('❌ [CONTA-CORRENTE] Erro ao criar conta corrente:', error);
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * Atualiza uma conta corrente existente
   */
  async update(id: number, updateContaCorrenteDto: UpdateContaCorrenteDto): Promise<ContaCorrenteResponseDto> {
    console.log('🔄 [CONTA-CORRENTE] Atualizando conta corrente ID:', id);
    
    try {
      // Verifica se a conta existe
      await this.findOne(id);

      // Se estiver atualizando dados da conta, verifica duplicatas
      if (updateContaCorrenteDto.bancoCodigo || 
          updateContaCorrenteDto.agencia || 
          updateContaCorrenteDto.agenciaDigito || 
          updateContaCorrenteDto.contaCorrente || 
          updateContaCorrenteDto.contaCorrenteDigito) {
        
        // Busca a conta atual para preencher campos não atualizados
        const contaAtual = await this.prisma.contaCorrente.findUnique({
          where: { id },
        });

        if (!contaAtual) {
          throw new NotFoundException('Conta corrente não encontrada');
        }

        const dadosCompletos = {
          bancoCodigo: updateContaCorrenteDto.bancoCodigo || contaAtual.bancoCodigo,
          agencia: updateContaCorrenteDto.agencia || contaAtual.agencia,
          agenciaDigito: updateContaCorrenteDto.agenciaDigito || contaAtual.agenciaDigito,
          contaCorrente: updateContaCorrenteDto.contaCorrente || contaAtual.contaCorrente,
          contaCorrenteDigito: updateContaCorrenteDto.contaCorrenteDigito || contaAtual.contaCorrenteDigito,
        };

        // Verifica se já existe outra conta com esses dados
        const existingConta = await this.prisma.contaCorrente.findFirst({
          where: {
            AND: [
              { id: { not: id } }, // Exclui a própria conta da busca
              dadosCompletos,
            ],
          },
        });

        if (existingConta) {
          throw new ConflictException('Já existe uma conta corrente com esses dados');
        }
      }

      const contaAtualizada = await this.prisma.contaCorrente.update({
        where: { id },
        data: updateContaCorrenteDto,
      });
      
      console.log('✅ [CONTA-CORRENTE] Conta corrente atualizada com sucesso');
      return contaAtualizada;
    } catch (error) {
      console.error('❌ [CONTA-CORRENTE] Erro ao atualizar conta corrente:', error);
      
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * Remove uma conta corrente
   */
  async remove(id: number): Promise<{ message: string }> {
    console.log('🗑️ [CONTA-CORRENTE] Removendo conta corrente ID:', id);
    
    try {
      // Verifica se a conta existe
      await this.findOne(id);

      await this.prisma.contaCorrente.delete({
        where: { id },
      });
      
      console.log('✅ [CONTA-CORRENTE] Conta corrente removida com sucesso');
      return { message: 'Conta corrente removida com sucesso' };
    } catch (error) {
      console.error('❌ [CONTA-CORRENTE] Erro ao remover conta corrente:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw error;
    }
  }
} 