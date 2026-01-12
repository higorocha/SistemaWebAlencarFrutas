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
   * Busca o convênio de cobrança (único registro)
   * Retorna null se não existir
   */
  async findConvenio(): Promise<ConvenioCobrancaResponseDto | null> {
    console.log('🔍 [CONVENIO-COBRANCA] Buscando convênio de cobrança...');
    
    const convenio = await this.prisma.convenioCobranca.findFirst({
      include: {
        contaCorrente: true, // Incluir dados da conta corrente
      },
      orderBy: {
        updatedAt: 'desc', // Pega o mais recente (caso existam múltiplos por erro)
      },
    });

    if (convenio) {
      console.log('✅ [CONVENIO-COBRANCA] Convênio encontrado:', convenio.convenio);
    } else {
      console.log('📝 [CONVENIO-COBRANCA] Nenhum convênio encontrado');
    }

    return convenio;
  }

  /**
   * Cria ou atualiza o convênio de cobrança (upsert)
   * Como é um registro único, sempre sobrescreve o existente
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

      // Busca se já existe um convênio
      const convenioExistente = await this.prisma.convenioCobranca.findFirst();

      let convenioSalvo: ConvenioCobrancaResponseDto;

      if (convenioExistente) {
        // Atualiza o convênio existente
        console.log('🔄 [CONVENIO-COBRANCA] Atualizando convênio existente ID:', convenioExistente.id);
        
        convenioSalvo = await this.prisma.convenioCobranca.update({
          where: { id: convenioExistente.id },
          data: {
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
      } else {
        // Cria novo convênio
        console.log('➕ [CONVENIO-COBRANCA] Criando novo convênio');
        
        convenioSalvo = await this.prisma.convenioCobranca.create({
          data: {
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
      }
      
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
   * Verifica se existe um convênio cadastrado
   * Útil para verificações rápidas
   */
  async existeConvenio(): Promise<boolean> {
    const count = await this.prisma.convenioCobranca.count();
    return count > 0;
  }
} 