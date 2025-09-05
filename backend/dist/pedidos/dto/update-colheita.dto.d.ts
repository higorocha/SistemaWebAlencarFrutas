export declare class AreasExcludentesConstraint {
    validate(value: any, args: any): boolean;
    defaultMessage(): string;
}
export declare class UpdateColheitaFrutaDto {
    frutaPedidoId: number;
    areaPropriaId?: number;
    areaFornecedorId?: number;
    quantidadeReal: number;
    quantidadeReal2?: number;
    fitaColheita?: string;
    areasValidation: any;
}
export declare class UpdateColheitaDto {
    dataColheita: Date;
    observacoesColheita?: string;
    frutas: UpdateColheitaFrutaDto[];
    pesagem?: string;
    placaPrimaria?: string;
    placaSecundaria?: string;
    nomeMotorista?: string;
}
