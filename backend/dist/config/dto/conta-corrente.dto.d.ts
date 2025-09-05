export declare class CreateContaCorrenteDto {
    bancoCodigo: string;
    agencia: string;
    agenciaDigito: string;
    contaCorrente: string;
    contaCorrenteDigito: string;
}
export declare class UpdateContaCorrenteDto {
    bancoCodigo?: string;
    agencia?: string;
    agenciaDigito?: string;
    contaCorrente?: string;
    contaCorrenteDigito?: string;
}
export declare class ContaCorrenteResponseDto {
    id: number;
    bancoCodigo: string;
    agencia: string;
    agenciaDigito: string;
    contaCorrente: string;
    contaCorrenteDigito: string;
    createdAt: Date;
    updatedAt: Date;
}
