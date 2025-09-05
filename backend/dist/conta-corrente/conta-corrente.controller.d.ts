import { ContaCorrenteService } from './conta-corrente.service';
import { CreateContaCorrenteDto, UpdateContaCorrenteDto, ContaCorrenteResponseDto } from '../config/dto/conta-corrente.dto';
export declare class ContaCorrenteController {
    private contaCorrenteService;
    constructor(contaCorrenteService: ContaCorrenteService);
    findAll(): Promise<ContaCorrenteResponseDto[]>;
    findOne(id: number): Promise<ContaCorrenteResponseDto>;
    create(createContaCorrenteDto: CreateContaCorrenteDto): Promise<ContaCorrenteResponseDto>;
    update(id: number, updateContaCorrenteDto: UpdateContaCorrenteDto): Promise<ContaCorrenteResponseDto>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
