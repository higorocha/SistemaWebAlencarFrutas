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
    // Verificar se o token já existe
    const existingToken = await this.prisma.pushToken.findUnique({
      where: { token: createPushTokenDto.token },
    });

    if (existingToken) {
      // Se o token existe mas pertence a outro usuário, atualizar
      if (existingToken.usuarioId !== userId) {
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
        return this.mapToResponseDto(updated);
      }

      // Se já existe para este usuário, apenas atualizar
      const updated = await this.prisma.pushToken.update({
        where: { token: createPushTokenDto.token },
        data: {
          platform: createPushTokenDto.platform,
          deviceId: createPushTokenDto.deviceId,
          ativo: true,
          updatedAt: new Date(),
        },
      });
      return this.mapToResponseDto(updated);
    }

    // Criar novo token
    const newToken = await this.prisma.pushToken.create({
      data: {
        token: createPushTokenDto.token,
        usuarioId: userId,
        platform: createPushTokenDto.platform,
        deviceId: createPushTokenDto.deviceId,
        ativo: true,
      },
    });

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
    const tokens = await this.prisma.pushToken.findMany({
      where: {
        usuarioId: { in: userIds },
        ativo: true,
      },
      select: {
        token: true,
        usuarioId: true,
      },
    });

    const tokensMap = new Map<number, string[]>();
    for (const token of tokens) {
      const userTokens = tokensMap.get(token.usuarioId) || [];
      userTokens.push(token.token);
      tokensMap.set(token.usuarioId, userTokens);
    }

    return tokensMap;
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

