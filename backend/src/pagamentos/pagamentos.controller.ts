import { Controller, Post, Get, Body, Param, Query, HttpStatus, UseGuards, ParseIntPipe, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PagamentosService } from './pagamentos.service';
import {
  SolicitarTransferenciaPixDto,
  SolicitarPagamentoBoletoDto,
  SolicitarPagamentoGuiaDto,
  RespostaTransferenciaPixDto,
  RespostaPagamentoBoletoDto,
  RespostaPagamentoGuiaDto,
  LiberarPagamentosDto,
  CancelarPagamentosDto,
} from './dto/pagamentos.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissoesGuard } from '../auth/guards/permissoes.guard';
import { Niveis } from '../auth/decorators/niveis.decorator';
import { NivelUsuario } from '../auth/dto';
import { CredenciaisAPIService } from '../credenciais-api/credenciais-api.service';
import { ContaCorrenteService } from '../conta-corrente/conta-corrente.service';

/**
 * Controller para integração com a API de Pagamentos do Banco do Brasil
 * Fornece endpoints para solicitar pagamentos (PIX, boletos, guias) e consultar status
 */
@ApiTags('Pagamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/pagamentos')
export class PagamentosController {
  constructor(
    private readonly pagamentosService: PagamentosService,
    private readonly credenciaisAPIService: CredenciaisAPIService,
    private readonly contaCorrenteService: ContaCorrenteService,
  ) {}

