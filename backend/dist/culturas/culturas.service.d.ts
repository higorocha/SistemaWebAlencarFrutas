import { PrismaService } from '../prisma/prisma.service';
import { CreateCulturaDto, UpdateCulturaDto, CulturaResponseDto } from './dto';
export declare class CulturasService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createCulturaDto: CreateCulturaDto): Promise<CulturaResponseDto>;
    findAll(): Promise<CulturaResponseDto[]>;
    findOne(id: number): Promise<CulturaResponseDto>;
    update(id: number, updateCulturaDto: UpdateCulturaDto): Promise<CulturaResponseDto>;
    remove(id: number): Promise<void>;
    private mapToResponseDto;
}
