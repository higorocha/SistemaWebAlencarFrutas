import { CategoriaArea, CulturaAreaDto } from './create-area.dto';
export declare class AreaResponseDto {
    id: number;
    nome: string;
    categoria: CategoriaArea;
    areaTotal: number;
    coordenadas?: any;
    culturas: CulturaAreaDto[];
    createdAt: Date;
    updatedAt: Date;
}
