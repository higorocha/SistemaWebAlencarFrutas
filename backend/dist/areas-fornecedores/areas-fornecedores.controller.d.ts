import { AreasFornecedoresService } from './areas-fornecedores.service';
import { CreateAreaFornecedorDto, UpdateAreaFornecedorDto, AreaFornecedorResponseDto } from './dto';
export declare class AreasFornecedoresController {
    private readonly areasFornecedoresService;
    constructor(areasFornecedoresService: AreasFornecedoresService);
    create(createAreaFornecedorDto: CreateAreaFornecedorDto): Promise<AreaFornecedorResponseDto>;
    findAll(): Promise<AreaFornecedorResponseDto[]>;
    findByFornecedor(fornecedorId: string): Promise<AreaFornecedorResponseDto[]>;
    findOne(id: string): Promise<AreaFornecedorResponseDto>;
    update(id: string, updateAreaFornecedorDto: UpdateAreaFornecedorDto): Promise<AreaFornecedorResponseDto>;
    remove(id: string): Promise<void>;
}
