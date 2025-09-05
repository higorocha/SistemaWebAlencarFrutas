import { FrutasService } from './frutas.service';
import { CreateFrutaDto, UpdateFrutaDto, FrutaResponseDto } from './dto';
export declare class FrutasController {
    private readonly frutasService;
    constructor(frutasService: FrutasService);
    create(createFrutaDto: CreateFrutaDto): Promise<FrutaResponseDto>;
    findAll(page?: number, limit?: number, search?: string, categoria?: string, status?: string): Promise<{
        data: FrutaResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findActive(): Promise<FrutaResponseDto[]>;
    findOne(id: string): Promise<FrutaResponseDto>;
    update(id: string, updateFrutaDto: UpdateFrutaDto): Promise<FrutaResponseDto>;
    remove(id: string): Promise<void>;
}
