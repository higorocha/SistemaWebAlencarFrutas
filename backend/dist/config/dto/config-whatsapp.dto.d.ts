export declare class CreateConfigWhatsAppDto {
    phoneNumberId: string;
    accessToken: string;
    businessAccountId?: string;
    verifyToken?: string;
    numeroTelefone: string;
    nomeExibicao: string;
    ativo: boolean;
    webhookUrl?: string;
    configuracoesAdicionais?: Record<string, any>;
}
export declare class UpdateConfigWhatsAppDto extends CreateConfigWhatsAppDto {
}
export declare class ConfigWhatsAppResponseDto extends CreateConfigWhatsAppDto {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}
