type CategoriaFruta = 'CITRICOS' | 'TROPICAIS' | 'TEMPERADAS' | 'SECAS' | 'EXOTICAS' | 'VERMELHAS' | 'VERDES';
type StatusFruta = 'ATIVA' | 'INATIVA';
export declare class CreateFrutaDto {
    nome: string;
    codigo?: string;
    categoria?: CategoriaFruta;
    descricao?: string;
    status?: StatusFruta;
    nomeCientifico?: string;
    corPredominante?: string;
    epocaColheita?: string;
    observacoes?: string;
}
export {};
