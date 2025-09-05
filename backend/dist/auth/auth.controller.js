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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
const auth_responses_1 = require("./responses/auth.responses");
const dto_2 = require("./dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto) {
        try {
            return await this.authService.login(loginDto.email, loginDto.senha, loginDto.tipoLogin || dto_1.TipoLogin.WEB);
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
    }
    async register(registerDto) {
        try {
            return await this.authService.createUserLegacy(registerDto);
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Email ou CPF já cadastrado');
            }
            throw error;
        }
    }
    async updatePassword(updatePasswordDto) {
        try {
            return await this.authService.updatePassword(updatePasswordDto.email, updatePasswordDto.novaSenha);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Usuário não encontrado');
        }
    }
    async findAllUsers() {
        return await this.authService.findAllUsers();
    }
    async findUserById(id) {
        return await this.authService.findUserById(id);
    }
    async createUser(createUserDto) {
        return await this.authService.createUser(createUserDto);
    }
    async updateUser(id, updateUserDto) {
        return await this.authService.updateUser(id, updateUserDto);
    }
    async deleteUser(id) {
        return await this.authService.deleteUser(id);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({
        summary: 'Autenticar usuário',
        description: 'Realiza login do usuário com email e senha, retornando token JWT'
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.LoginDto }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Login realizado com sucesso',
        type: auth_responses_1.LoginResponseDto
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Credenciais inválidas'
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Dados de entrada inválidos'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, throttler_1.SkipThrottle)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Cadastrar novo usuário',
        description: 'Cria um novo usuário no sistema'
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.RegisterDto }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Usuário criado com sucesso',
        type: auth_responses_1.RegisterResponseDto
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Dados de entrada inválidos'
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'Email ou CPF já cadastrado'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('update-password'),
    (0, throttler_1.SkipThrottle)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Atualizar senha',
        description: 'Atualiza a senha de um usuário existente'
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.UpdatePasswordDto }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Senha atualizada com sucesso',
        type: auth_responses_1.UpdatePasswordResponseDto
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Dados de entrada inválidos'
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Usuário não encontrado'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.UpdatePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updatePassword", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, throttler_1.SkipThrottle)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar todos os usuários',
        description: 'Retorna lista de todos os usuários do sistema'
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Lista de usuários',
        type: [dto_2.UserResponseDto]
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "findAllUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, throttler_1.SkipThrottle)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar usuário por ID',
        description: 'Retorna dados de um usuário específico'
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Dados do usuário',
        type: dto_2.UserResponseDto
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'ID inválido'
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "findUserById", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, throttler_1.SkipThrottle)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Criar novo usuário (Admin)',
        description: 'Cria um novo usuário no sistema (apenas administradores)'
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.CreateUserDto }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Usuário criado com sucesso',
        type: dto_2.UserResponseDto
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Dados de entrada inválidos'
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'Email ou CPF já cadastrado'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    (0, throttler_1.SkipThrottle)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Atualizar usuário',
        description: 'Atualiza dados de um usuário existente'
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.UpdateUserDto }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Usuário atualizado com sucesso',
        type: dto_2.UserResponseDto
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Dados de entrada inválidos'
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'Email ou CPF já cadastrado'
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, throttler_1.SkipThrottle)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Deletar usuário',
        description: 'Remove um usuário do sistema'
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Usuário deletado com sucesso',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Usuário deletado com sucesso'
                }
            }
        }
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'ID inválido'
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "deleteUser", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Autenticação'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map