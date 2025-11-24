import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PedidosFinalizacaoJobService } from './pedidos-finalizacao-job.service';

@ApiTags('Pedidos - Finalização Automática')
@Controller('api/pedidos-finalizacao-job')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PedidosFinalizacaoJobController {
  constructor(private readonly pedidosFinalizacaoJobService: PedidosFinalizacaoJobService) {}

  @Get('status')
  @ApiOperation({ summary: 'Obter status do job de finalização automática de pedidos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status do job retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        ativo: { type: 'boolean', description: 'Se o job está ativo' },
        proximaExecucao: { type: 'string', description: 'Próxima execução programada' },
        timeZone: { type: 'string', description: 'Fuso horário configurado' }
      }
    }
  })
  getStatus() {
    return this.pedidosFinalizacaoJobService.getJobStatus();
  }

  @Post('executar')
  @ApiOperation({ 
    summary: 'Executar manualmente o job de finalização automática de pedidos zerados',
    description: 'Busca pedidos em PRECIFICACAO_REALIZADA ou AGUARDANDO_PAGAMENTO com valorFinal <= 0.01 e os finaliza automaticamente'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Job executado com sucesso',
    schema: {
      type: 'object',
      properties: {
        processados: { 
          type: 'number', 
          description: 'Quantidade de pedidos processados' 
        },
        finalizados: { 
          type: 'number', 
          description: 'Quantidade de pedidos finalizados' 
        },
        erros: { 
          type: 'number', 
          description: 'Quantidade de erros encontrados' 
        }
      }
    }
  })
  async executarJob() {
    return this.pedidosFinalizacaoJobService.executarManualmente();
  }
}
