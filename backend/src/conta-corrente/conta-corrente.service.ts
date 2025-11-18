import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
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
      include: {
        credenciaisAPI: true, // Inclui credenciais API para verificar se tem extrato
      },
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
    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id },
      include: {
        credenciaisAPI: true, // Inclui credenciais API para verificar se tem extrato
      },
    });

    if (!contaCorrente) {
      throw new NotFoundException('Conta corrente não encontrada');
    }

    return contaCorrente;
  }

  /**
   * Cria uma nova conta corrente
   */
  async create(createContaCorrenteDto: CreateContaCorrenteDto): Promise<ContaCorrenteResponseDto> {
    console.log('💾 [CONTA-CORRENTE] Criando nova conta corrente...', createContaCorrenteDto);
    
    try {
      // Validação: se monitorar for true, intervalo deve ser informado
      if (createContaCorrenteDto.monitorar === true && (!createContaCorrenteDto.intervalo || createContaCorrenteDto.intervalo <= 0)) {
        throw new BadRequestException('Quando monitorar é true, o intervalo deve ser informado e maior que 0');
      }

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
        data: {
          ...createContaCorrenteDto,
          monitorar: createContaCorrenteDto.monitorar ?? false,
        },
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
    try {
      // Validação: se monitorar for true, intervalo deve ser informado
      if (updateContaCorrenteDto.monitorar === true && (!updateContaCorrenteDto.intervalo || updateContaCorrenteDto.intervalo <= 0)) {
        // Se está atualizando apenas o monitorar para true, verifica se já existe intervalo na conta
        if (!updateContaCorrenteDto.intervalo) {
          const contaAtual = await this.prisma.contaCorrente.findUnique({
            where: { id },
          });
          if (!contaAtual || !contaAtual.intervalo || contaAtual.intervalo <= 0) {
            throw new BadRequestException('Quando monitorar é true, o intervalo deve ser informado e maior que 0');
          }
        } else if (updateContaCorrenteDto.intervalo <= 0) {
          throw new BadRequestException('Intervalo deve ser maior que 0');
        }
      }

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

      // Preparar dados para atualização - usar diretamente o DTO sem modificações
      const dataUpdate: any = { ...updateContaCorrenteDto };
      
      // Se monitorar está sendo atualizado para false E intervalo foi explicitamente enviado como null, limpar
      // Mas se intervalo foi enviado com um valor, não sobrescrever
      if (dataUpdate.monitorar === false && dataUpdate.intervalo === null) {
        // Manter null se foi explicitamente enviado como null
      } else if (dataUpdate.monitorar === false && dataUpdate.intervalo === undefined) {
        // Se monitorar é false e intervalo não foi enviado, não incluir no update (mantém valor atual)
        delete dataUpdate.intervalo;
      }
      
      const contaAtualizada = await this.prisma.contaCorrente.update({
        where: { id },
        data: dataUpdate,
        include: {
          credenciaisAPI: true, // Inclui credenciais API para manter consistência
        },
      });
      
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
      
      // Verifica se é um erro de foreign key constraint (P2003)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException(
          'Não é possível excluir esta conta corrente pois ela está vinculada a outros registros no sistema (lotes de pagamento, convênios, credenciais API, etc.). Remova primeiro os registros vinculados antes de excluir a conta.'
        );
      }
      
      throw error;
    }
  }
} 