import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CobrancaService } from './services/cobranca.service';
import {
  CriarBoletoDto,
  AlterarBoletoDto,
  ListarBoletosDto,
  ConsultarBoletoDto,
  BaixarBoletoDto,
  BaixaOperacionalDto,
  RetornoMovimentoDto,
  BoletoResponseDto,
  ListarBoletosResponseDto
} from './dto';

/**
 * Controller para integração com API de Cobrança do Banco do Brasil
 * Fornece endpoints para gerenciamento completo de boletos
 */
@ApiTags('Cobrança')
@ApiBearerAuth()
@Controller('api/cobranca')
@UseGuards(JwtAuthGuard)
export class CobrancaController {
  constructor(private readonly cobrancaService: CobrancaService) {}

  /**
   * Cria um novo boleto
   */
  @Post('boletos')
  @ApiOperation({
    summary: 'Criar novo boleto',
    description: 'Cria um novo boleto de cobrança vinculado a um pedido'
  })
  @ApiResponse({
    status: 201,
    description: 'Boleto criado com sucesso',
    type: BoletoResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na validação'
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido, conta corrente ou convênio não encontrado'
  })
  async criarBoleto(
    @Body() dto: CriarBoletoDto,
    @Req() req
  ): Promise<BoletoResponseDto> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📝 [CRIAR-BOLETO] Nova requisição recebida`);
    console.log(`${'='.repeat(80)}`);
    console.log(`🕐 Horário: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    try {
      const usuarioId = req.user?.id;
      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
      
      console.log(`👤 Usuário ID: ${usuarioId || 'N/A'}`);
      console.log(`🌐 IP: ${ipAddress}`);
      console.log(`📦 DTO recebido:`, JSON.stringify(dto, null, 2));
      
      const resultado = await this.cobrancaService.criarBoleto(dto, usuarioId, ipAddress);
      
      console.log(`✅ [CRIAR-BOLETO] Boleto criado com sucesso!`);
      console.log(`   ID do boleto: ${resultado.id}`);
      console.log(`   Nosso Número: ${resultado.nossoNumero}`);
      console.log(`${'='.repeat(80)}\n`);
      
      return resultado;
    } catch (error) {
      console.error(`\n❌ [CRIAR-BOLETO] ERRO ao criar boleto:`);
      console.error(`   Tipo: ${error.constructor.name}`);
      console.error(`   Mensagem: ${error.message}`);
      console.error(`   Stack:`, error.stack);
      console.error(`${'='.repeat(80)}\n`);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          error: 'Erro ao criar boleto',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Lista boletos por pedido
   */
  @Get('boletos/pedido/:pedidoId')
  @ApiOperation({
    summary: 'Listar boletos por pedido',
    description: 'Lista todos os boletos vinculados a um pedido específico'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de boletos do pedido',
    type: [BoletoResponseDto]
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado'
  })
  async listarBoletosPorPedido(
    @Param('pedidoId') pedidoId: string,
    @Req() req
  ): Promise<any[]> {
    try {
      const pedidoIdNumero = parseInt(pedidoId, 10);
      if (isNaN(pedidoIdNumero)) {
        throw new HttpException('ID do pedido inválido', HttpStatus.BAD_REQUEST);
      }

      return await this.cobrancaService.listarBoletosPorPedido(pedidoIdNumero);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          error: 'Erro ao listar boletos do pedido',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Consulta um boleto específico
   */
  @Get('boletos/:id')
  @ApiOperation({
    summary: 'Consultar boleto',
    description: 'Consulta os dados completos de um boleto específico'
  })
  @ApiResponse({
    status: 200,
    description: 'Boleto encontrado',
    type: BoletoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Boleto não encontrado'
  })
  async consultarBoleto(
    @Param('id') nossoNumero: string,
    @Query() dto: ConsultarBoletoDto,
    @Req() req
  ): Promise<BoletoResponseDto | any> {
    try {
      // Obter contaCorrenteId do DTO ou do query (fallback para compatibilidade)
      const contaCorrenteIdStr = dto.contaCorrenteId || req.query?.contaCorrenteId;

      if (!contaCorrenteIdStr) {
        throw new HttpException(
          'contaCorrenteId é obrigatório',
          HttpStatus.BAD_REQUEST
        );
      }

      const contaCorrenteId = Number(contaCorrenteIdStr);
      
      if (isNaN(contaCorrenteId)) {
        throw new HttpException(
          'contaCorrenteId deve ser um número válido',
          HttpStatus.BAD_REQUEST
        );
      }

      // Verificar se includeLogs está ativo (aceita 'true', '1', ou true)
      const includeLogs = dto.includeLogs === 'true' || 
                         dto.includeLogs === '1' || 
                         req.query?.includeLogs === 'true' ||
                         req.query?.includeLogs === '1' ||
                         req.query?.includeLogs === true;

      // Se includeLogs for true, buscar dados completos do banco local
      if (includeLogs) {
        return await this.cobrancaService.consultarBoletoCompleto(
          nossoNumero,
          contaCorrenteId
        );
      }

      return await this.cobrancaService.consultarBoleto(
        nossoNumero,
        dto.numeroConvenio,
        contaCorrenteId
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          error: 'Erro ao consultar boleto',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Lista boletos com filtros
   */
  @Get('boletos')
  @ApiOperation({
    summary: 'Listar boletos',
    description: 'Lista boletos de acordo com os filtros especificados'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de boletos',
    type: ListarBoletosResponseDto
  })
  async listarBoletos(
    @Query() dto: ListarBoletosDto,
    @Req() req
  ): Promise<ListarBoletosResponseDto> {
    try {
      // Obter contaCorrenteId do query
      const contaCorrenteId = req.query?.contaCorrenteId;

      if (!contaCorrenteId) {
        throw new HttpException(
          'contaCorrenteId é obrigatório',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.cobrancaService.listarBoletos(dto, Number(contaCorrenteId));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          error: 'Erro ao listar boletos',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Altera um boleto
   */
  @Patch('boletos/:id')
  @ApiOperation({
    summary: 'Alterar boleto',
    description: 'Altera dados de um boleto já registrado (após 30 minutos da criação)'
  })
  @ApiResponse({
    status: 200,
    description: 'Boleto alterado com sucesso',
    type: BoletoResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Boleto não pode ser alterado (status inválido ou menos de 30 minutos)'
  })
  @ApiResponse({
    status: 404,
    description: 'Boleto não encontrado'
  })
  async alterarBoleto(
    @Param('id') nossoNumero: string,
    @Body() dto: AlterarBoletoDto,
    @Req() req
  ): Promise<BoletoResponseDto> {
    try {
      const usuarioId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress;

      return await this.cobrancaService.alterarBoleto(
        nossoNumero,
        dto,
        usuarioId,
        ipAddress
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          error: 'Erro ao alterar boleto',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Baixa/Cancela um boleto
   */
  @Post('boletos/:id/baixar')
  @ApiOperation({
    summary: 'Baixar/Cancelar boleto',
    description: 'Baixa ou cancela um boleto já registrado (após 30 minutos da criação)'
  })
  @ApiResponse({
    status: 200,
    description: 'Boleto baixado com sucesso',
    type: BoletoResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Boleto não pode ser baixado (status inválido ou menos de 30 minutos)'
  })
  @ApiResponse({
    status: 404,
    description: 'Boleto não encontrado'
  })
  async baixarBoleto(
    @Param('id') nossoNumero: string,
    @Body() dto: BaixarBoletoDto,
    @Req() req
  ): Promise<BoletoResponseDto> {
    try {
      const usuarioId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress;

      return await this.cobrancaService.baixarBoleto(
        nossoNumero,
        dto,
        usuarioId,
        ipAddress
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          error: 'Erro ao baixar boleto',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Consulta baixas operacionais
   */
  @Get('boletos-baixa-operacional')
  @ApiOperation({
    summary: 'Consultar baixas operacionais',
    description: 'Consulta boletos pagos (baixa operacional) no período especificado'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de baixas operacionais'
  })
  async consultarBaixaOperacional(
    @Query() dto: BaixaOperacionalDto,
    @Req() req
  ): Promise<any> {
    try {
      const contaCorrenteId = req.query?.contaCorrenteId;

      if (!contaCorrenteId) {
        throw new HttpException(
          'contaCorrenteId é obrigatório',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.cobrancaService.consultarBaixaOperacional(
        dto,
        Number(contaCorrenteId)
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          error: 'Erro ao consultar baixa operacional',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Consulta retorno de movimento
   */
  @Post('convenios/:id/listar-retorno-movimento')
  @ApiOperation({
    summary: 'Consultar retorno de movimento',
    description: 'Consulta movimentos de retorno vinculados aos boletos registrados'
  })
  @ApiResponse({
    status: 200,
    description: 'Movimentos de retorno'
  })
  async consultarRetornoMovimento(
    @Param('id') convenioId: string,
    @Body() dto: RetornoMovimentoDto,
    @Query('contaCorrenteId') contaCorrenteId: string,
    @Req() req
  ): Promise<any> {
    try {
      if (!contaCorrenteId) {
        throw new HttpException(
          'contaCorrenteId é obrigatório',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.cobrancaService.consultarRetornoMovimento(
        convenioId,
        dto,
        Number(contaCorrenteId)
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          error: 'Erro ao consultar retorno de movimento',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Verifica status do boleto manualmente no Banco do Brasil
   */
  @Post('boletos/:id/verificar-status')
  @ApiOperation({
    summary: 'Verificar status do boleto manualmente',
    description: 'Consulta o status do boleto no Banco do Brasil e processa pagamento automaticamente se estiver pago'
  })
  @ApiResponse({
    status: 200,
    description: 'Status do boleto verificado e atualizado',
    type: BoletoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Boleto não encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'Erro na validação ou boleto em estado inválido'
  })
  async verificarStatusBoleto(
    @Param('id') nossoNumero: string,
    @Query('contaCorrenteId') contaCorrenteId: string,
    @Req() req
  ): Promise<BoletoResponseDto> {
    try {
      const usuarioId = req.user.id;
      const ipAddress = req.ip || req.connection?.remoteAddress;

      if (!contaCorrenteId) {
        throw new HttpException(
          'contaCorrenteId é obrigatório',
          HttpStatus.BAD_REQUEST
        );
      }

      const contaCorrenteIdNumero = Number(contaCorrenteId);
      if (isNaN(contaCorrenteIdNumero)) {
        throw new HttpException(
          'contaCorrenteId deve ser um número válido',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.cobrancaService.verificarStatusBoletoManual(
        nossoNumero,
        contaCorrenteIdNumero,
        usuarioId,
        ipAddress
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          error: 'Erro ao verificar status do boleto',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
