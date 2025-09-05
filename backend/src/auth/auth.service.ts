import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { TipoLogin } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, senha: string) {
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

  /**
   * Calcula a data de expiração baseada no tipo de login
   * @param tipoLogin - Tipo de login (web ou mobile)
   * @returns Data de expiração
   */
  private calcularExpiracao(tipoLogin: TipoLogin = TipoLogin.WEB): Date {
    const agora = new Date();
    
    switch (tipoLogin) {
      case TipoLogin.WEB:
        // Token válido até 23:59 do dia atual
        const fimDoDia = new Date(agora);
        fimDoDia.setHours(23, 59, 59, 999);
        return fimDoDia;
        
      case TipoLogin.MOBILE:
        // Token válido por 30 dias (para app mobile)
        const trintaDias = new Date(agora);
        trintaDias.setDate(agora.getDate() + 30);
        return trintaDias;
        
      default:
        // Fallback para web
        const fimDoDiaDefault = new Date(agora);
        fimDoDiaDefault.setHours(23, 59, 59, 999);
        return fimDoDiaDefault;
    }
  }

  /**
   * Calcula a duração em segundos para o JWT
   * @param tipoLogin - Tipo de login
   * @returns Duração em segundos
   */
  private calcularDuracaoJWT(tipoLogin: TipoLogin = TipoLogin.WEB): number {
    const expiracao = this.calcularExpiracao(tipoLogin);
    const agora = new Date();
    return Math.floor((expiracao.getTime() - agora.getTime()) / 1000);
  }

  async login(email: string, senha: string, tipoLogin: TipoLogin = TipoLogin.WEB) {
    console.log(`🚀 [AUTH] Iniciando login para: ${email} (${tipoLogin})`);
    
    const usuario = await this.validateUser(email, senha);
    
    if (!usuario) {
      console.log(`❌ [AUTH] Login falhou para: ${email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Atualizar último acesso
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

    // Calcular duração do JWT
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
        ultimoAcesso: new Date(), // Adicionar último acesso atualizado
      },
      expiracao: this.calcularExpiracao(tipoLogin).toISOString(),
      tipoLogin: tipoLogin,
    };
  }

  async createUserLegacy(data: {
    nome: string;
    cpf: string;
    email: string;
    senha: string;
    nivel?: 'ADMINISTRADOR' | 'USUARIO' | 'CONVIDADO';
  }) {
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

  async updatePassword(email: string, novaSenha: string) {
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

  // ===========================================
  // MÉTODOS DE GERENCIAMENTO DE USUÁRIOS
  // ===========================================

  async findAllUsers(): Promise<UserResponseDto[]> {
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

  async findUserById(id: number): Promise<UserResponseDto> {
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
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
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
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email ou CPF já cadastrado');
      }
      throw error;
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
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
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Usuário não encontrado');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Email ou CPF já cadastrado');
      }
      throw error;
    }
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    try {
      await this.prisma.usuario.delete({
        where: { id },
      });
      
      return { message: 'Usuário deletado com sucesso' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Usuário não encontrado');
      }
      throw error;
    }
  }
} 