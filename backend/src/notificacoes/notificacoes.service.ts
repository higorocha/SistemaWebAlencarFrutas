import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificacaoDto, UpdateNotificacaoDto, NotificacaoResponseDto, TipoNotificacao, StatusNotificacao } from './dto';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class NotificacoesService {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  async create(createNotificacaoDto: CreateNotificacaoDto, userId?: number): Promise<NotificacaoResponseDto> {
    const data = {
      ...createNotificacaoDto,
      usuarioId: createNotificacaoDto.usuarioId || userId,
      expirarEm: createNotificacaoDto.expirarEm ? new Date(createNotificacaoDto.expirarEm) : null,
    };

    const notificacao = await this.prisma.notificacao.create({
      data,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    // Emitir evento via Socket.io para notificação em tempo real
    this.emitNovaNotificacao(notificacao);

    return this.mapToResponseDto(notificacao);
  }

  async findAll(userId?: number): Promise<{ notificacoes: NotificacaoResponseDto[]; nao_lidas: number }> {
    const where = {
      AND: [
        {
          OR: [
            { usuarioId: null },
            { usuarioId: userId },
          ],
        },
        {
          OR: [
            { expirarEm: null },
            { expirarEm: { gt: new Date() } },
          ],
        },
        {
          status: {
            not: StatusNotificacao.DESCARTADA,
          },
        },
      ],
    };

    const [notificacoes, naoLidas] = await Promise.all([
      this.prisma.notificacao.findMany({
        where,
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
      }),
      this.prisma.notificacao.count({
        where: {
          ...where,
          status: StatusNotificacao.NAO_LIDA,
        },
      }),
    ]);

    return {
      notificacoes: notificacoes.map(this.mapToResponseDto),
      nao_lidas: naoLidas,
    };
  }

  async findOne(id: number, userId?: number): Promise<NotificacaoResponseDto> {
    const notificacao = await this.prisma.notificacao.findFirst({
      where: {
        id,
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return this.mapToResponseDto(notificacao);
  }

  async update(id: number, updateNotificacaoDto: UpdateNotificacaoDto, userId?: number): Promise<NotificacaoResponseDto> {
    // Verificar se a notificação existe e pertence ao usuário
    const existingNotificacao = await this.prisma.notificacao.findFirst({
      where: {
        id,
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
      },
    });

    if (!existingNotificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    const data = {
      ...updateNotificacaoDto,
      expirarEm: updateNotificacaoDto.expirarEm ? new Date(updateNotificacaoDto.expirarEm) : undefined,
    };

    const notificacao = await this.prisma.notificacao.update({
      where: { id },
      data,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return this.mapToResponseDto(notificacao);
  }

  async remove(id: number, userId?: number): Promise<void> {
    // Verificar se a notificação existe e pertence ao usuário
    const notificacao = await this.prisma.notificacao.findFirst({
      where: {
        id,
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
      },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    await this.prisma.notificacao.delete({
      where: { id },
    });
  }

  async marcarComoLida(id: number, userId?: number): Promise<NotificacaoResponseDto> {
    const notificacao = await this.prisma.notificacao.findFirst({
      where: {
        id,
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
      },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    const updatedNotificacao = await this.prisma.notificacao.update({
      where: { id },
      data: { status: StatusNotificacao.LIDA },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    // Emitir evento via Socket.io
    this.emitNotificacaoLida(id);

    return this.mapToResponseDto(updatedNotificacao);
  }

  async marcarTodasComoLidas(userId?: number): Promise<void> {
    await this.prisma.notificacao.updateMany({
      where: {
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
        status: StatusNotificacao.NAO_LIDA,
      },
      data: { status: StatusNotificacao.LIDA },
    });

    // Emitir evento via Socket.io
    this.emitTodasNotificacoesLidas();
  }

  async descartarNotificacao(id: number, userId?: number): Promise<void> {
    const notificacao = await this.prisma.notificacao.findFirst({
      where: {
        id,
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
      },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    const eraNaoLida = notificacao.status === StatusNotificacao.NAO_LIDA;

    await this.prisma.notificacao.update({
      where: { id },
      data: { status: StatusNotificacao.DESCARTADA },
    });

    // Emitir evento via Socket.io
    this.emitNotificacaoDescartada(id, eraNaoLida);
  }

  async criarNotificacaoSistema(titulo: string, conteudo: string, dadosAdicionais?: Record<string, any>): Promise<NotificacaoResponseDto> {
    return this.create({
      titulo,
      conteudo,
      tipo: TipoNotificacao.SISTEMA,
      dadosAdicionais,
    });
  }

  async criarNotificacaoPagamento(nomeCliente: string, valor: number, tipo: 'PIX' | 'BOLETO'): Promise<NotificacaoResponseDto> {
    const conteudo = `O Irrigante ${nomeCliente} pagou um ${tipo.toLowerCase()} no valor de R$ ${valor.toFixed(2).replace('.', ',')}`;
    
    return this.create({
      titulo: `Pagamento ${tipo} recebido`,
      conteudo,
      tipo: tipo === 'PIX' ? TipoNotificacao.PIX : TipoNotificacao.BOLETO,
      dadosAdicionais: {
        cliente: nomeCliente,
        valor,
        tipo_pagamento: tipo,
      },
    });
  }

  async limparNotificacoesExpiradas(): Promise<void> {
    await this.prisma.notificacao.deleteMany({
      where: {
        expirarEm: {
          not: null,
          lt: new Date(),
        },
      },
    });
  }

  private mapToResponseDto(notificacao: any): NotificacaoResponseDto {
    return {
      id: notificacao.id,
      titulo: notificacao.titulo,
      conteudo: notificacao.conteudo,
      tipo: notificacao.tipo,
      status: notificacao.status,
      prioridade: notificacao.prioridade,
      usuarioId: notificacao.usuarioId,
      dadosAdicionais: notificacao.dadosAdicionais,
      link: notificacao.link,
      expirarEm: notificacao.expirarEm,
      createdAt: notificacao.createdAt,
      updatedAt: notificacao.updatedAt,
    };
  }

  // Métodos para emitir eventos via Socket.io
  private emitNovaNotificacao(notificacao: any): void {
    if (this.server) {
      this.server.emit('nova_notificacao', {
        notificacao: this.mapToResponseDto(notificacao),
      });
    }
  }

  private emitNotificacaoLida(notificacaoId: number): void {
    if (this.server) {
      this.server.emit('notificacao_lida', {
        notificacaoId,
      });
    }
  }

  private emitTodasNotificacoesLidas(): void {
    if (this.server) {
      this.server.emit('todas_notificacoes_lidas', {});
    }
  }

  private emitNotificacaoDescartada(notificacaoId: number, eraNaoLida: boolean): void {
    if (this.server) {
      this.server.emit('notificacao_descartada', {
        notificacaoId,
        eraNaoLida,
      });
    }
  }
} 