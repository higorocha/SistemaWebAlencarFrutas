import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PixService } from './pix.service';
import { QueryTransacoesPixDto, ConsultaTransacoesPixResponseDto, ErroPixResponseDto } from './dto/pix.dto';

/**
 * Controller para integração com a API PIX do Banco do Brasil
 * Fornece endpoints para consulta de transações PIX recebidas
 */
@ApiTags('PIX')
@Controller('pix')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  /**
   * Consulta transações PIX recebidas no período especificado
   * 
   * Este endpoint permite consultar todas as transações PIX recebidas
   * pela conta configurada no sistema no período especificado.
   * 
   * A consulta utiliza a API oficial do Banco do Brasil e retorna
   * dados completos das transações incluindo pagador, valor, horário, etc.
   */
  @Get('transacoes')
  @ApiOperation({
    summary: 'Consultar transações PIX recebidas',
    description: `
      Consulta transações PIX recebidas no período especificado.
      
      **Funcionalidades:**
      - Consulta transações PIX via API oficial do Banco do Brasil
      - Suporte a paginação automática (até 100 transações por página)
      - Retorna dados completos: pagador, valor, horário, descrição, etc.
      - Cache inteligente de token OAuth2 para otimização
      
      **Requisitos:**
      - Credenciais PIX cadastradas no sistema (modalidade "002 - Pix")
      - Período máximo de 30 dias por consulta
      - Datas no formato YYYY-MM-DD
    `
  })
  @ApiQuery({
    name: 'inicio',
    description: 'Data de início no formato YYYY-MM-DD',
    example: '2024-01-01',
    required: true
  })
  @ApiQuery({
    name: 'fim',
    description: 'Data de fim no formato YYYY-MM-DD',
    example: '2024-01-31',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Transações PIX consultadas com sucesso',
    type: ConsultaTransacoesPixResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos (datas malformadas, período muito longo, etc.)',
    type: ErroPixResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Credenciais PIX não encontradas no sistema',
    type: ErroPixResponseDto
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor ou falha na comunicação com a API do BB',
    type: ErroPixResponseDto
  })
  async consultarTransacoes(
    @Query() queryTransacoesPixDto: QueryTransacoesPixDto
  ): Promise<ConsultaTransacoesPixResponseDto> {
    try {
      console.log('🚀 [PIX-CONTROLLER] Recebida requisição de consulta de transações PIX', {
        inicio: queryTransacoesPixDto.inicio,
        fim: queryTransacoesPixDto.fim
      });

      const resultado = await this.pixService.consultarTransacoes(
        queryTransacoesPixDto.inicio,
        queryTransacoesPixDto.fim
      );

      console.log('✅ [PIX-CONTROLLER] Consulta realizada com sucesso', {
        totalTransacoes: resultado.total,
        periodo: `${resultado.periodoInicio} até ${resultado.periodoFim}`
      });

      return resultado;

    } catch (error) {
      console.error('❌ [PIX-CONTROLLER] Erro na consulta de transações:', error);

      // Re-throw exceções do NestJS (BadRequestException, NotFoundException, etc.)
      if (error instanceof HttpException) {
        throw error;
      }

      // Converter outros erros para HttpException
      throw new HttpException(
        {
          error: 'Erro interno do servidor ao consultar transações PIX',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Endpoint de saúde para verificar se o serviço PIX está operacional
   * Verifica se as credenciais estão configuradas e se a API está acessível
   */
  @Get('health')
  @ApiOperation({
    summary: 'Verificar saúde do serviço PIX',
    description: 'Verifica se o serviço PIX está operacional e se as credenciais estão configuradas'
  })
  @ApiResponse({
    status: 200,
    description: 'Serviço PIX operacional',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        message: { type: 'string', example: 'Serviço PIX operacional' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        configurado: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: 'Serviço PIX indisponível (credenciais não configuradas)',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'unhealthy' },
        message: { type: 'string', example: 'Credenciais PIX não configuradas' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        configurado: { type: 'boolean', example: false }
      }
    }
  })
  async healthCheck() {
    try {
      console.log('🏥 [PIX-CONTROLLER] Verificando saúde do serviço PIX');

      // Verificar se há credenciais configuradas
      const credenciaisPix = await this.pixService['credenciaisAPIService'].findByBancoAndModalidade('001', '002 - Pix');
      
      if (!credenciaisPix || credenciaisPix.length === 0) {
        throw new HttpException(
          {
            status: 'unhealthy',
            message: 'Credenciais PIX não configuradas no sistema',
            timestamp: new Date().toISOString(),
            configurado: false
          },
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      return {
        status: 'healthy',
        message: 'Serviço PIX operacional',
        timestamp: new Date().toISOString(),
        configurado: true,
        credenciaisEncontradas: credenciaisPix.length
      };

    } catch (error) {
      console.error('❌ [PIX-CONTROLLER] Erro no health check:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: 'unhealthy',
          message: 'Erro interno no serviço PIX',
          timestamp: new Date().toISOString(),
          configurado: false
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
