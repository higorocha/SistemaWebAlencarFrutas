import { UnidadeMedida } from '@prisma/client';
export declare class TurmaColheitaPedidoCustoResponseDto {
    id: number;
    turmaColheitaId: number;
    pedidoId: number;
    frutaId: number;
    quantidadeColhida: number;
    unidadeMedida: UnidadeMedida;
    valorColheita?: number | null;
    dataColheita?: Date | null;
    pagamentoEfetuado: boolean;
    observacoes?: string | null;
    createdAt: Date;
    updatedAt: Date;
    turmaColheita?: {
        nomeColhedor: string;
        chavePix: string | null;
        dataCadastro: Date;
    };
    pedido?: {
        numeroPedido: string;
        status: string;
        dataPedido: Date;
    };
    fruta?: {
        nome: string;
        categoria: string | null;
    };
}
