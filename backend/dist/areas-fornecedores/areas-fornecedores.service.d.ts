import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaFornecedorDto, UpdateAreaFornecedorDto, AreaFornecedorResponseDto } from './dto';
export declare class AreasFornecedoresService {
    private prisma;
    constructor(prisma: PrismaService);
    private convertNullToUndefined;
    create(createAreaFornecedorDto: CreateAreaFornecedorDto): Promise<AreaFornecedorResponseDto>;
    findAll(): Promise<AreaFornecedorResponseDto[]>;
    findByFornecedor(fornecedorId: number): Promise<AreaFornecedorResponseDto[]>;
    findOne(id: number): Promise<AreaFornecedorResponseDto>;
    update(id: number, updateAreaFornecedorDto: UpdateAreaFornecedorDto): Promise<AreaFornecedorResponseDto>;
    remove(id: number): Promise<void>;
}
