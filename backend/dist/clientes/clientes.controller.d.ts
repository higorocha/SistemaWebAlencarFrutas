import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto, ClienteResponseDto } from './dto';
export declare class ClientesController {
    private readonly clientesService;
    constructor(clientesService: ClientesService);
    create(createClienteDto: CreateClienteDto): Promise<ClienteResponseDto>;
    findAll(page?: number, limit?: number, search?: string, status?: string): Promise<{
        data: ClienteResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findActive(): Promise<ClienteResponseDto[]>;
    findOne(id: string): Promise<ClienteResponseDto>;
    update(id: string, updateClienteDto: UpdateClienteDto): Promise<ClienteResponseDto>;
    remove(id: string): Promise<void>;
}
