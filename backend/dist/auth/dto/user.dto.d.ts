import { NivelUsuario } from './register.dto';
export declare class CreateUserDto {
    nome: string;
    cpf: string;
    email: string;
    senha: string;
    nivel: NivelUsuario;
}
export declare class UpdateUserDto {
    nome?: string;
    cpf?: string;
    email?: string;
    nivel?: NivelUsuario;
}
export declare class UserResponseDto {
    id: number;
    nome: string;
    cpf: string;
    email: string;
    nivel: string;
    dataCadastro: Date;
    ultimoAcesso?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
