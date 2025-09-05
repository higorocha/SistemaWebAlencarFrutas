export declare class AreaFornecedorDto {
    id: number;
    nome: string;
}
export declare class FornecedorResponseDto {
    id: number;
    nome: string;
    documento?: string;
    cnpj?: string;
    cpf?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    observacoes?: string;
    areas?: AreaFornecedorDto[];
    createdAt: Date;
    updatedAt: Date;
}
