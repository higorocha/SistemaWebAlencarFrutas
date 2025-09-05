export declare enum TipoNotificacao {
    SISTEMA = "SISTEMA",
    PIX = "PIX",
    COBRANCA = "COBRANCA",
    FATURA = "FATURA",
    BOLETO = "BOLETO",
    ALERTA = "ALERTA"
}
export declare enum PrioridadeNotificacao {
    BAIXA = "BAIXA",
    MEDIA = "MEDIA",
    ALTA = "ALTA"
}
export declare class CreateNotificacaoDto {
    titulo: string;
    conteudo: string;
    tipo?: TipoNotificacao;
    prioridade?: PrioridadeNotificacao;
    usuarioId?: number;
    dadosAdicionais?: Record<string, any>;
    link?: string;
    expirarEm?: string;
}
