"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
const login_dto_1 = require("./dto/login.dto");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateUser(email, senha) {
        console.log(`🔍 [AUTH] Tentativa de login para email: ${email}`);
        const usuario = await this.prisma.usuario.findUnique({
            where: { email },
        });
        if (!usuario) {
            console.log(`❌ [AUTH] Usuário não encontrado para email: ${email}`);
            return null;
        }
        console.log(`✅ [AUTH] Usuário encontrado: ${usuario.nome}`);
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        console.log(`🔐 [AUTH] Senha válida: ${senhaValida}`);
        if (senhaValida) {
            const { senha: _, ...result } = usuario;
            return result;
        }
        console.log(`❌ [AUTH] Senha inválida para usuário: ${usuario.nome}`);
        return null;
    }
    calcularExpiracao(tipoLogin = login_dto_1.TipoLogin.WEB) {
        const agora = new Date();
        switch (tipoLogin) {
            case login_dto_1.TipoLogin.WEB:
                const fimDoDia = new Date(agora);
                fimDoDia.setHours(23, 59, 59, 999);
                return fimDoDia;
            case login_dto_1.TipoLogin.MOBILE:
                const trintaDias = new Date(agora);
                trintaDias.setDate(agora.getDate() + 30);
                return trintaDias;
            default:
                const fimDoDiaDefault = new Date(agora);
                fimDoDiaDefault.setHours(23, 59, 59, 999);
                return fimDoDiaDefault;
        }
    }
    calcularDuracaoJWT(tipoLogin = login_dto_1.TipoLogin.WEB) {
        const expiracao = this.calcularExpiracao(tipoLogin);
        const agora = new Date();
        return Math.floor((expiracao.getTime() - agora.getTime()) / 1000);
    }
    async login(email, senha, tipoLogin = login_dto_1.TipoLogin.WEB) {
        console.log(`🚀 [AUTH] Iniciando login para: ${email} (${tipoLogin})`);
        const usuario = await this.validateUser(email, senha);
        if (!usuario) {
            console.log(`❌ [AUTH] Login falhou para: ${email}`);
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        await this.prisma.usuario.update({
            where: { id: usuario.id },
            data: { ultimoAcesso: new Date() },
        });
        const payload = {
            sub: usuario.id,
            email: usuario.email,
            nivel: usuario.nivel,
            tipoLogin: tipoLogin,
            expiracao: this.calcularExpiracao(tipoLogin).toISOString()
        };
        const duracaoSegundos = this.calcularDuracaoJWT(tipoLogin);
        console.log(`⏰ [AUTH] Token expira em: ${this.calcularExpiracao(tipoLogin).toLocaleString()}`);
        console.log(`📱 [AUTH] Tipo de login: ${tipoLogin}`);
        return {
            access_token: this.jwtService.sign(payload, { expiresIn: duracaoSegundos }),
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                nivel: usuario.nivel,
                ultimoAcesso: new Date(),
            },
            expiracao: this.calcularExpiracao(tipoLogin).toISOString(),
            tipoLogin: tipoLogin,
        };
    }
    async createUserLegacy(data) {
        const hashedPassword = await bcrypt.hash(data.senha, 10);
        return this.prisma.usuario.create({
            data: {
                ...data,
                senha: hashedPassword,
                nivel: data.nivel || 'USUARIO',
            },
            select: {
                id: true,
                nome: true,
                email: true,
                cpf: true,
                nivel: true,
                dataCadastro: true,
                createdAt: true,
            },
        });
    }
    async updatePassword(email, novaSenha) {
        const hashedPassword = await bcrypt.hash(novaSenha, 10);
        return this.prisma.usuario.update({
            where: { email },
            data: { senha: hashedPassword },
            select: {
                id: true,
                nome: true,
                email: true,
                nivel: true,
            },
        });
    }
    async findAllUsers() {
        return this.prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                cpf: true,
                email: true,
                nivel: true,
                dataCadastro: true,
                ultimoAcesso: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findUserById(id) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                cpf: true,
                email: true,
                nivel: true,
                dataCadastro: true,
                ultimoAcesso: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!usuario) {
            throw new common_1.NotFoundException('Usuário não encontrado');
        }
        return usuario;
    }
    async createUser(createUserDto) {
        try {
            const hashedPassword = await bcrypt.hash(createUserDto.senha, 10);
            return await this.prisma.usuario.create({
                data: {
                    ...createUserDto,
                    senha: hashedPassword,
                },
                select: {
                    id: true,
                    nome: true,
                    cpf: true,
                    email: true,
                    nivel: true,
                    dataCadastro: true,
                    ultimoAcesso: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Email ou CPF já cadastrado');
            }
            throw error;
        }
    }
    async updateUser(id, updateUserDto) {
        try {
            return await this.prisma.usuario.update({
                where: { id },
                data: updateUserDto,
                select: {
                    id: true,
                    nome: true,
                    cpf: true,
                    email: true,
                    nivel: true,
                    dataCadastro: true,
                    ultimoAcesso: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Usuário não encontrado');
            }
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Email ou CPF já cadastrado');
            }
            throw error;
        }
    }
    async deleteUser(id) {
        try {
            await this.prisma.usuario.delete({
                where: { id },
            });
            return { message: 'Usuário deletado com sucesso' };
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Usuário não encontrado');
            }
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map