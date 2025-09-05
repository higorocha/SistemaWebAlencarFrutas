import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificacaoDto, UpdateNotificacaoDto, NotificacaoResponseDto } from './dto';
import { Server } from 'socket.io';
export declare class NotificacoesService {
    private prisma;
    server: Server;
    constructor(prisma: PrismaService);
    create(createNotificacaoDto: CreateNotificacaoDto, userId?: number): Promise<NotificacaoResponseDto>;
    findAll(userId?: number): Promise<{
        notificacoes: NotificacaoResponseDto[];
        nao_lidas: number;
    }>;
    findOne(id: number, userId?: number): Promise<NotificacaoResponseDto>;
    update(id: number, updateNotificacaoDto: UpdateNotificacaoDto, userId?: number): Promise<NotificacaoResponseDto>;
    remove(id: number, userId?: number): Promise<void>;
    marcarComoLida(id: number, userId?: number): Promise<NotificacaoResponseDto>;
    marcarTodasComoLidas(userId?: number): Promise<void>;
    descartarNotificacao(id: number, userId?: number): Promise<void>;
    criarNotificacaoSistema(titulo: string, conteudo: string, dadosAdicionais?: Record<string, any>): Promise<NotificacaoResponseDto>;
    criarNotificacaoPagamento(nomeCliente: string, valor: number, tipo: 'PIX' | 'BOLETO'): Promise<NotificacaoResponseDto>;
    limparNotificacoesExpiradas(): Promise<void>;
    private mapToResponseDto;
    private emitNovaNotificacao;
    private emitNotificacaoLida;
    private emitTodasNotificacoesLidas;
    private emitNotificacaoDescartada;
}
