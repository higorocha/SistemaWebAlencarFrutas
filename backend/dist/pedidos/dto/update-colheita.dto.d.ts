export declare class UpdateColheitaAreaDto {
    id?: number;
    areaPropriaId?: number;
    areaFornecedorId?: number;
    observacoes?: string;
}
export declare class UpdateColheitaFitaDto {
    id?: number;
    fitaBananaId: number;
    controleBananaId?: number;
    quantidadeFita?: number;
    observacoes?: string;
    detalhesAreas?: Array<{
        fitaBananaId: number;
        areaId: number;
        quantidade: number;
        controleBananaId: number;
    }>;
}
export declare class UpdateColheitaFrutaDto {
    frutaPedidoId: number;
    quantidadeReal: number;
    quantidadeReal2?: number;
    areas: UpdateColheitaAreaDto[];
    fitas?: UpdateColheitaFitaDto[];
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
