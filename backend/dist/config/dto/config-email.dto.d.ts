export declare class CreateConfigEmailDto {
    servidorSMTP: string;
    porta: number;
    emailEnvio: string;
    nomeExibicao: string;
    usuario: string;
    senha: string;
    metodoAutenticacao: string;
    timeoutConexao: number;
    usarSSL: boolean;
}
export declare class UpdateConfigEmailDto extends CreateConfigEmailDto {
}
export declare class ConfigEmailResponseDto extends CreateConfigEmailDto {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}
