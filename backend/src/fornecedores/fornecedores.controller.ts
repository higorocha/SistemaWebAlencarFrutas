import { Controller, Get, Post, Body, Patch, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FornecedoresService } from './fornecedores.service';
import { FornecedorPagamentosService } from './fornecedor-pagamentos.service';
import { 
  CreateFornecedorDto, 
  UpdateFornecedorDto, 
  FornecedorResponseDto,
  CreateFornecedorPagamentoDto,
  UpdateFornecedorPagamentoDto,
  FornecedorPagamentoResponseDto,
  CreateManyFornecedorPagamentoDto
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Fornecedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/fornecedores')
export class FornecedoresController {
  constructor(
    private readonly fornecedoresService: FornecedoresService,
    private readonly fornecedorPagamentosService: FornecedorPagamentosService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo fornecedor' })
  @ApiResponse({ status: 201, description: 'Fornecedor criado com sucesso', type: FornecedorResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'CNPJ ou CPF já existe' })
  create(@Body() createFornecedorDto: CreateFornecedorDto): Promise<FornecedorResponseDto> {
    return this.fornecedoresService.create(createFornecedorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os fornecedores' })
  @ApiResponse({ status: 200, description: 'Lista de fornecedores', type: [FornecedorResponseDto] })
  findAll(@Query('search') search?: string): Promise<FornecedorResponseDto[]> {
    return this.fornecedoresService.findAll(search);
  }

  // ========================================
  // ENDPOINTS DE PAGAMENTOS (devem vir ANTES do GET :id para evitar conflito)
  // ========================================

  @Get(':id/estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas detalhadas de colheitas de um fornecedor' })
  @ApiResponse({ status: 200, description: 'Estatísticas do fornecedor obtidas com sucesso' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  getEstatisticas(@Param('id') id: string) {
    return this.fornecedorPagamentosService.getEstatisticasPorFornecedor(+id);
  }

  @Get(':id/colheitas-pagamentos')
  @ApiOperation({ summary: 'Buscar colheitas e pagamentos de um fornecedor (endpoint para o modal)' })
  @ApiResponse({ status: 200, description: 'Dados de colheitas e pagamentos' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  getColheitasPagamentos(@Param('id') id: string) {
    return this.fornecedorPagamentosService.getColheitasPagamentos(+id);
  }

  @Get(':id/pagamentos/efetuados')
  @ApiOperation({ summary: 'Buscar pagamentos efetuados de um fornecedor' })
  @ApiResponse({ status: 200, description: 'Lista de pagamentos efetuados', type: [FornecedorPagamentoResponseDto] })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  getPagamentosEfetuados(@Param('id') id: string): Promise<FornecedorPagamentoResponseDto[]> {
    return this.fornecedorPagamentosService.getPagamentosEfetuados(+id);
  }

  @Get(':id/pagamentos-efetuados')
  @ApiOperation({ summary: 'Buscar pagamentos efetuados de um fornecedor agrupados por data de pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamentos efetuados agrupados por data de pagamento' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  getPagamentosEfetuadosAgrupados(@Param('id') id: string) {
    return this.fornecedorPagamentosService.getPagamentosEfetuadosAgrupados(+id);
  }

  @Get(':id/pagamentos/:pagamentoId')
  @ApiOperation({ summary: 'Buscar um pagamento específico' })
  @ApiResponse({ status: 200, description: 'Pagamento encontrado', type: FornecedorPagamentoResponseDto })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  findOnePagamento(
    @Param('id') id: string,
    @Param('pagamentoId') pagamentoId: string
  ): Promise<FornecedorPagamentoResponseDto> {
    return this.fornecedorPagamentosService.findOne(+id, +pagamentoId);
  }

  @Get(':id/pagamentos')
  @ApiOperation({ summary: 'Listar todos os pagamentos de um fornecedor' })
  @ApiResponse({ status: 200, description: 'Lista de pagamentos', type: [FornecedorPagamentoResponseDto] })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  findAllPagamentos(
    @Param('id') id: string,
    @Query('pedidoId') pedidoId?: string,
    @Query('frutaId') frutaId?: string,
    @Query('status') status?: string
  ): Promise<FornecedorPagamentoResponseDto[]> {
    const filters: any = {};
    if (pedidoId) filters.pedidoId = +pedidoId;
    if (frutaId) filters.frutaId = +frutaId;
    if (status) filters.status = status;
    return this.fornecedorPagamentosService.findAll(+id, filters);
  }

  @Post(':id/pagamentos/criar-multiplos')
  @ApiOperation({ summary: 'Criar múltiplos pagamentos para um fornecedor' })
  @ApiResponse({ status: 201, description: 'Pagamentos criados com sucesso', type: [FornecedorPagamentoResponseDto] })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Fornecedor, área, pedido ou fruta não encontrado' })
  @ApiResponse({ status: 409, description: 'Pagamento duplicado' })
  createManyPagamentos(
    @Param('id') id: string,
    @Body() createManyPagamentoDto: CreateManyFornecedorPagamentoDto
  ): Promise<FornecedorPagamentoResponseDto[]> {
    return this.fornecedorPagamentosService.createMany(+id, createManyPagamentoDto);
  }

  @Post(':id/pagamentos')
  @ApiOperation({ summary: 'Criar novo pagamento para um fornecedor' })
  @ApiResponse({ status: 201, description: 'Pagamento criado com sucesso', type: FornecedorPagamentoResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Fornecedor, área, pedido ou fruta não encontrado' })
  @ApiResponse({ status: 409, description: 'Pagamento duplicado' })
  createPagamento(
    @Param('id') id: string,
    @Body() createPagamentoDto: CreateFornecedorPagamentoDto
  ): Promise<FornecedorPagamentoResponseDto> {
    return this.fornecedorPagamentosService.create(+id, createPagamentoDto);
  }

  @Patch(':id/pagamentos/:pagamentoId')
  @ApiOperation({ summary: 'Atualizar um pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento atualizado com sucesso', type: FornecedorPagamentoResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou não é possível alterar pagamento pago' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  updatePagamento(
    @Param('id') id: string,
    @Param('pagamentoId') pagamentoId: string,
    @Body() updatePagamentoDto: UpdateFornecedorPagamentoDto
  ): Promise<FornecedorPagamentoResponseDto> {
    return this.fornecedorPagamentosService.update(+id, +pagamentoId, updatePagamentoDto);
  }

  @Delete(':id/pagamentos/:pagamentoId')
  @ApiOperation({ summary: 'Deletar um pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento deletado com sucesso' })
  @ApiResponse({ status: 400, description: 'Não é possível deletar pagamento pago ou em processamento' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  deletePagamento(
    @Param('id') id: string,
    @Param('pagamentoId') pagamentoId: string
  ): Promise<void> {
    return this.fornecedorPagamentosService.delete(+id, +pagamentoId);
  }

  // ========================================
  // ENDPOINTS DE FORNECEDORES (CRUD)
  // ========================================

  @Get(':id')
  @ApiOperation({ summary: 'Buscar fornecedor por ID' })
  @ApiResponse({ status: 200, description: 'Fornecedor encontrado', type: FornecedorResponseDto })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  findOne(@Param('id') id: string): Promise<FornecedorResponseDto> {
    return this.fornecedoresService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  @ApiResponse({ status: 200, description: 'Fornecedor atualizado com sucesso', type: FornecedorResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  @ApiResponse({ status: 409, description: 'CNPJ ou CPF já existe' })
  update(@Param('id') id: string, @Body() updateFornecedorDto: UpdateFornecedorDto): Promise<FornecedorResponseDto> {
    return this.fornecedoresService.update(+id, updateFornecedorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover fornecedor' })
  @ApiResponse({ status: 200, description: 'Fornecedor removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  @ApiResponse({ status: 409, description: 'Fornecedor tem áreas associadas' })
  remove(@Param('id') id: string): Promise<void> {
    return this.fornecedoresService.remove(+id);
  }
}

