import { PrismaService } from '../prisma/prisma.service';
import { CreateCredenciaisAPIDto, UpdateCredenciaisAPIDto, CredenciaisAPIResponseDto } from '../config/dto/credenciais-api.dto';
export declare class CredenciaisAPIService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<CredenciaisAPIResponseDto[]>;
    findOne(id: number): Promise<CredenciaisAPIResponseDto>;
    findByContaCorrente(contaCorrenteId: number): Promise<CredenciaisAPIResponseDto[]>;
    create(createCredenciaisAPIDto: CreateCredenciaisAPIDto): Promise<CredenciaisAPIResponseDto>;
    update(id: number, updateCredenciaisAPIDto: UpdateCredenciaisAPIDto): Promise<CredenciaisAPIResponseDto>;
    remove(id: number): Promise<{
        message: string;
    }>;
    findByBancoAndModalidade(banco: string, modalidadeApi: string): Promise<CredenciaisAPIResponseDto[]>;
}
