import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TipoAcaoHistorico,
  HistoricoDetalhes,
  RegistrarAcaoParams,
} from './types/historico.types';

@Injectable()
export class HistoricoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra uma ação no histórico do pedido com tipagem forte
   */
  async registrarAcao(
    pedidoId: number,
    usuarioId: number,
    acao: TipoAcaoHistorico,
    detalhes?: HistoricoDetalhes,
  ): Promise<void> {
    await this.prisma.historicoPedido.create({
      data: {
        pedidoId,
        usuarioId,
        acao,
        statusAnterior: detalhes?.statusAnterior,
        statusNovo: detalhes?.statusNovo,
        detalhes: detalhes as any, // Prisma armazena como Json
      },
    });
  }

  /**
   * Busca o histórico completo de um pedido
   */
  async buscarHistoricoPedido(pedidoId: number) {
    return this.prisma.historicoPedido.findMany({
      where: { pedidoId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
