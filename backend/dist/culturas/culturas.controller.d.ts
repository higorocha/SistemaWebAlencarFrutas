import { CulturasService } from './culturas.service';
import { CreateCulturaDto, UpdateCulturaDto, CulturaResponseDto } from './dto';
export declare class CulturasController {
    private readonly culturasService;
    constructor(culturasService: CulturasService);
    create(createCulturaDto: CreateCulturaDto): Promise<CulturaResponseDto>;
    findAll(): Promise<CulturaResponseDto[]>;
    findOne(id: string): Promise<CulturaResponseDto>;
    update(id: string, updateCulturaDto: UpdateCulturaDto): Promise<CulturaResponseDto>;
    remove(id: string): Promise<void>;
}
