import { PrismaService } from '../prisma/prisma.service';
import { CreateConfigWhatsAppDto, UpdateConfigWhatsAppDto, ConfigWhatsAppResponseDto } from '../config/dto/config-whatsapp.dto';
export declare class ConfigWhatsAppService {
    private prisma;
    constructor(prisma: PrismaService);
    private convertToResponseDto;
    private convertToPrismaInput;
    findConfigWhatsApp(): Promise<ConfigWhatsAppResponseDto | null>;
    upsertConfigWhatsApp(configDto: CreateConfigWhatsAppDto | UpdateConfigWhatsAppDto): Promise<ConfigWhatsAppResponseDto>;
    deleteConfigWhatsApp(): Promise<{
        message: string;
    }>;
    existeConfig(): Promise<boolean>;
    testarConexao(configDto?: CreateConfigWhatsAppDto): Promise<{
        success: boolean;
        message: string;
    }>;
    enviarMensagemTeste(numeroDestino: string, mensagem: string, configDto?: CreateConfigWhatsAppDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
