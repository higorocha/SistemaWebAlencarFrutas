import { PrismaService } from '../prisma/prisma.service';
import { CreateConfigEmailDto, UpdateConfigEmailDto, ConfigEmailResponseDto } from '../config/dto/config-email.dto';
export declare class ConfigEmailService {
    private prisma;
    constructor(prisma: PrismaService);
    private isEncrypted;
    private ensurePasswordEncrypted;
    findConfigEmail(): Promise<ConfigEmailResponseDto | null>;
    upsertConfigEmail(configDto: CreateConfigEmailDto | UpdateConfigEmailDto): Promise<ConfigEmailResponseDto>;
    deleteConfigEmail(): Promise<{
        message: string;
    }>;
    existeConfig(): Promise<boolean>;
    testarConexao(configDto?: CreateConfigEmailDto): Promise<{
        success: boolean;
        message: string;
    }>;
    enviarEmailTeste(emailDestino: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
