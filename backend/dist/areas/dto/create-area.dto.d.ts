export declare enum CategoriaArea {
    COLONO = "COLONO",
    TECNICO = "TECNICO",
    EMPRESARIAL = "EMPRESARIAL",
    ADJACENTE = "ADJACENTE"
}
export declare class CulturaAreaDto {
    culturaId: number;
    areaPlantada: number;
    areaProduzindo: number;
    descricao?: string;
}
export declare class CreateAreaDto {
    nome: string;
    categoria: CategoriaArea;
    areaTotal: number;
    coordenadas?: any;
    culturas: CulturaAreaDto[];
}
