import { CredenciaisAPIService } from './credenciais-api.service';
import { CreateCredenciaisAPIDto, UpdateCredenciaisAPIDto, CredenciaisAPIResponseDto } from '../config/dto/credenciais-api.dto';
export declare class CredenciaisAPIController {
    private readonly credenciaisAPIService;
    constructor(credenciaisAPIService: CredenciaisAPIService);
    create(createCredenciaisAPIDto: CreateCredenciaisAPIDto): Promise<CredenciaisAPIResponseDto>;
    findAll(contaCorrenteId?: string, banco?: string, modalidadeApi?: string): Promise<CredenciaisAPIResponseDto[]>;
    findOne(id: number): Promise<CredenciaisAPIResponseDto>;
    update(id: number, updateCredenciaisAPIDto: UpdateCredenciaisAPIDto): Promise<CredenciaisAPIResponseDto>;
    remove(id: number): Promise<{
        message: string;
    }>;
    findByContaCorrente(contaCorrenteId: number): Promise<CredenciaisAPIResponseDto[]>;
    findByBancoAndModalidade(banco: string, modalidadeApi: string): Promise<CredenciaisAPIResponseDto[]>;
}
