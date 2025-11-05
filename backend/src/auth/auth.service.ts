import { Injectable, UnauthorizedException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { TipoLogin } from './dto/login.dto';
import { NivelUsuario } from './dto/register.dto';

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
      include: {
        cultura: true, // Incluir dados da cultura
      },
    });

    if (!usuario) {
      console.log(`❌ [AUTH] Usuário não encontrado para email: ${email}`);
      return null;
    }

    console.log(`✅ [AUTH] Usuário encontrado: ${usuario.nome}`);
    console.log(`🌱 [AUTH] Cultura do usuário:`, usuario.cultura);
    
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

    // Validar se o tipo de usuário pode acessar o tipo de login solicitado
    if (tipoLogin === TipoLogin.WEB && usuario.nivel === 'GERENTE_CULTURA') {
      console.log(`❌ [AUTH] GERENTE_CULTURA não tem acesso ao sistema web: ${email}`);
      throw new UnauthorizedException('Gerentes de Cultura só têm acesso ao aplicativo mobile');
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
      culturaId: usuario.culturaId, // Incluir culturaId no JWT
      tipoLogin: tipoLogin,
      expiracao: this.calcularExpiracao(tipoLogin).toISOString()
    };

    // Calcular duração do JWT
    const duracaoSegundos = this.calcularDuracaoJWT(tipoLogin);

    console.log(`⏰ [AUTH] Token expira em: ${this.calcularExpiracao(tipoLogin).toLocaleString()}`);
    console.log(`📱 [AUTH] Tipo de login: ${tipoLogin}`);

    // Gerar token
    const token = this.jwtService.sign(payload, { expiresIn: duracaoSegundos });
    
    console.log(`✅ [AUTH] Token gerado com sucesso`);
    console.log(`🔑 [AUTH] Token (primeiros 50 caracteres): ${token.substring(0, 50)}...`);
    console.log(`👤 [AUTH] Retornando dados do usuário: ${usuario.nome} (ID: ${usuario.id})`);

    return {
      access_token: token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        nivel: usuario.nivel,
        culturaId: usuario.culturaId, // Incluir culturaId para filtros
        ultimoAcesso: new Date(), // Adicionar último acesso atualizado
        cultura: usuario.cultura, // Incluir dados da cultura
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
    nivel?: NivelUsuario;
    culturaId?: number;
  }) {
    // Validar culturaId se necessário
    if (data.nivel) {
      await this.validarCulturaId(data.nivel, data.culturaId);
    }

    const hashedPassword = await bcrypt.hash(data.senha, 10);

    return this.prisma.usuario.create({
      data: {
        ...data,
        senha: hashedPassword,
        nivel: data.nivel || NivelUsuario.ESCRITORIO,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        nivel: true,
        culturaId: true,
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

  /**
   * Valida se culturaId é obrigatório para GERENTE_CULTURA e se a cultura existe
   */
  private async validarCulturaId(nivel: NivelUsuario, culturaId?: number): Promise<void> {
    if (nivel === NivelUsuario.GERENTE_CULTURA) {
      if (!culturaId) {
        throw new BadRequestException('culturaId é obrigatório para usuários do tipo GERENTE_CULTURA');
      }

      // Verificar se a cultura existe
      const culturaExiste = await this.prisma.cultura.findUnique({
        where: { id: culturaId },
      });

      if (!culturaExiste) {
        throw new NotFoundException(`Cultura com ID ${culturaId} não encontrada`);
      }
    }
  }

  async findAllUsers(): Promise<UserResponseDto[]> {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        cpf: true,
        email: true,
        nivel: true,
        culturaId: true,
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
        culturaId: true,
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
      // Validar culturaId se necessário
      await this.validarCulturaId(createUserDto.nivel, createUserDto.culturaId);

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
          culturaId: true,
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
      // Validar culturaId se o nível estiver sendo atualizado
      if (updateUserDto.nivel) {
        await this.validarCulturaId(updateUserDto.nivel, updateUserDto.culturaId);
      }

      return await this.prisma.usuario.update({
        where: { id },
        data: updateUserDto,
        select: {
          id: true,
          nome: true,
          cpf: true,
          email: true,
          nivel: true,
          culturaId: true,
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