import { TipoNotificacao, PrioridadeNotificacao } from './create-notificacao.dto';
export declare enum StatusNotificacao {
    NAO_LIDA = "NAO_LIDA",
    LIDA = "LIDA",
    DESCARTADA = "DESCARTADA"
}
export declare class NotificacaoResponseDto {
    id: number;
    titulo: string;
    conteudo: string;
    tipo: TipoNotificacao;
    status: StatusNotificacao;
    prioridade: PrioridadeNotificacao;
    usuarioId?: number;
    dadosAdicionais?: Record<string, any>;
    link?: string;
    expirarEm?: Date;
    createdAt: Date;
    updatedAt: Date;
}
