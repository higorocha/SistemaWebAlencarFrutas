export declare class ConvenioCobrancaDto {
    contaCorrenteId: number;
    juros: number;
    diasAberto: number;
    multaAtiva: boolean;
    layoutBoletoFundoBranco: boolean;
    valorMulta?: number | null;
    carenciaMulta?: number | null;
    convenio: string;
    carteira: string;
    variacao: string;
}
export declare class ConvenioCobrancaResponseDto extends ConvenioCobrancaDto {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}
