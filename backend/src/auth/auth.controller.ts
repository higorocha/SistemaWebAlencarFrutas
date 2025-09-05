import { 
  Controller, 
  Post, 
  Get,
  Put,
  Delete,
  Body, 
  Param,
  HttpCode, 
  HttpStatus,
  ConflictException,
  UnauthorizedException,
  ParseIntPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { 
  LoginDto, 
  RegisterDto, 
  UpdatePasswordDto,
  CreateUserDto,
  UpdateUserDto,
  NivelUsuario,
  TipoLogin
} from './dto';
import { 
  LoginResponseDto, 
  RegisterResponseDto, 
  UpdatePasswordResponseDto 
} from './responses/auth.responses';
import { UserResponseDto } from './dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 tentativas por minuto
  @ApiOperation({ 
    summary: 'Autenticar usuário',
    description: 'Realiza login do usuário com email e senha, retornando token JWT'
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ 
    description: 'Login realizado com sucesso',
    type: LoginResponseDto 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Credenciais inválidas' 
  })
  @ApiBadRequestResponse({ 
    description: 'Dados de entrada inválidos' 
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      return await this.authService.login(
        loginDto.email, 
        loginDto.senha, 
        loginDto.tipoLogin || TipoLogin.WEB
      );
    } catch (error) {
      // Se já é um UnauthorizedException, apenas re-lança
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Para outros erros, lança como credenciais inválidas
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }

  @Post('register')
  @SkipThrottle() // Não aplicar rate limiting no registro
  @ApiOperation({ 
    summary: 'Cadastrar novo usuário',
    description: 'Cria um novo usuário no sistema'
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ 
    description: 'Usuário criado com sucesso',
    type: RegisterResponseDto 
  })
  @ApiBadRequestResponse({ 
    description: 'Dados de entrada inválidos' 
  })
  @ApiConflictResponse({ 
    description: 'Email ou CPF já cadastrado' 
  })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    try {
      return await this.authService.createUserLegacy(registerDto);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email ou CPF já cadastrado');
      }
      throw error;
    }
  }

  @Post('update-password')
  @SkipThrottle() // Não aplicar rate limiting na atualização de senha
  @ApiOperation({ 
    summary: 'Atualizar senha',
    description: 'Atualiza a senha de um usuário existente'
  })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiOkResponse({ 
    description: 'Senha atualizada com sucesso',
    type: UpdatePasswordResponseDto 
  })
  @ApiBadRequestResponse({ 
    description: 'Dados de entrada inválidos' 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Usuário não encontrado' 
  })
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto): Promise<UpdatePasswordResponseDto> {
    try {
      return await this.authService.updatePassword(updatePasswordDto.email, updatePasswordDto.novaSenha);
    } catch (error) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
  }

  // ===========================================
  // ROTAS DE GERENCIAMENTO DE USUÁRIOS
  // ===========================================

  @Get('users')
  @SkipThrottle() // Não aplicar rate limiting em rotas administrativas
  @ApiOperation({ 
    summary: 'Listar todos os usuários',
    description: 'Retorna lista de todos os usuários do sistema'
  })
  @ApiOkResponse({ 
    description: 'Lista de usuários',
    type: [UserResponseDto]
  })
  async findAllUsers(): Promise<UserResponseDto[]> {
    return await this.authService.findAllUsers();
  }

  @Get('users/:id')
  @SkipThrottle()
  @ApiOperation({ 
    summary: 'Buscar usuário por ID',
    description: 'Retorna dados de um usuário específico'
  })
  @ApiOkResponse({ 
    description: 'Dados do usuário',
    type: UserResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'ID inválido' 
  })
  async findUserById(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return await this.authService.findUserById(id);
  }

  @Post('users')
  @SkipThrottle()
  @ApiOperation({ 
    summary: 'Criar novo usuário (Admin)',
    description: 'Cria um novo usuário no sistema (apenas administradores)'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ 
    description: 'Usuário criado com sucesso',
    type: UserResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Dados de entrada inválidos' 
  })
  @ApiConflictResponse({ 
    description: 'Email ou CPF já cadastrado' 
  })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return await this.authService.createUser(createUserDto);
  }

  @Put('users/:id')
  @SkipThrottle()
  @ApiOperation({ 
    summary: 'Atualizar usuário',
    description: 'Atualiza dados de um usuário existente'
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ 
    description: 'Usuário atualizado com sucesso',
    type: UserResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Dados de entrada inválidos' 
  })
  @ApiConflictResponse({ 
    description: 'Email ou CPF já cadastrado' 
  })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return await this.authService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  @SkipThrottle()
  @ApiOperation({ 
    summary: 'Deletar usuário',
    description: 'Remove um usuário do sistema'
  })
  @ApiOkResponse({ 
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
  })
  @ApiBadRequestResponse({ 
    description: 'ID inválido' 
  })
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return await this.authService.deleteUser(id);
  }
} 