import { ConfigWhatsAppService } from './config-whatsapp.service';
import { CreateConfigWhatsAppDto, ConfigWhatsAppResponseDto } from '../config/dto/config-whatsapp.dto';
declare class EnviarMensagemTesteDto {
    numeroDestino: string;
    mensagem: string;
}
export declare class ConfigWhatsAppController {
    private readonly configWhatsAppService;
    constructor(configWhatsAppService: ConfigWhatsAppService);
    findConfigWhatsApp(): Promise<ConfigWhatsAppResponseDto | null>;
    upsertConfigWhatsApp(body: any): Promise<ConfigWhatsAppResponseDto>;
    updateConfigWhatsApp(body: any): Promise<ConfigWhatsAppResponseDto>;
    deleteConfigWhatsApp(): Promise<{
        message: string;
    }>;
    existeConfig(): Promise<{
        exists: boolean;
    }>;
    testarConexao(configDto?: CreateConfigWhatsAppDto): Promise<{
        success: boolean;
        message: string;
    }>;
    testarWhatsApp(body: {
        telefone_teste: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    enviarMensagemTeste(body: EnviarMensagemTesteDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
