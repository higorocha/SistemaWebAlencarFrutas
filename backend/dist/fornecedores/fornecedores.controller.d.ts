import { FornecedoresService } from './fornecedores.service';
import { CreateFornecedorDto, UpdateFornecedorDto, FornecedorResponseDto } from './dto';
export declare class FornecedoresController {
    private readonly fornecedoresService;
    constructor(fornecedoresService: FornecedoresService);
    create(createFornecedorDto: CreateFornecedorDto): Promise<FornecedorResponseDto>;
    findAll(search?: string): Promise<FornecedorResponseDto[]>;
    findOne(id: string): Promise<FornecedorResponseDto>;
    update(id: string, updateFornecedorDto: UpdateFornecedorDto): Promise<FornecedorResponseDto>;
    remove(id: string): Promise<void>;
}
