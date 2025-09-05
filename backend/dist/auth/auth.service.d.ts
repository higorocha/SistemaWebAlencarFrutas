import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { TipoLogin } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(email: string, senha: string): Promise<{
        email: string;
        nome: string;
        cpf: string;
        nivel: import(".prisma/client").$Enums.NivelUsuario;
        id: number;
        dataCadastro: Date;
        ultimoAcesso: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    private calcularExpiracao;
    private calcularDuracaoJWT;
    login(email: string, senha: string, tipoLogin?: TipoLogin): Promise<{
        access_token: string;
        usuario: {
            id: number;
            nome: string;
            email: string;
            nivel: import(".prisma/client").$Enums.NivelUsuario;
            ultimoAcesso: Date;
        };
        expiracao: string;
        tipoLogin: TipoLogin;
    }>;
    createUserLegacy(data: {
        nome: string;
        cpf: string;
        email: string;
        senha: string;
        nivel?: 'ADMINISTRADOR' | 'USUARIO' | 'CONVIDADO';
    }): Promise<{
        email: string;
        nome: string;
        cpf: string;
        nivel: import(".prisma/client").$Enums.NivelUsuario;
        id: number;
        dataCadastro: Date;
        createdAt: Date;
    }>;
    updatePassword(email: string, novaSenha: string): Promise<{
        email: string;
        nome: string;
        nivel: import(".prisma/client").$Enums.NivelUsuario;
        id: number;
    }>;
    findAllUsers(): Promise<UserResponseDto[]>;
    findUserById(id: number): Promise<UserResponseDto>;
    createUser(createUserDto: CreateUserDto): Promise<UserResponseDto>;
    updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto>;
    deleteUser(id: number): Promise<{
        message: string;
    }>;
}
