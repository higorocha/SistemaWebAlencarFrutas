import { PeriodicidadeCultura } from './create-cultura.dto';
export declare class CulturaResponseDto {
    id: number;
    descricao: string;
    periodicidade: PeriodicidadeCultura;
    permitirConsorcio: boolean;
    createdAt: Date;
    updatedAt: Date;
}
