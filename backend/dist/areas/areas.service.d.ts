import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto } from './dto';
export declare class AreasService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createAreaDto: CreateAreaDto): Promise<AreaResponseDto>;
    findAll(): Promise<AreaResponseDto[]>;
    findOne(id: number): Promise<AreaResponseDto>;
    update(id: number, updateAreaDto: UpdateAreaDto): Promise<AreaResponseDto>;
    remove(id: number): Promise<void>;
    private mapToResponseDto;
}
