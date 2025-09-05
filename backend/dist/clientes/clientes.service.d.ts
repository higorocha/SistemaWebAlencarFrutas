import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto, ClienteResponseDto } from './dto';
export declare class ClientesService {
    private prisma;
    constructor(prisma: PrismaService);
    private convertNullToUndefined;
    create(createClienteDto: CreateClienteDto): Promise<ClienteResponseDto>;
    findAll(page?: number, limit?: number, search?: string, status?: string): Promise<{
        data: ClienteResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findActive(): Promise<ClienteResponseDto[]>;
    findOne(id: number): Promise<ClienteResponseDto>;
    update(id: number, updateClienteDto: UpdateClienteDto): Promise<ClienteResponseDto>;
    remove(id: number): Promise<void>;
}
