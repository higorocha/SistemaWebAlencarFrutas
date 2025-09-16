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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TurmaColheitaService } from './turma-colheita.service';
import { CreateTurmaColheitaDto } from './dto/create-turma-colheita.dto';
import { UpdateTurmaColheitaDto } from './dto/update-turma-colheita.dto';
import { TurmaColheitaResponseDto } from './dto/turma-colheita-response.dto';
import { CreateTurmaColheitaPedidoCustoDto } from './dto/create-colheita-pedido.dto';
import { UpdateTurmaColheitaPedidoCustoDto } from './dto/update-colheita-pedido.dto';
import { TurmaColheitaPedidoCustoResponseDto } from './dto/colheita-pedido-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Turma de Colheita')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/turma-colheita')
export class TurmaColheitaController {
  constructor(private readonly turmaColheitaService: TurmaColheitaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova turma de colheita' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Turma de colheita criada com sucesso',
    type: TurmaColheitaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido ou fruta não encontrados',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Fruta não encontrada no pedido especificado',
  })
  create(@Body() createTurmaColheitaDto: CreateTurmaColheitaDto): Promise<TurmaColheitaResponseDto> {
    return this.turmaColheitaService.create(createTurmaColheitaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as turmas de colheita' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de turmas de colheita obtida com sucesso',
    type: [TurmaColheitaResponseDto],
  })
  findAll(): Promise<TurmaColheitaResponseDto[]> {
    return this.turmaColheitaService.findAll();
  }

  @Get('relatorio')
  @ApiOperation({ summary: 'Obter relatório das turmas de colheita' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Relatório obtido com sucesso',
  })
  getRelatorio() {
    return this.turmaColheitaService.getRelatorio();
  }

  // ========================================
  // ENDPOINTS PARA COLHEITAS DE PEDIDOS
  // ========================================

  @Post('custo-colheita')
  @ApiOperation({ summary: 'Criar um novo custo de colheita' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Custo de colheita criado com sucesso',
    type: TurmaColheitaPedidoCustoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Turma de colheita, pedido ou fruta não encontrados',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Fruta não encontrada no pedido especificado',
  })
  createColheitaPedido(@Body() createCustoDto: CreateTurmaColheitaPedidoCustoDto): Promise<TurmaColheitaPedidoCustoResponseDto> {
    return this.turmaColheitaService.createCustoColheita(createCustoDto);
  }

  @Get('colheita-pedido')
  @ApiOperation({ summary: 'Listar todas as colheitas de pedidos' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de colheitas de pedidos obtida com sucesso',
    type: [TurmaColheitaPedidoCustoResponseDto],
  })
  findAllColheitasPedidos(): Promise<TurmaColheitaPedidoCustoResponseDto[]> {
    return this.turmaColheitaService.findAllColheitasPedidos();
  }

  @Get('colheita-pedido/:id')
  @ApiOperation({ summary: 'Buscar uma colheita de pedido por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Colheita de pedido encontrada com sucesso',
    type: TurmaColheitaPedidoCustoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Colheita de pedido não encontrada',
  })
  findOneColheitaPedido(@Param('id') id: string): Promise<TurmaColheitaPedidoCustoResponseDto> {
    return this.turmaColheitaService.findOneColheitaPedido(+id);
  }

  @Patch('colheita-pedido/:id')
  @ApiOperation({ summary: 'Atualizar uma colheita de pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Colheita de pedido atualizada com sucesso',
    type: TurmaColheitaPedidoCustoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Colheita de pedido não encontrada',
  })
  updateColheitaPedido(
    @Param('id') id: string,
    @Body() updateColheitaPedidoDto: UpdateTurmaColheitaPedidoCustoDto,
  ): Promise<TurmaColheitaPedidoCustoResponseDto> {
    return this.turmaColheitaService.updateColheitaPedido(+id, updateColheitaPedidoDto);
  }

  @Delete('colheita-pedido/:id')
  @ApiOperation({ summary: 'Remover uma colheita de pedido' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Colheita de pedido removida com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Colheita de pedido não encontrada',
  })
  removeColheitaPedido(@Param('id') id: string): Promise<void> {
    return this.turmaColheitaService.removeColheitaPedido(+id);
  }

  @Get('colheita-pedido/pedido/:pedidoId')
  @ApiOperation({ summary: 'Listar colheitas de pedidos por pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Colheitas de pedidos do pedido obtidas com sucesso',
    type: [TurmaColheitaPedidoCustoResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  findColheitasByPedido(@Param('pedidoId') pedidoId: string): Promise<TurmaColheitaPedidoCustoResponseDto[]> {
    return this.turmaColheitaService.findColheitasByPedido(+pedidoId);
  }

  @Get('colheita-pedido/turma/:turmaId')
  @ApiOperation({ summary: 'Listar colheitas de pedidos por turma' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Colheitas de pedidos da turma obtidas com sucesso',
    type: [TurmaColheitaPedidoCustoResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Turma de colheita não encontrada',
  })
  findColheitasByTurma(@Param('turmaId') turmaId: string): Promise<TurmaColheitaPedidoCustoResponseDto[]> {
    return this.turmaColheitaService.findColheitasByTurma(+turmaId);
  }

  @Get('pedido/:pedidoId')
  @ApiOperation({ summary: 'Listar turmas de colheita por pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turmas de colheita do pedido obtidas com sucesso',
    type: [TurmaColheitaResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  findByPedido(@Param('pedidoId') pedidoId: string): Promise<TurmaColheitaResponseDto[]> {
    return this.turmaColheitaService.findByPedido(+pedidoId);
  }

  @Get('fruta/:frutaId')
  @ApiOperation({ summary: 'Listar turmas de colheita por fruta' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turmas de colheita da fruta obtidas com sucesso',
    type: [TurmaColheitaResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Fruta não encontrada',
  })
  findByFruta(@Param('frutaId') frutaId: string): Promise<TurmaColheitaResponseDto[]> {
    return this.turmaColheitaService.findByFruta(+frutaId);
  }

  @Get(':id/estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas detalhadas de uma turma de colheita' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas da turma obtidas com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Turma de colheita não encontrada',
  })
  getEstatisticas(@Param('id') id: string) {
    return this.turmaColheitaService.getEstatisticasPorTurma(+id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma turma de colheita por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turma de colheita encontrada com sucesso',
    type: TurmaColheitaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Turma de colheita não encontrada',
  })
  findOne(@Param('id') id: string): Promise<TurmaColheitaResponseDto> {
    return this.turmaColheitaService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma turma de colheita' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turma de colheita atualizada com sucesso',
    type: TurmaColheitaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Turma de colheita não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Fruta não encontrada no pedido especificado',
  })
  update(
    @Param('id') id: string,
    @Body() updateTurmaColheitaDto: UpdateTurmaColheitaDto,
  ): Promise<TurmaColheitaResponseDto> {
    return this.turmaColheitaService.update(+id, updateTurmaColheitaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma turma de colheita' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Turma de colheita removida com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Turma de colheita não encontrada',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.turmaColheitaService.remove(+id);
  }
}