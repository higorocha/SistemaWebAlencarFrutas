import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CertificateMonitorService } from './certificate-monitor.service';

@ApiTags('Certificate Monitor')
@Controller('api/certificate-monitor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CertificateMonitorController {
  constructor(private readonly certificateMonitorService: CertificateMonitorService) {}

  @Get('status')
  @ApiOperation({ summary: 'Obter status do monitoramento de certificados' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status do monitoramento retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        isActive: { type: 'boolean', description: 'Se o monitoramento está ativo' },
        nextCheck: { type: 'string', description: 'Próxima verificação programada' },
        timeZone: { type: 'string', description: 'Fuso horário configurado' }
      }
    }
  })
  getStatus() {
    return this.certificateMonitorService.getMonitoringStatus();
  }

  @Post('check')
  @ApiOperation({ summary: 'Executar verificação manual de certificados' })
  @ApiResponse({ 
    status: 200, 
    description: 'Verificação executada com sucesso',
    schema: {
      type: 'object',
      properties: {
        hasExpired: { type: 'boolean', description: 'Se há certificados vencidos' },
        hasExpiringSoon: { type: 'boolean', description: 'Se há certificados vencendo em breve' },
        expiredCerts: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Lista de certificados vencidos'
        },
        expiringSoonCerts: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Lista de certificados vencendo em breve'
        }
      }
    }
  })
  async checkCertificates() {
    return this.certificateMonitorService.checkCertificatesManually();
  }

  @Post('simulate-cron')
  @ApiOperation({ summary: 'Simular execução do cron job de certificados' })
  @ApiResponse({ 
    status: 200, 
    description: 'Simulação do cron job executada com sucesso',
    schema: {
      type: 'object',
      properties: {
        hasExpired: { type: 'boolean', description: 'Se há certificados vencidos' },
        hasExpiringSoon: { type: 'boolean', description: 'Se há certificados vencendo em breve' },
        expiredCerts: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Lista de certificados vencidos'
        },
        expiringSoonCerts: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Lista de certificados vencendo em breve'
        },
        notificationsSent: { type: 'number', description: 'Número de notificações enviadas' }
      }
    }
  })
  async simulateCronJob() {
    return this.certificateMonitorService.simulateCronJob();
  }
}
