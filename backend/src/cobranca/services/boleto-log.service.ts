import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoOperacaoBoletoLog } from '@prisma/client';

/**
 * Service para logs de auditoria de boletos
 * 
 * Registra todas as operações realizadas nos boletos para rastreabilidade
 */
@Injectable()
export class BoletoLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria um log de auditoria para uma operação em boleto
   * @param boletoId ID do boleto
   * @param tipoOperacao Tipo da operação realizada
   * @param descricaoOperacao Descrição da operação
   * @param dadosAntes Dados antes da operação (opcional)
   * @param dadosDepois Dados depois da operação (opcional)
   * @param usuarioId ID do usuário que executou a operação (opcional)
   * @param ipAddress Endereço IP do usuário (opcional)
   * @param mensagemErro Mensagem de erro, se houver (opcional)
   */
  async criarLog(
    boletoId: number,
    tipoOperacao: TipoOperacaoBoletoLog,
    descricaoOperacao: string,
    dadosAntes?: any,
    dadosDepois?: any,
    usuarioId?: number,
    ipAddress?: string,
    mensagemErro?: string
  ): Promise<void> {
    try {
      await this.prisma.boletoLog.create({
        data: {
          boletoId,
          tipoOperacao,
          descricaoOperacao,
          dadosAntes: dadosAntes ? JSON.parse(JSON.stringify(dadosAntes)) : null,
          dadosDepois: dadosDepois ? JSON.parse(JSON.stringify(dadosDepois)) : null,
          usuarioId: usuarioId || null,
          ipAddress: ipAddress || null,
          mensagemErro: mensagemErro || null
        }
      });
    } catch (error) {
      // Não falhar a operação principal se o log falhar
      console.error(`[BOLETO-LOG] Erro ao criar log:`, error);
    }
  }

  /**
   * Busca logs de um boleto específico
   * @param boletoId ID do boleto
   * @returns Lista de logs do boleto
   */
  async buscarLogsPorBoleto(boletoId: number) {
    return this.prisma.boletoLog.findMany({
      where: { boletoId },
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });
  }
}
