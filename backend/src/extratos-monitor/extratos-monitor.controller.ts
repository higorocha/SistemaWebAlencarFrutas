import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExtratosMonitorService } from './extratos-monitor.service';

@ApiTags('Extratos Monitor')
@Controller('api/extratos-monitor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExtratosMonitorController {
  constructor(
    private readonly extratosMonitorService: ExtratosMonitorService,
  ) {}

  @Post('executar-manual')
  @ApiOperation({
    summary: 'Executa monitoramento de extratos manualmente',
    description: 'Endpoint temporário para testes. Executa a busca de extratos para todas as contas monitoradas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Monitoramento executado com sucesso',
    schema: {
      type: 'object',
      properties: {
        contasMonitoradas: { type: 'number' },
        lancamentosProcessados: { type: 'number' },
        notificacoesCriadas: { type: 'number' },
      },
    },
  })
  async executarMonitoramentoManual() {
    console.log('📥 [EXTRATOS-MONITOR-CONTROLLER] Recebida requisição para executar monitoramento manual');
    try {
      const resultado = await this.extratosMonitorService.executarMonitoramentoManualmente();
      console.log('✅ [EXTRATOS-MONITOR-CONTROLLER] Monitoramento executado com sucesso:', resultado);
      return resultado;
    } catch (error) {
      console.error('❌ [EXTRATOS-MONITOR-CONTROLLER] Erro ao executar monitoramento:', error);
      throw error;
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Obtém status do monitoramento',
    description: 'Retorna informações sobre o status atual do monitoramento de extratos',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do monitoramento',
    schema: {
      type: 'object',
      properties: {
        isActive: { type: 'boolean' },
        nextExecution: { type: 'string' },
        contasMonitoradas: { type: 'number' },
        lancamentosNotificadosHoje: { type: 'number' },
      },
    },
  })
  async getStatus() {
    return this.extratosMonitorService.getMonitoringStatus();
  }
}

