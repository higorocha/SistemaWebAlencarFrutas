import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ConvenioCobrancaDto, 
  ConvenioCobrancaResponseDto 
} from '../config/dto/convenio-cobranca.dto';

@Injectable()
export class ConvenioCobrancaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca o primeiro convênio de cobrança (comportamento legado)
   * Retorna null se não existir
   */
  async findFirstConvenio(): Promise<ConvenioCobrancaResponseDto | null> {
    console.log('🔍 [CONVENIO-COBRANCA] Buscando primeiro convênio de cobrança (legado)...');

    const convenio = await this.prisma.convenioCobranca.findFirst({
      include: {
        contaCorrente: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (convenio) {
      console.log('✅ [CONVENIO-COBRANCA] Convênio encontrado (legado):', convenio.convenio);
    } else {
      console.log('📝 [CONVENIO-COBRANCA] Nenhum convênio encontrado');
    }

    return convenio;
  }

  /**
   * Busca o convênio de cobrança por conta corrente
   * Retorna null se não existir
   */
  async findConvenio(contaCorrenteId: number): Promise<ConvenioCobrancaResponseDto | null> {
    console.log('🔍 [CONVENIO-COBRANCA] Buscando convênio de cobrança para conta ID:', contaCorrenteId);

    const convenio = await this.prisma.convenioCobranca.findUnique({
      where: { contaCorrenteId },
      include: {
        contaCorrente: true, // Incluir dados da conta corrente
      },
    });

    if (convenio) {
      console.log('✅ [CONVENIO-COBRANCA] Convênio encontrado:', convenio.convenio);
    } else {
      console.log('📝 [CONVENIO-COBRANCA] Nenhum convênio encontrado para conta ID:', contaCorrenteId);
    }

    return convenio;
  }

  /**
   * Cria ou atualiza o convênio de cobrança por conta corrente (upsert)
   * Cada conta corrente pode ter seu próprio convênio
   */
  async upsertConvenio(convenioDto: ConvenioCobrancaDto): Promise<ConvenioCobrancaResponseDto> {
    console.log('💾 [CONVENIO-COBRANCA] Salvando convênio de cobrança...', {
      contaCorrenteId: convenioDto.contaCorrenteId,
      convenio: convenioDto.convenio,
      carteira: convenioDto.carteira,
      multaAtiva: convenioDto.multaAtiva,
    });

    try {
      // Validação de negócio: verifica se conta corrente existe
      await this.validateContaCorrente(convenioDto.contaCorrenteId);

      // Validação de negócio: se multa ativa, campos de multa são obrigatórios
      this.validateMultaFields(convenioDto);

      // Usa upsert do Prisma - cria se não existe, atualiza se existe
      const convenioSalvo = await this.prisma.convenioCobranca.upsert({
        where: { contaCorrenteId: convenioDto.contaCorrenteId },
        update: {
          juros: convenioDto.juros,
          diasAberto: convenioDto.diasAberto,
          multaAtiva: convenioDto.multaAtiva,
          boletoPix: convenioDto.boletoPix,
          valorMulta: convenioDto.valorMulta,
          carenciaMulta: convenioDto.carenciaMulta,
          convenio: convenioDto.convenio,
          carteira: convenioDto.carteira,
          variacao: convenioDto.variacao,
          chavePix: convenioDto.chavePix,
        },
        create: {
          contaCorrenteId: convenioDto.contaCorrenteId,
          juros: convenioDto.juros,
          diasAberto: convenioDto.diasAberto,
          multaAtiva: convenioDto.multaAtiva,
          boletoPix: convenioDto.boletoPix,
          valorMulta: convenioDto.valorMulta,
          carenciaMulta: convenioDto.carenciaMulta,
          convenio: convenioDto.convenio,
          carteira: convenioDto.carteira,
          variacao: convenioDto.variacao,
          chavePix: convenioDto.chavePix,
        },
        include: {
          contaCorrente: true,
        },
      });

      console.log('✅ [CONVENIO-COBRANCA] Convênio salvo com sucesso');
      return convenioSalvo;
    } catch (error) {
      console.error('❌ [CONVENIO-COBRANCA] Erro ao salvar convênio:', error);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw error;
    }
  }

  /**
   * Remove o convênio de cobrança
   * Útil para testes ou reset completo
   */
  async deleteConvenio(): Promise<{ message: string }> {
    console.log('🗑️ [CONVENIO-COBRANCA] Removendo convênio de cobrança...');
    
    try {
      const convenioExistente = await this.prisma.convenioCobranca.findFirst();

      if (!convenioExistente) {
        console.log('📝 [CONVENIO-COBRANCA] Nenhum convênio para remover');
        return { message: 'Nenhum convênio de cobrança encontrado para remover' };
      }

      await this.prisma.convenioCobranca.delete({
        where: { id: convenioExistente.id },
      });
      
      console.log('✅ [CONVENIO-COBRANCA] Convênio removido com sucesso');
      return { message: 'Convênio de cobrança removido com sucesso' };
    } catch (error) {
      console.error('❌ [CONVENIO-COBRANCA] Erro ao remover convênio:', error);
      throw error;
    }
  }

  /**
   * Valida campos específicos de multa
   * Se multa ativa = true, valorMulta e carenciaMulta são obrigatórios
   */
  private validateMultaFields(convenioDto: ConvenioCobrancaDto): void {
    if (convenioDto.multaAtiva) {
      if (convenioDto.valorMulta === undefined || convenioDto.valorMulta === null) {
        throw new BadRequestException('Valor da multa é obrigatório quando multa está ativa');
      }
      
      if (convenioDto.carenciaMulta === undefined || convenioDto.carenciaMulta === null) {
        throw new BadRequestException('Carência da multa é obrigatória quando multa está ativa');
      }
    }
  }

  /**
   * Valida se a conta corrente existe
   */
  private async validateContaCorrente(contaCorrenteId: number): Promise<void> {
    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id: contaCorrenteId },
    });

    if (!contaCorrente) {
      throw new NotFoundException(`Conta corrente com ID ${contaCorrenteId} não encontrada`);
    }
  }

  /**
   * Verifica se existe um convênio para uma conta corrente
   * Útil para verificações rápidas
   */
  async existeConvenio(contaCorrenteId: number): Promise<boolean> {
    const count = await this.prisma.convenioCobranca.count({
      where: { contaCorrenteId },
    });
    return count > 0;
  }

  /**
   * Remove o convênio de cobrança de uma conta corrente específica
   */
  async deleteConvenioByContaCorrenteId(contaCorrenteId: number): Promise<{ message: string }> {
    console.log('🗑️ [CONVENIO-COBRANCA] Removendo convênio de cobrança para conta ID:', contaCorrenteId);

    try {
      const convenioExistente = await this.prisma.convenioCobranca.findUnique({
        where: { contaCorrenteId },
      });

      if (!convenioExistente) {
        console.log('📝 [CONVENIO-COBRANCA] Nenhum convênio para conta ID:', contaCorrenteId);
        return { message: 'Nenhum convênio de cobrança encontrado para esta conta corrente' };
      }

      await this.prisma.convenioCobranca.delete({
        where: { contaCorrenteId },
      });

      console.log('✅ [CONVENIO-COBRANCA] Convênio removido com sucesso para conta ID:', contaCorrenteId);
      return { message: 'Convênio de cobrança removido com sucesso' };
    } catch (error) {
      console.error('❌ [CONVENIO-COBRANCA] Erro ao remover convênio:', error);
      throw error;
    }
  }
} 