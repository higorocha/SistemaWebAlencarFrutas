import { ConfigEmailService } from './config-email.service';
import { CreateConfigEmailDto, UpdateConfigEmailDto, ConfigEmailResponseDto } from '../config/dto/config-email.dto';
export declare class ConfigEmailController {
    private readonly configEmailService;
    constructor(configEmailService: ConfigEmailService);
    findConfigEmail(): Promise<ConfigEmailResponseDto | null>;
    upsertConfigEmail(configDto: CreateConfigEmailDto): Promise<ConfigEmailResponseDto>;
    updateConfigEmail(configDto: UpdateConfigEmailDto): Promise<ConfigEmailResponseDto>;
    deleteConfigEmail(): Promise<{
        message: string;
    }>;
    existeConfig(): Promise<{
        exists: boolean;
    }>;
    testarConexao(configDto?: CreateConfigEmailDto): Promise<{
        success: boolean;
        message: string;
    }>;
    testarEmail(body: {
        emailTeste: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
