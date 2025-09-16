export declare class TurmaColheitaResponseDto {
    id: number;
    nomeColhedor: string;
    chavePix?: string | null;
    dataCadastro: Date;
    observacoes?: string | null;
    createdAt: Date;
    updatedAt: Date;
    custosColheita?: Array<{
        id: number;
        pedidoId: number;
        frutaId: number;
        quantidadeColhida: number;
        unidadeMedida: string;
        valorColheita: number | null;
        dataColheita: Date | null;
        pagamentoEfetuado: boolean;
        observacoes: string | null;
        pedido?: {
            numeroPedido: string;
            status: string;
            dataPedido: Date;
        };
        fruta?: {
            nome: string;
            categoria: string | null;
        };
    }>;
}
