import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ExtratosService } from './extratos.service';
import { 
  QueryExtratosDto, 
  QueryExtratosPeriodoDto, 
  ConsultaExtratosResponseDto, 
  ExtratosMensaisResponseDto,
  ErroExtratosResponseDto,
  ExtratosHealthResponseDto 
} from './dto/extratos.dto';

/**
 * Controller para integração com a API de extratos do Banco do Brasil
 * Fornece endpoints para consulta de extratos bancários
 */
@ApiTags('Extratos')
@Controller('api/extratos')
export class ExtratosController {
  constructor(private readonly extratosService: ExtratosService) {}

  /**
   * Consulta extratos bancários no período especificado
   * 
   * Este endpoint permite consultar todos os lançamentos bancários
   * da conta configurada no sistema no período especificado.
   * 
   * A consulta utiliza a API oficial do Banco do Brasil e retorna
   * dados completos dos lançamentos incluindo descrição, valor, data, etc.
   */
  @Get()
  @ApiOperation({
    summary: 'Consultar extratos bancários',
    description: `
      Consulta extratos bancários no período especificado.
      
      **Funcionalidades:**
      - Consulta extratos via API oficial do Banco do Brasil
      - Suporte a paginação automática (até 200 lançamentos por página)
      - Retorna dados completos: descrição, valor, data, documento, etc.
      - Cache inteligente de token OAuth2 para otimização
      
      **Requisitos:**
      - Credenciais de extratos cadastradas no sistema (modalidade "003 - Extratos")
      - Conta corrente cadastrada no sistema
      - Datas no formato DDMMYYYY
    `
  })
  @ApiQuery({
    name: 'dataInicio',
    description: 'Data de início no formato DDMMYYYY',
    example: '01122024',
    required: true
  })
  @ApiQuery({
    name: 'dataFim',
    description: 'Data de fim no formato DDMMYYYY',
    example: '31122024',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Extratos consultados com sucesso',
    type: ConsultaExtratosResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos (datas malformadas, período inválido, etc.)',
    type: ErroExtratosResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Credenciais de extratos ou conta corrente não encontradas no sistema',
    type: ErroExtratosResponseDto
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor ou falha na comunicação com a API do BB',
    type: ErroExtratosResponseDto
  })
  async consultarExtratos(
    @Query() queryExtratosDto: QueryExtratosDto
  ): Promise<ConsultaExtratosResponseDto> {
    try {
      console.log('🚀 [EXTRATOS-CONTROLLER] Recebida requisição de consulta de extratos', {
        dataInicio: queryExtratosDto.dataInicio,
        dataFim: queryExtratosDto.dataFim
      });

      const resultado = await this.extratosService.consultarExtratos(
        queryExtratosDto.dataInicio,
        queryExtratosDto.dataFim
      );

      console.log('✅ [EXTRATOS-CONTROLLER] Consulta realizada com sucesso', {
        totalLancamentos: resultado.total,
        periodo: `${resultado.periodoInicio} até ${resultado.periodoFim}`
      });

      return resultado;

    } catch (error) {
      console.error('❌ [EXTRATOS-CONTROLLER] Erro na consulta de extratos:', error);

      // Re-throw exceções do NestJS (BadRequestException, NotFoundException, etc.)
      if (error instanceof HttpException) {
        throw error;
      }

      // Converter outros erros para HttpException
      throw new HttpException(
        {
          error: 'Erro interno do servidor ao consultar extratos',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Consulta extratos mensais (do início do mês até ontem)
   * 
   * Este endpoint consulta automaticamente os extratos do período mensal
   * com cache inteligente para evitar consultas repetidas no mesmo dia.
   */
  @Get('mensal')
  @ApiOperation({
    summary: 'Consultar extratos mensais',
    description: `
      Consulta extratos mensais automaticamente.
      
      **Funcionalidades:**
      - Consulta do início do mês até ontem
      - No primeiro dia do mês, consulta o mês anterior inteiro
      - Cache inteligente para evitar consultas repetidas no mesmo dia
      - Retorna dados completos dos lançamentos
      
      **Requisitos:**
      - Credenciais de extratos cadastradas no sistema
      - Conta corrente cadastrada no sistema
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Extratos mensais consultados com sucesso',
    type: ExtratosMensaisResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Credenciais de extratos ou conta corrente não encontradas no sistema',
    type: ErroExtratosResponseDto
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor ou falha na comunicação com a API do BB',
    type: ErroExtratosResponseDto
  })
  async consultarExtratosMensais(): Promise<ExtratosMensaisResponseDto> {
    try {
      console.log('🚀 [EXTRATOS-CONTROLLER] Recebida requisição de consulta de extratos mensais');

      const resultado = await this.extratosService.consultarExtratosMensais();

      console.log('✅ [EXTRATOS-CONTROLLER] Consulta mensal realizada com sucesso', {
        totalLancamentos: resultado.total,
        periodo: resultado.periodo,
        origem: resultado.origem
      });

      return resultado;

    } catch (error) {
      console.error('❌ [EXTRATOS-CONTROLLER] Erro na consulta de extratos mensais:', error);

      // Re-throw exceções do NestJS
      if (error instanceof HttpException) {
        throw error;
      }

      // Converter outros erros para HttpException
      throw new HttpException(
        {
          error: 'Erro interno do servidor ao consultar extratos mensais',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Consulta extratos por período personalizado
   * 
   * Este endpoint permite consultar extratos em um período específico
   * usando formato de data mais amigável (DD-MM-YYYY).
   */
  @Get('periodo')
  @ApiOperation({
    summary: 'Consultar extratos por período personalizado',
    description: `
      Consulta extratos bancários em período personalizado.
      
      **Funcionalidades:**
      - Consulta por período específico
      - Formato de data amigável (DD-MM-YYYY)
      - Validação de datas futuras
      - Retorna dados completos dos lançamentos
      
      **Requisitos:**
      - Credenciais de extratos cadastradas no sistema
      - Conta corrente cadastrada no sistema
      - Datas no formato DD-MM-YYYY
    `
  })
  @ApiQuery({
    name: 'inicio',
    description: 'Data de início no formato DD-MM-YYYY',
    example: '01-12-2024',
    required: true
  })
  @ApiQuery({
    name: 'fim',
    description: 'Data de fim no formato DD-MM-YYYY',
    example: '31-12-2024',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Extratos consultados com sucesso',
    type: ConsultaExtratosResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos (datas malformadas, período inválido, datas futuras, etc.)',
    type: ErroExtratosResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Credenciais de extratos ou conta corrente não encontradas no sistema',
    type: ErroExtratosResponseDto
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor ou falha na comunicação com a API do BB',
    type: ErroExtratosResponseDto
  })
  async consultarExtratosPorPeriodo(
    @Query() queryPeriodoDto: QueryExtratosPeriodoDto
  ): Promise<ConsultaExtratosResponseDto> {
    try {
      console.log('🚀 [EXTRATOS-CONTROLLER] Recebida requisição de consulta por período', {
        inicio: queryPeriodoDto.inicio,
        fim: queryPeriodoDto.fim
      });

      const resultado = await this.extratosService.consultarExtratosPorPeriodo(
        queryPeriodoDto.inicio,
        queryPeriodoDto.fim
      );

      console.log('✅ [EXTRATOS-CONTROLLER] Consulta por período realizada com sucesso', {
        totalLancamentos: resultado.total,
        periodo: `${resultado.periodoInicio} até ${resultado.periodoFim}`
      });

      return resultado;

    } catch (error) {
      console.error('❌ [EXTRATOS-CONTROLLER] Erro na consulta por período:', error);

      // Re-throw exceções do NestJS
      if (error instanceof HttpException) {
        throw error;
      }

      // Converter outros erros para HttpException
      throw new HttpException(
        {
          error: 'Erro interno do servidor ao consultar extratos por período',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Endpoint de saúde para verificar se o serviço de extratos está operacional
   * Verifica se as credenciais estão configuradas e se a conta corrente está cadastrada
   */
  @Get('health')
  @ApiOperation({
    summary: 'Verificar saúde do serviço de extratos',
    description: 'Verifica se o serviço de extratos está operacional e se as credenciais e conta corrente estão configuradas'
  })
  @ApiResponse({
    status: 200,
    description: 'Serviço de extratos operacional',
    type: ExtratosHealthResponseDto
  })
  @ApiResponse({
    status: 503,
    description: 'Serviço de extratos indisponível (credenciais ou conta corrente não configuradas)',
    type: ExtratosHealthResponseDto
  })
  async healthCheck(): Promise<ExtratosHealthResponseDto> {
    try {
      console.log('🏥 [EXTRATOS-CONTROLLER] Verificando saúde do serviço de extratos');

      // Verificar se há credenciais configuradas
      const credenciaisExtratos = await this.extratosService['credenciaisAPIService'].findByBancoAndModalidade('001', '003 - Extratos');
      
      if (!credenciaisExtratos || credenciaisExtratos.length === 0) {
        throw new HttpException(
          {
            status: 'unhealthy',
            message: 'Credenciais de extratos não configuradas no sistema',
            timestamp: new Date().toISOString(),
            configurado: false
          },
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      // Verificar se há conta corrente configurada
      const contasCorrente = await this.extratosService['contaCorrenteService'].findAll();
      
      if (!contasCorrente || contasCorrente.length === 0) {
        throw new HttpException(
          {
            status: 'unhealthy',
            message: 'Conta corrente não configurada no sistema',
            timestamp: new Date().toISOString(),
            configurado: false
          },
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      const contaInfo = {
        agencia: contasCorrente[0].agencia,
        conta: contasCorrente[0].contaCorrente,
        banco: '001'
      };

      return {
        status: 'healthy',
        message: 'Serviço de extratos operacional',
        timestamp: new Date().toISOString(),
        configurado: true,
        credenciaisEncontradas: credenciaisExtratos.length,
        contaInfo
      };

    } catch (error) {
      console.error('❌ [EXTRATOS-CONTROLLER] Erro no health check:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: 'unhealthy',
          message: 'Erro interno no serviço de extratos',
          timestamp: new Date().toISOString(),
          configurado: false
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
