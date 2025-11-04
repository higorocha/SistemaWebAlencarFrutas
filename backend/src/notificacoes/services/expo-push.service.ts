import { Injectable, Logger } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';

// Tipos para Expo Push Notifications
interface ExpoPushMessage {
  to: string;
  sound?: string;
  title?: string;
  body?: string;
  data?: any;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
    [key: string]: any;
  };
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private expo: Expo;

  constructor() {
    // Inicializar Expo SDK
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN, // Opcional: token de acesso do Expo
      useFcmV1: true, // Usar FCM v1 para Android
    });
  }

  /**
   * Envia notificação push para um token Expo
   */
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<boolean> {
    try {
      // Verificar se o token é válido
      if (!Expo.isExpoPushToken(token)) {
        this.logger.warn(`Token inválido: ${token}`);
        return false;
      }

      // Criar mensagem
      const message: ExpoPushMessage = {
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
        channelId: 'default',
      };

      // Enviar notificação
      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          this.logger.error(`Erro ao enviar chunk de notificações:`, error);
        }
      }

      // Verificar se houve erros
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          this.logger.error(`Erro no ticket: ${ticket.message || 'Erro desconhecido'}`);
          if (ticket.details?.error === 'DeviceNotRegistered') {
            // Token inválido ou dispositivo desregistrado
            this.logger.warn(`Token não registrado: ${token}`);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar push notification:`, error);
      return false;
    }
  }

  /**
   * Envia notificações push para múltiplos tokens
   */
  async sendPushNotifications(
    tokens: string[],
    title: string,
    body: string,
    data?: any,
  ): Promise<{ success: number; failed: number }> {
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
      this.logger.warn('Nenhum token válido para enviar');
      return { success: 0, failed: tokens.length };
    }

    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
      channelId: 'default',
    }));

    let successCount = 0;
    let failedCount = 0;

    try {
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          this.logger.error(`Erro ao enviar chunk de notificações:`, error);
          failedCount += chunk.length;
        }
      }

      // Processar resultados
      for (const ticket of tickets) {
        if (ticket.status === 'ok') {
          successCount++;
        } else {
          failedCount++;
          this.logger.error(`Erro no ticket: ${ticket.message || 'Erro desconhecido'}`);
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao enviar push notifications:`, error);
      failedCount = validTokens.length;
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Verifica se um token é válido
   */
  isValidToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }
}

