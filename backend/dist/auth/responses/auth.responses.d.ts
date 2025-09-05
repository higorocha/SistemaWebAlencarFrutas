import { TipoLogin } from '../dto/login.dto';
export declare class LoginResponseDto {
    access_token: string;
    usuario: {
        id: number;
        nome: string;
        email: string;
        nivel: string;
        ultimoAcesso: Date;
    };
    expiracao: string;
    tipoLogin: TipoLogin;
}
export declare class RegisterResponseDto {
    id: number;
    nome: string;
    email: string;
    cpf: string;
    nivel: string;
    dataCadastro: Date;
    createdAt: Date;
}
export declare class UpdatePasswordResponseDto {
    id: number;
    nome: string;
    email: string;
    nivel: string;
}
