import { PrismaService } from '../prisma/prisma.service';
import { CreateFrutaDto, UpdateFrutaDto, FrutaResponseDto } from './dto';
export declare class FrutasService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createFrutaDto: CreateFrutaDto): Promise<FrutaResponseDto>;
    findAll(page?: number, limit?: number, search?: string, categoria?: string, status?: string): Promise<{
        data: FrutaResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<FrutaResponseDto>;
    update(id: number, updateFrutaDto: UpdateFrutaDto): Promise<FrutaResponseDto>;
    remove(id: number): Promise<void>;
    findActive(): Promise<FrutaResponseDto[]>;
    private mapToResponseDto;
}
