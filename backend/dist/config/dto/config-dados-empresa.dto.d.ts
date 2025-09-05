export declare class CreateConfigDadosEmpresaDto {
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    proprietario?: string;
    telefone: string;
    logradouro: string;
    cep: string;
    bairro: string;
    cidade: string;
    estado: string;
}
export declare class UpdateConfigDadosEmpresaDto {
    razao_social?: string;
    nome_fantasia?: string;
    cnpj?: string;
    proprietario?: string;
    telefone?: string;
    logradouro?: string;
    cep?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
}
export declare class ConfigDadosEmpresaResponseDto {
    id: number;
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    proprietario?: string | null;
    telefone: string;
    logradouro: string;
    cep: string;
    bairro: string;
    cidade: string;
    estado: string;
    createdAt: Date;
    updatedAt: Date;
}
