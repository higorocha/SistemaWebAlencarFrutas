export declare enum PeriodicidadeCultura {
    PERENE = "PERENE",
    TEMPORARIA = "TEMPORARIA"
}
export declare class CreateCulturaDto {
    descricao: string;
    periodicidade: PeriodicidadeCultura;
    permitirConsorcio?: boolean;
}
