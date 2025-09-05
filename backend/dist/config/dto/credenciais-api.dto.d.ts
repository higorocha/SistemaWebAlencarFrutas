export declare class CreateCredenciaisAPIDto {
    banco: string;
    contaCorrenteId: number;
    modalidadeApi: string;
    developerAppKey: string;
    clienteId: string;
    clienteSecret: string;
}
declare const UpdateCredenciaisAPIDto_base: import("@nestjs/common").Type<Partial<CreateCredenciaisAPIDto>>;
export declare class UpdateCredenciaisAPIDto extends UpdateCredenciaisAPIDto_base {
    banco?: string;
    contaCorrenteId?: number;
    modalidadeApi?: string;
    developerAppKey?: string;
    clienteId?: string;
    clienteSecret?: string;
}
export declare class CredenciaisAPIResponseDto {
    id: number;
    banco: string;
    contaCorrenteId: number;
    modalidadeApi: string;
    developerAppKey: string;
    clienteId: string;
    clienteSecret: string;
    createdAt: Date;
    updatedAt: Date;
}
export {};
