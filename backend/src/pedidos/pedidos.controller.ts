import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PedidosService } from './pedidos.service';
import { 
  CreatePedidoDto, 
  UpdatePedidoDto, 
  UpdateColheitaDto, 
  UpdatePrecificacaoDto, 
  UpdatePagamentoDto, 
  PedidoResponseDto, 
  UpdatePedidoCompletoDto,
  CreatePagamentoDto,
  PagamentoPedidoResponseDto,
  UpdateAjustesPrecificacaoDto
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter estatísticas da dashboard de pedidos' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas da dashboard obtidas com sucesso',
  })
  getDashboardStats(
    @Query('paginaFinalizados') paginaFinalizados?: string,
    @Query('limitFinalizados') limitFinalizados?: string,
    @Req() request?: any,
  ) {
    // Extrair dados do usuário do JWT
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    return this.pedidosService.getDashboardStats(
      paginaFinalizados ? parseInt(paginaFinalizados) : 1,
      limitFinalizados ? parseInt(limitFinalizados) : 10,
      usuarioNivel,
      usuarioCulturaId,
    );
  }

  @Get('busca-inteligente')
  @ApiOperation({ summary: 'Busca inteligente de pedidos com sugestões categorizadas' })
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
          type: { type: 'string', example: 'cliente' },
          label: { type: 'string', example: 'Cliente' },
          value: { type: 'string', example: 'João Silva' },
          icon: { type: 'string', example: '👤' },
          color: { type: 'string', example: '#52c41a' },
          description: { type: 'string', example: 'João Silva - CPF: 123.456.789-00' },
          metadata: {
            type: 'object',
            example: { id: 1, documento: '12345678900' }
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
      throw new Error('Termo de busca deve ter pelo menos 2 caracteres');
    }
    return this.pedidosService.buscaInteligente(term);
  }

  @Post()
  @ApiOperation({ summary: 'Criar um novo pedido' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pedido criado com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente ou fruta não encontrados',
  })
  create(@Body() createPedidoDto: CreatePedidoDto): Promise<PedidoResponseDto> {
    return this.pedidosService.create(createPedidoDto);
  }

  // NOVO: Endpoint para criar pagamento individual
  @Post('pagamentos')
  @ApiOperation({ summary: 'Criar um novo pagamento para um pedido' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pagamento criado com sucesso',
    type: PagamentoPedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Status do pedido não permite pagamento ou valor excede o limite',
  })
  createPagamento(@Body() createPagamentoDto: CreatePagamentoDto): Promise<PagamentoPedidoResponseDto> {
    return this.pedidosService.createPagamento(createPagamentoDto);
  }

  // NOVO: Endpoint para buscar pagamentos de um pedido
  @Get(':id/pagamentos')
  @ApiOperation({ summary: 'Buscar todos os pagamentos de um pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pagamentos encontrados com sucesso',
    type: [PagamentoPedidoResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  findPagamentosByPedido(@Param('id') id: string): Promise<PagamentoPedidoResponseDto[]> {
    return this.pedidosService.findPagamentosByPedido(+id);
  }

  // NOVO: Endpoint para atualizar pagamento individual
  @Patch('pagamentos/:id')
  @ApiOperation({ summary: 'Atualizar um pagamento existente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pagamento atualizado com sucesso',
    type: PagamentoPedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pagamento não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Status do pedido não permite atualização ou valor excede o limite',
  })
  updatePagamentoIndividual(
    @Param('id') id: string,
    @Body() updatePagamentoDto: UpdatePagamentoDto,
  ): Promise<PagamentoPedidoResponseDto> {
    return this.pedidosService.updatePagamentoIndividual(+id, updatePagamentoDto);
  }

  // NOVO: Endpoint para remover pagamento individual
  @Delete('pagamentos/:id')
  @ApiOperation({ summary: 'Remover um pagamento existente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pagamento removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pagamento não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Status do pedido não permite remoção',
  })
  removePagamento(@Param('id') id: string): Promise<void> {
    return this.pedidosService.removePagamento(+id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os pedidos com paginação e filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Termo de busca' })
  @ApiQuery({ name: 'searchType', required: false, type: String, description: 'Tipo de busca (numero, cliente, motorista, placa, vale, etc.)' })
  @ApiQuery({ name: 'status', required: false, type: [String], description: 'Filtrar por status' })
  @ApiQuery({ name: 'clienteId', required: false, type: Number, description: 'Filtrar por cliente' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data início (ISO 8601)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data fim (ISO 8601)' })
  @ApiQuery({ name: 'filters', required: false, type: [String], description: 'Filtros aninhados no formato tipo:valor (ex: cliente:João,vale:12345)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de pedidos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PedidoResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('searchType') searchType?: string,
    @Query('status') status?: string[],
    @Query('clienteId') clienteId?: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('tipoData') tipoData?: 'criacao' | 'colheita',
    @Query('filters') filters?: string[],
    @Req() request?: any,
  ) {
    const dataInicioDate = dataInicio ? new Date(dataInicio) : undefined;
    const dataFimDate = dataFim ? new Date(dataFim) : undefined;

    // Extrair dados do usuário do JWT
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    return this.pedidosService.findAll(
      page,
      limit,
      search,
      searchType,
      status,
      clienteId,
      dataInicioDate,
      dataFimDate,
      tipoData,
      filters,
      usuarioNivel,
      usuarioCulturaId,
    );
  }

  @Get('cliente/:clienteId')
  @ApiOperation({ summary: 'Buscar pedidos por cliente' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filtrar por status (separados por vírgula)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de pedidos do cliente retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PedidoResponseDto' },
        },
        total: { type: 'number' },
        statusFiltrados: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente não encontrado',
  })
  findByCliente(
    @Param('clienteId') clienteId: string,
    @Query('status') status?: string,
    @Req() request?: any,
  ) {
    // Extrair dados do usuário do JWT
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    return this.pedidosService.findByCliente(
      +clienteId,
      status,
      usuarioNivel,
      usuarioCulturaId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um pedido por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido encontrado com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  findOne(
    @Param('id') id: string,
    @Req() request?: any,
  ): Promise<PedidoResponseDto> {
    // Extrair dados do usuário do JWT
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    return this.pedidosService.findOne(+id, usuarioNivel, usuarioCulturaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados básicos do pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido atualizado com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Não é possível atualizar pedidos finalizados ou cancelados',
  })
  update(
    @Param('id') id: string,
    @Body() updatePedidoDto: UpdatePedidoDto,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.update(+id, updatePedidoDto);
  }

  @Patch(':id/colheita')
  @ApiOperation({ summary: 'Atualizar dados da colheita do pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Colheita atualizada com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido ou área agrícola não encontrados',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Status do pedido não permite atualizar colheita',
  })
  updateColheita(
    @Param('id') id: string,
    @Body() updateColheitaDto: UpdateColheitaDto,
    @Req() req,
  ): Promise<PedidoResponseDto> {
    const usuarioId = req.user.id;
    return this.pedidosService.updateColheita(+id, updateColheitaDto, usuarioId);
  }

  @Patch(':id/precificacao')
  @ApiOperation({ summary: 'Definir precificação do pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Precificação definida com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Status do pedido não permite precificação',
  })
  updatePrecificacao(
    @Param('id') id: string,
    @Body() updatePrecificacaoDto: UpdatePrecificacaoDto,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.updatePrecificacao(+id, updatePrecificacaoDto);
  }

  @Patch(':id/ajustes-precificacao')
  @ApiOperation({ summary: 'Ajustar valores de precificação de um pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Valores de precificação ajustados com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Status do pedido não permite ajustes ou dados inválidos',
  })
  updateAjustesPrecificacao(
    @Param('id') id: string,
    @Body() updateAjustesDto: UpdateAjustesPrecificacaoDto,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.updateAjustesPrecificacao(+id, updateAjustesDto);
  }

  @Patch(':id/pagamento')
  @ApiOperation({ summary: 'Registrar pagamento do pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pagamento registrado com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Status do pedido não permite registrar pagamento',
  })
  updatePagamento(
    @Param('id') id: string,
    @Body() updatePagamentoDto: UpdatePagamentoDto,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.updatePagamento(+id, updatePagamentoDto);
  }

  @Patch(':id/editar-completo')
  @ApiOperation({ summary: 'Atualizar todas as informações do pedido em uma única chamada' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido atualizado com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos para atualização completa',
  })
  updateCompleto(
    @Param('id') id: string,
    @Body() updatePedidoCompletoDto: UpdatePedidoCompletoDto,
    @Req() req,
  ): Promise<PedidoResponseDto> {
    const usuarioId = req.user.id;
    return this.pedidosService.updateCompleto(+id, updatePedidoCompletoDto, usuarioId);
  }

  @Patch(':id/finalizar')
  @ApiOperation({ summary: 'Finalizar pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido finalizado com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Status do pedido não permite finalização',
  })
  finalizar(@Param('id') id: string): Promise<PedidoResponseDto> {
    return this.pedidosService.finalizar(+id);
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido cancelado com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Não é possível cancelar pedidos finalizados',
  })
  cancelar(@Param('id') id: string): Promise<PedidoResponseDto> {
    return this.pedidosService.cancelar(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Só é possível remover pedidos cancelados ou recém criados',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.pedidosService.remove(+id);
  }
}