  /**
   * Solicita transferência PIX
   */
  @Post('transferencias-pix')
  @ApiOperation({ summary: 'Solicitar transferência PIX' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transferência PIX solicitada com sucesso',
    type: RespostaTransferenciaPixDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Credencial ou conta corrente não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  async solicitarTransferenciaPix(
    @Body() dto: SolicitarTransferenciaPixDto,
    @Request() req: any
  ): Promise<RespostaTransferenciaPixDto> {
    const usuarioId = req.user?.id;
    return this.pagamentosService.solicitarTransferenciaPix(dto, usuarioId);
  }

  /**
   * Consulta status individual de transferência PIX
   */
  @Get('pix/:identificadorPagamento/individual')
  @ApiOperation({ summary: 'Consultar status individual de transferência PIX' })
  @ApiParam({ name: 'identificadorPagamento', description: 'Identificador do pagamento PIX (retornado pelo BB)', example: '96494633731030000' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status individual da transferência PIX',
  })
  @ApiQuery({ 
    name: 'contaCorrenteId', 
    required: false, 
    description: 'ID da conta corrente. Se não informado, busca no banco de dados ou tenta todas as contas.',
    type: Number
  })
  async consultarStatusTransferenciaIndividual(
    @Param('identificadorPagamento') identificadorPagamento: string,
    @Query('contaCorrenteId') contaCorrenteId?: number
  ): Promise<any> {
    return this.pagamentosService.consultarStatusTransferenciaIndividual(identificadorPagamento, contaCorrenteId);
  }

  /**
   * Consulta online a solicitação de transferência PIX diretamente na API do BB
   * e atualiza o status no banco de dados local
   */
  @Get('transferencias-pix/:numeroRequisicao/consulta-online')
  @ApiOperation({ 
    summary: 'Consultar solicitação de transferência PIX online',
    description: 'Consulta a solicitação de transferência PIX diretamente na API do BB e atualiza o status no banco de dados local com os dados mais recentes.'
  })
  @ApiParam({ name: 'numeroRequisicao', description: 'Número do lote de transferências', example: 1234567 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resposta completa da API BB com detalhes da solicitação',
    type: RespostaTransferenciaPixDto,
  })
  @ApiQuery({ 
    name: 'contaCorrenteId', 
    required: false, 
    description: 'ID da conta corrente. Se não informado, busca no banco de dados ou tenta todas as contas.',
    type: Number
  })
  async consultarSolicitacaoTransferenciaPixOnline(
    @Param('numeroRequisicao', ParseIntPipe) numeroRequisicao: number,
    @Query('contaCorrenteId') contaCorrenteId?: number
  ): Promise<RespostaTransferenciaPixDto> {
    return this.pagamentosService.consultarSolicitacaoTransferenciaPixOnline(numeroRequisicao, contaCorrenteId);
  }

  /**
   * Solicita pagamento de boleto
   */
  @Post('boletos')
  @ApiOperation({ summary: 'Solicitar pagamento de boleto' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pagamento de boleto solicitado com sucesso',
    type: RespostaPagamentoBoletoDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Credencial ou conta corrente não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  async solicitarPagamentoBoleto(
    @Body() dto: SolicitarPagamentoBoletoDto
  ): Promise<RespostaPagamentoBoletoDto> {
    return this.pagamentosService.solicitarPagamentoBoleto(dto);
  }

  /**
   * Consulta status individual de pagamento de boleto
   * IMPORTANTE: Esta rota deve vir ANTES da rota de lote para evitar conflito de rotas
   */
  @Get('boletos/:codigoIdentificadorPagamento/individual')
  @ApiOperation({ summary: 'Consultar status individual de pagamento de boleto' })
  @ApiParam({ name: 'codigoIdentificadorPagamento', description: 'Código identificador do pagamento de boleto (retornado pelo BB)', example: '97310301234560001' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status individual do pagamento de boleto',
  })
  @ApiQuery({ 
    name: 'contaCorrenteId', 
    required: false, 
    description: 'ID da conta corrente. Se não informado, busca no banco de dados ou tenta todas as contas.',
    type: Number
  })
  async consultarStatusBoletoIndividual(
    @Param('codigoIdentificadorPagamento') codigoIdentificadorPagamento: string,
    @Query('contaCorrenteId') contaCorrenteId?: number
  ): Promise<any> {
    return this.pagamentosService.consultarStatusBoletoIndividual(codigoIdentificadorPagamento, contaCorrenteId);
  }

  /**
   * Consulta status de pagamento de boleto (lote)
   */
  @Get('boletos/:numeroRequisicao')
  @ApiOperation({ summary: 'Consultar status de lote de pagamento de boleto' })
  @ApiParam({ name: 'numeroRequisicao', description: 'Número da requisição', example: 1234567 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status do pagamento de boleto',
    type: RespostaPagamentoBoletoDto,
  })
  @ApiQuery({ 
    name: 'contaCorrenteId', 
    required: false, 
    description: 'ID da conta corrente. Se não informado, busca no banco de dados ou tenta todas as contas.',
    type: Number
  })
  async consultarStatusPagamentoBoleto(
    @Param('numeroRequisicao', ParseIntPipe) numeroRequisicao: number,
    @Query('contaCorrenteId') contaCorrenteId?: number
  ): Promise<RespostaPagamentoBoletoDto> {
    return this.pagamentosService.consultarStatusPagamentoBoleto(numeroRequisicao, contaCorrenteId);
  }

  /**
   * Solicita pagamento de guia com código de barras
   */
  @Post('guias')
  @ApiOperation({ summary: 'Solicitar pagamento de guia com código de barras' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pagamento de guia solicitado com sucesso',
    type: RespostaPagamentoGuiaDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Credencial ou conta corrente não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  async solicitarPagamentoGuia(
    @Body() dto: SolicitarPagamentoGuiaDto
  ): Promise<RespostaPagamentoGuiaDto> {
    return this.pagamentosService.solicitarPagamentoGuia(dto);
  }

  /**
   * Consulta status individual de pagamento de guia
   * IMPORTANTE: Esta rota deve vir ANTES da rota de lote para evitar conflito de rotas
   */
  @Get('guias/:codigoPagamento/individual')
  @ApiOperation({ summary: 'Consultar status individual de pagamento de guia' })
  @ApiParam({ name: 'codigoPagamento', description: 'Código do pagamento de guia (retornado pelo BB)', example: '97310301234560001' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status individual do pagamento de guia',
  })
  @ApiQuery({ 
    name: 'contaCorrenteId', 
    required: false, 
    description: 'ID da conta corrente. Se não informado, busca no banco de dados ou tenta todas as contas.',
    type: Number
  })
  async consultarStatusGuiaIndividual(
    @Param('codigoPagamento') codigoPagamento: string,
    @Query('contaCorrenteId') contaCorrenteId?: number
  ): Promise<any> {
    return this.pagamentosService.consultarStatusGuiaIndividual(codigoPagamento, contaCorrenteId);
  }

  /**
   * Consulta status de pagamento de guia (lote)
   */
  @Get('guias/:numeroRequisicao')
  @ApiOperation({ summary: 'Consultar status de lote de pagamento de guia' })
  @ApiParam({ name: 'numeroRequisicao', description: 'Número da requisição', example: 1234567 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status do pagamento de guia',
    type: RespostaPagamentoGuiaDto,
  })
  @ApiQuery({ 
    name: 'contaCorrenteId', 
    required: false, 
    description: 'ID da conta corrente. Se não informado, busca no banco de dados ou tenta todas as contas.',
    type: Number
  })
  async consultarStatusPagamentoGuia(
    @Param('numeroRequisicao', ParseIntPipe) numeroRequisicao: number,
    @Query('contaCorrenteId') contaCorrenteId?: number
  ): Promise<RespostaPagamentoGuiaDto> {
    return this.pagamentosService.consultarStatusPagamentoGuia(numeroRequisicao, contaCorrenteId);
  }

  /**
   * Lista lotes de pagamentos vinculados a turma de colheita (PIX)
   */
  @Get('lotes-turma-colheita')
  @ApiOperation({ summary: 'Listar lotes de pagamentos vinculados a turmas de colheita (PIX)' })
  @ApiQuery({
    name: 'dataInicio',
    required: false,
    description: 'Data inicial (ISO) para filtrar por data de criação ou liberação do lote',
    type: String,
  })
  @ApiQuery({
    name: 'dataFim',
    required: false,
    description: 'Data final (ISO) para filtrar por data de criação ou liberação do lote',
    type: String,
  })
  @ApiQuery({
    name: 'tipoData',
    required: false,
    description: 'Tipo de data para filtrar: "criacao" (padrão) ou "liberacao"',
    enum: ['criacao', 'liberacao'],
    type: String,
  })
  @ApiQuery({
    name: 'contaCorrenteId',
    required: false,
    description: 'ID da conta corrente para filtrar os lotes',
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de lotes de pagamentos da API vinculados a turmas de colheita',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async listarLotesTurmaColheita(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('tipoData') tipoData?: string,
    @Query('contaCorrenteId') contaCorrenteId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const contaId = contaCorrenteId ? parseInt(contaCorrenteId, 10) : undefined;
    return this.pagamentosService.listarLotesTurmaColheita(dataInicio, dataFim, page, limit, tipoData, contaId);
  }

  /**
   * Lista lotes de pagamentos vinculados a folhas de pagamento (PIX)
   */
  @Get('lotes-folha-pagamento')
  @ApiOperation({ summary: 'Listar lotes de pagamentos vinculados a folhas de pagamento (PIX)' })
  @ApiQuery({
    name: 'dataInicio',
    required: false,
    description: 'Data inicial (ISO) para filtrar por data de criação ou liberação do lote',
    type: String,
  })
  @ApiQuery({
    name: 'dataFim',
    required: false,
    description: 'Data final (ISO) para filtrar por data de criação ou liberação do lote',
    type: String,
  })
  @ApiQuery({
    name: 'tipoData',
    required: false,
    description: 'Tipo de data para filtrar: "criacao" (padrão) ou "liberacao"',
    enum: ['criacao', 'liberacao'],
    type: String,
  })
  @ApiQuery({
    name: 'contaCorrenteId',
    required: false,
    description: 'ID da conta corrente para filtrar os lotes',
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de lotes de pagamentos da API vinculados a folhas de pagamento',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async listarLotesFolhaPagamento(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('tipoData') tipoData?: string,
    @Query('contaCorrenteId') contaCorrenteId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const contaId = contaCorrenteId ? parseInt(contaCorrenteId, 10) : undefined;
    return this.pagamentosService.listarLotesFolhaPagamento(dataInicio, dataFim, page, limit, tipoData, contaId);
  }

  /**
   * Busca inteligente de pagamentos com sugestões categorizadas
   */
  @Get('busca-inteligente')
  @ApiOperation({ summary: 'Busca inteligente de pagamentos com sugestões categorizadas' })
  @ApiQuery({
    name: 'term',
    required: true,
    type: String,
    description: 'Termo de busca (mínimo 2 caracteres)',
    example: 'João'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sugestões encontradas com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', example: 'colhedor' },
          label: { type: 'string', example: 'Colhedor' },
          value: { type: 'string', example: 'João Silva' },
          icon: { type: 'string', example: '🧑‍🌾' },
          color: { type: 'string', example: '#52c41a' },
          description: { type: 'string', example: 'Filtrar por colhedor: João Silva' },
          metadata: {
            type: 'object',
            example: { nome: 'João Silva' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Termo de busca deve ter pelo menos 2 caracteres',
  })
  buscaInteligente(@Query('term') term: string) {
    if (!term || term.length < 2) {
      throw new BadRequestException('Termo de busca deve ter pelo menos 2 caracteres');
    }
    return this.pagamentosService.buscaInteligente(term);
  }

  /**
   * Lista contas correntes com credenciais de pagamentos disponíveis
   * Segue o mesmo padrão do endpoint de extratos
   */
  @Get('contas-disponiveis')
  @ApiOperation({ summary: 'Listar contas correntes com credenciais de pagamentos disponíveis' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de contas correntes disponíveis',
    type: [Object],
  })
  async listarContasDisponiveis() {
    try {
      // Buscar todas as credenciais de pagamentos
      const credenciaisPagamentos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '004 - Pagamentos');
      
      if (!credenciaisPagamentos || credenciaisPagamentos.length === 0) {
        return [];
      }
      
      // Extrair IDs únicos de contas correntes
      const contaCorrenteIds = [...new Set(credenciaisPagamentos.map(c => c.contaCorrenteId).filter((id): id is number => typeof id === 'number' && id > 0))];
      
      if (contaCorrenteIds.length === 0) {
        return [];
      }
      
      // Buscar contas correntes, tratando erros individualmente
      const contas = await Promise.allSettled(
        contaCorrenteIds.map((id: number) => this.contaCorrenteService.findOne(id))
      );

      // Filtrar apenas as contas encontradas com sucesso
      const contasValidas = contas
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        // Apenas contas que possuem número de contrato de pagamentos configurado
        .filter(conta => conta.numeroContratoPagamento !== null && conta.numeroContratoPagamento !== undefined);

      return contasValidas.map(conta => ({
        id: conta.id,
        agencia: conta.agencia,
        contaCorrente: conta.contaCorrente,
        contaCorrenteDigito: conta.contaCorrenteDigito || 'X',
        banco: conta.bancoCodigo,
        nomeBanco: this.getNomeBanco(conta.bancoCodigo),
      }));
    } catch (error) {
      console.error('Erro ao listar contas disponíveis:', error);
      return [];
    }
  }

  /**
   * Função helper para obter o nome do banco pelo código
   */
  private getNomeBanco(codigo: string): string {
    const bancos: Record<string, string> = {
      '001': 'Banco do Brasil',
      '033': 'Banco Santander',
      '104': 'Caixa Econômica Federal',
      '237': 'Bradesco',
      '341': 'Itaú Unibanco',
      '356': 'Banco Real',
      '399': 'HSBC Bank Brasil',
      '422': 'Banco Safra',
      '633': 'Banco Rendimento',
      '652': 'Itaú Unibanco Holding',
      '745': 'Banco Citibank',
      '748': 'Banco Cooperativo Sicredi',
      '756': 'Banco Cooperativo do Brasil',
    };
    return bancos[codigo] || 'Banco não identificado';
  }

  /**
   * Libera um lote de pagamentos (numeroRequisicao) na API do BB.
   * Apenas ADMINISTRADOR pode executar.
   */
  @Post('liberar')
  @UseGuards(JwtAuthGuard, PermissoesGuard)
  @Niveis(NivelUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Liberar lote de pagamentos (PIX/Boletos/Guias)',
    description:
      'Libera um lote de pagamentos previamente enviado ao Banco do Brasil, usando numeroRequisicao e indicadorFloat.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liberação enviada com sucesso para o Banco do Brasil',
    type: Object,
  })
  async liberarPagamentos(
    @Body() dto: LiberarPagamentosDto,
    @Request() req: any
  ): Promise<any> {
    const usuarioId = req.user?.id;
    return this.pagamentosService.liberarPagamentos(dto, usuarioId);
  }

  /**
   * Cancelar pagamentos específicos.
   * Apenas ADMINISTRADOR pode executar.
   */
  @Post('cancelar')
  @UseGuards(JwtAuthGuard, PermissoesGuard)
  @Niveis(NivelUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Cancelar pagamentos específicos',
    description:
      'Cancela pagamentos informando contaCorrenteId e lista de códigos de pagamento.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cancelamento enviado com sucesso para o Banco do Brasil',
    type: Object,
  })
  async cancelarPagamentos(
    @Body() dto: CancelarPagamentosDto,
    @Request() req: any
  ): Promise<any> {
    const usuarioId = req.user?.id;
    return this.pagamentosService.cancelarPagamentos(dto, usuarioId);
  }
}

