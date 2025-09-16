type StatusCliente = 'ATIVO' | 'INATIVO';
export declare class CreateClienteDto {
    nome: string;
    razaoSocial?: string;
    documento?: string;
    inscricaoEstadual?: string;
    inscricaoMunicipal?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    telefone1?: string;
    telefone2?: string;
    email1?: string;
    email2?: string;
    observacoes?: string;
    status?: StatusCliente;
    industria?: boolean;
}
export {};
