export declare class AreaFornecedorResponseDto {
    id: number;
    fornecedorId: number;
    nome: string;
    createdAt: Date;
    updatedAt: Date;
    fornecedor?: {
        id: number;
        nome: string;
    };
}
