import { PrismaService } from '../prisma/prisma.service';
import { CreateFornecedorDto, UpdateFornecedorDto, FornecedorResponseDto } from './dto';
export declare class FornecedoresService {
    private prisma;
    constructor(prisma: PrismaService);
    private convertNullToUndefined;
    create(createFornecedorDto: CreateFornecedorDto): Promise<FornecedorResponseDto>;
    findAll(search?: string): Promise<FornecedorResponseDto[]>;
    findOne(id: number): Promise<FornecedorResponseDto>;
    update(id: number, updateFornecedorDto: UpdateFornecedorDto): Promise<FornecedorResponseDto>;
    remove(id: number): Promise<void>;
}
