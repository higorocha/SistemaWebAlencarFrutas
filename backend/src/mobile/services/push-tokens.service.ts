import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePushTokenDto, PushTokenResponseDto } from '../dto';

@Injectable()
export class PushTokensService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra ou atualiza um token de push para um usuário
   */
  async registerToken(
    userId: number,
    createPushTokenDto: CreatePushTokenDto,
  ): Promise<PushTokenResponseDto> {
    console.log(`[Push Token] Registrando token para usuário ${userId}, plataforma: ${createPushTokenDto.platform}`);
    console.log(`[Push Token] Token (primeiros 20 chars): ${createPushTokenDto.token.substring(0, 20)}...`);
    
    // Verificar se o token já existe
    const existingToken = await this.prisma.pushToken.findUnique({
      where: { token: createPushTokenDto.token },
    });

    if (existingToken) {
      console.log(`[Push Token] Token já existe. Usuário atual: ${existingToken.usuarioId}, ativo: ${existingToken.ativo}`);
      
      // Se o token existe mas pertence a outro usuário, atualizar
      if (existingToken.usuarioId !== userId) {
        console.log(`[Push Token] Token pertence a outro usuário, atualizando para usuário ${userId}`);
        const updated = await this.prisma.pushToken.update({
          where: { token: createPushTokenDto.token },
          data: {
            usuarioId: userId,
            platform: createPushTokenDto.platform,
            deviceId: createPushTokenDto.deviceId,
            ativo: true,
            updatedAt: new Date(),
          },
        });
        console.log(`[Push Token] Token atualizado com sucesso para usuário ${userId}`);
        return this.mapToResponseDto(updated);
      }

      // Se já existe para este usuário, apenas atualizar
      console.log(`[Push Token] Token já existe para este usuário, reativando se necessário`);
      const updated = await this.prisma.pushToken.update({
        where: { token: createPushTokenDto.token },
        data: {
          platform: createPushTokenDto.platform,
          deviceId: createPushTokenDto.deviceId,
          ativo: true,
          updatedAt: new Date(),
        },
      });
      console.log(`[Push Token] Token atualizado - ativo: ${updated.ativo}`);
      return this.mapToResponseDto(updated);
    }

    // Criar novo token
    console.log(`[Push Token] Criando novo token para usuário ${userId}`);
    const newToken = await this.prisma.pushToken.create({
      data: {
        token: createPushTokenDto.token,
        usuarioId: userId,
        platform: createPushTokenDto.platform,
        deviceId: createPushTokenDto.deviceId,
        ativo: true,
      },
    });

    console.log(`[Push Token] Token criado com sucesso - ID: ${newToken.id}, ativo: ${newToken.ativo}`);
    return this.mapToResponseDto(newToken);
  }

  /**
   * Remove um token de push
   */
  async removeToken(token: string): Promise<void> {
    const pushToken = await this.prisma.pushToken.findUnique({
      where: { token },
    });

    if (!pushToken) {
      throw new NotFoundException('Token de push não encontrado');
    }

    await this.prisma.pushToken.delete({
      where: { token },
    });
  }

  /**
   * Desativa todos os tokens de um usuário (logout)
   */
  async deactivateUserTokens(userId: number): Promise<void> {
    await this.prisma.pushToken.updateMany({
      where: { usuarioId: userId, ativo: true },
      data: { ativo: false },
    });
  }

  /**
   * Busca todos os tokens ativos de um usuário
   */
  async getActiveTokensByUserId(userId: number): Promise<string[]> {
    const tokens = await this.prisma.pushToken.findMany({
      where: {
        usuarioId: userId,
        ativo: true,
      },
      select: {
        token: true,
      },
    });

    return tokens.map((t) => t.token);
  }

  /**
   * Busca todos os tokens ativos de múltiplos usuários
   */
  async getActiveTokensByUserIds(userIds: number[]): Promise<Map<number, string[]>> {
    console.log(`[Push Token] Buscando tokens ativos para usuários: ${userIds.join(', ')}`);
    
    const tokens = await this.prisma.pushToken.findMany({
      where: {
        usuarioId: { in: userIds },
        ativo: true,
      },
      select: {
        token: true,
        usuarioId: true,
        platform: true,
        ativo: true,
      },
    });

    console.log(`[Push Token] Encontrados ${tokens.length} token(s) ativo(s) no banco`);

    const tokensMap = new Map<number, string[]>();
    for (const token of tokens) {
      const userTokens = tokensMap.get(token.usuarioId) || [];
      userTokens.push(token.token);
      tokensMap.set(token.usuarioId, userTokens);
      console.log(`[Push Token] Token para usuário ${token.usuarioId} (${token.platform}): ${token.token.substring(0, 20)}...`);
    }

    console.log(`[Push Token] Mapa final: ${tokensMap.size} usuário(s) com tokens`);
    return tokensMap;
  }

  /**
   * Retorna informações de diagnóstico sobre tokens do usuário
   */
  async getDiagnostico(userId: number): Promise<any> {
    const todosTokens = await this.prisma.pushToken.findMany({
      where: {
        usuarioId: userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const tokensAtivos = todosTokens.filter(t => t.ativo);
    const tokensInativos = todosTokens.filter(t => !t.ativo);

    return {
      usuarioId: userId,
      totalTokens: todosTokens.length,
      tokensAtivos: tokensAtivos.length,
      tokensInativos: tokensInativos.length,
      tokens: todosTokens.map(t => ({
        id: t.id,
        platform: t.platform,
        deviceId: t.deviceId,
        ativo: t.ativo,
        tokenPreview: t.token.substring(0, 20) + '...',
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    };
  }

  /**
   * Mapeia o modelo Prisma para DTO de resposta
   */
  private mapToResponseDto(pushToken: any): PushTokenResponseDto {
    return {
      id: pushToken.id,
      token: pushToken.token,
      platform: pushToken.platform,
      deviceId: pushToken.deviceId || undefined,
      ativo: pushToken.ativo,
      createdAt: pushToken.createdAt,
      updatedAt: pushToken.updatedAt,
    };
  }
}

