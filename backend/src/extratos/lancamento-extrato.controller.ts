import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LancamentoExtratoService } from './lancamento-extrato.service';
import {
  CreateLancamentoExtratoDto,
  UpdateLancamentoExtratoDto,
  VincularLancamentoPedidoDto,
  QueryLancamentoExtratoDto,
  LancamentoExtratoResponseDto,
  VincularLancamentoPedidosResponseDto,
  BuscarProcessarExtratosDto,
  BuscarProcessarExtratosResponseDto,
  BuscarProcessarExtratosTodosClientesDto,
} from './dto/lancamento-extrato.dto';
import {
  LancamentoExtratoPedidoResponseDto,
  UpdateLancamentoExtratoPedidoDto,
  VincularLancamentoPedidosDto,
} from './dto/lancamento-extrato-pedido.dto';
import { CredenciaisAPIService } from '../credenciais-api/credenciais-api.service';
import { ContaCorrenteService } from '../conta-corrente/conta-corrente.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Lançamentos de Extrato')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/lancamentos-extrato')
export class LancamentoExtratoController {
  constructor(
    private readonly lancamentoExtratoService: LancamentoExtratoService,
    private readonly credenciaisAPIService: CredenciaisAPIService,
    private readonly contaCorrenteService: ContaCorrenteService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo lançamento de extrato' })
  @ApiBody({ type: CreateLancamentoExtratoDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lançamento criado com sucesso',
    type: LancamentoExtratoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente ou pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  async create(
    @Body() createDto: CreateLancamentoExtratoDto,
  ): Promise<LancamentoExtratoResponseDto> {
    return this.lancamentoExtratoService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os lançamentos com filtros opcionais' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de lançamentos',
    type: [LancamentoExtratoResponseDto],
  })
  async findAll(
    @Query() query?: QueryLancamentoExtratoDto,
  ): Promise<LancamentoExtratoResponseDto[]> {
    return this.lancamentoExtratoService.findAll(query);
  }

  @Get('contas-disponiveis')
  @ApiOperation({ summary: 'Listar contas correntes com credenciais de extratos disponíveis' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de contas correntes disponíveis',
    type: [Object],
  })
  async listarContasDisponiveis() {
    try {
      // Buscar todas as credenciais de extratos
      const credenciaisExtratos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '003 - Extratos');
      
      if (!credenciaisExtratos || credenciaisExtratos.length === 0) {
        return [];
      }
      
      // Extrair IDs únicos de contas correntes
      const contaCorrenteIds = [...new Set(credenciaisExtratos.map(c => c.contaCorrenteId).filter((id): id is number => typeof id === 'number' && id > 0))];
      
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
        .map(result => result.value);

      return contasValidas.map(conta => ({
        id: conta.id,
        agencia: conta.agencia,
        contaCorrente: conta.contaCorrente,
        banco: conta.bancoCodigo,
        nomeBanco: this.getNomeBanco(conta.bancoCodigo),
      }));
    } catch (error) {
      console.error('Erro ao listar contas disponíveis:', error);
      return [];
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um lançamento por ID' })
  @ApiParam({ name: 'id', description: 'ID do lançamento', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lançamento encontrado',
    type: LancamentoExtratoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lançamento não encontrado',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: string,
  ): Promise<LancamentoExtratoResponseDto> {
    return this.lancamentoExtratoService.findOne(BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um lançamento' })
  @ApiParam({ name: 'id', description: 'ID do lançamento', type: String })
  @ApiBody({ type: UpdateLancamentoExtratoDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lançamento atualizado com sucesso',
    type: LancamentoExtratoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lançamento ou pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateDto: UpdateLancamentoExtratoDto,
  ): Promise<LancamentoExtratoResponseDto> {
    return this.lancamentoExtratoService.update(BigInt(id), updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um lançamento' })
  @ApiParam({ name: 'id', description: 'ID do lançamento', type: String })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Lançamento removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lançamento não encontrado',
  })
  async remove(@Param('id', ParseIntPipe) id: string): Promise<void> {
    return this.lancamentoExtratoService.remove(BigInt(id));
  }

  @Post(':id/vincular-pedido')
  @ApiOperation({ summary: 'Vincular manualmente um lançamento a um pedido' })
  @ApiParam({ name: 'id', description: 'ID do lançamento', type: String })
  @ApiBody({ type: VincularLancamentoPedidoDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lançamento vinculado ao pedido com sucesso',
    type: LancamentoExtratoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lançamento ou pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'O pedido não pertence ao cliente do lançamento',
  })
  async vincularPedido(
    @Param('id', ParseIntPipe) id: string,
    @Body() vincularDto: VincularLancamentoPedidoDto,
  ): Promise<LancamentoExtratoResponseDto> {
    return this.lancamentoExtratoService.vincularPedido(BigInt(id), vincularDto);
  }

  @Post(':id/desvincular-pedido')
  @ApiOperation({ summary: 'Desvincular um lançamento de um pedido' })
  @ApiParam({ name: 'id', description: 'ID do lançamento', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lançamento desvinculado do pedido com sucesso',
    type: LancamentoExtratoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lançamento não encontrado',
  })
  async desvincularPedido(
    @Param('id', ParseIntPipe) id: string,
  ): Promise<LancamentoExtratoResponseDto> {
    return this.lancamentoExtratoService.desvincularPedido(BigInt(id));
  }

  @Get(':id/vinculos')
  @ApiOperation({ summary: 'Listar vínculos de pedidos para um lançamento' })
  @ApiParam({ name: 'id', description: 'ID do lançamento', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de vínculos associados ao lançamento',
    type: [LancamentoExtratoPedidoResponseDto],
  })
  async listarVinculos(
    @Param('id', ParseIntPipe) id: string,
  ): Promise<LancamentoExtratoPedidoResponseDto[]> {
    return this.lancamentoExtratoService.listarVinculos(BigInt(id));
  }

  @Post(':id/vinculos')
  @ApiOperation({ summary: 'Vincular múltiplos pedidos a um lançamento' })
  @ApiParam({ name: 'id', description: 'ID do lançamento', type: String })
  @ApiBody({ type: VincularLancamentoPedidosDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedidos vinculados com sucesso',
    type: VincularLancamentoPedidosResponseDto,
  })
  async vincularPedidos(
    @Param('id', ParseIntPipe) id: string,
    @Body() dto: VincularLancamentoPedidosDto,
  ): Promise<VincularLancamentoPedidosResponseDto> {
    return this.lancamentoExtratoService.vincularPedidos(BigInt(id), dto);
  }

  @Patch(':id/vinculos/:vinculoId')
  @ApiOperation({ summary: 'Atualizar um vínculo de pedido' })
  @ApiParam({ name: 'id', description: 'ID do lançamento', type: String })
  @ApiParam({ name: 'vinculoId', description: 'ID do vínculo', type: Number })
  @ApiBody({ type: UpdateLancamentoExtratoPedidoDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vínculo atualizado com sucesso',
    type: LancamentoExtratoResponseDto,
  })
  async atualizarVinculo(
    @Param('id', ParseIntPipe) id: string,
    @Param('vinculoId', ParseIntPipe) vinculoId: number,
    @Body() dto: UpdateLancamentoExtratoPedidoDto,
  ): Promise<LancamentoExtratoResponseDto> {
    return this.lancamentoExtratoService.atualizarValorVinculo(BigInt(id), vinculoId, dto);
  }

  @Delete(':id/vinculos/:vinculoId')
  @ApiOperation({ summary: 'Remover um vínculo de pedido' })
  @ApiParam({ name: 'id', description: 'ID do lançamento', type: String })
  @ApiParam({ name: 'vinculoId', description: 'ID do vínculo', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vínculo removido com sucesso',
    type: LancamentoExtratoResponseDto,
  })
  async removerVinculo(
    @Param('id', ParseIntPipe) id: string,
    @Param('vinculoId', ParseIntPipe) vinculoId: number,
  ): Promise<LancamentoExtratoResponseDto> {
    return this.lancamentoExtratoService.removerVinculo(BigInt(id), vinculoId);
  }

  @Post('buscar-processar')
  @ApiOperation({ summary: 'Buscar e processar extratos da API BB para um cliente' })
  @ApiBody({ type: BuscarProcessarExtratosDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Extratos processados com sucesso',
    type: BuscarProcessarExtratosResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente ou conta corrente não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou cliente sem CPF/CNPJ',
  })
  async buscarEProcessarExtratos(
    @Body() dto: BuscarProcessarExtratosDto,
  ): Promise<BuscarProcessarExtratosResponseDto> {
    try {
      console.log(`🔍 [CONTROLLER] Recebida requisição buscarEProcessarExtratos:`, {
        dataInicio: dto.dataInicio,
        dataFim: dto.dataFim,
        clienteId: dto.clienteId,
        clienteIds: dto.clienteIds,
        contaCorrenteId: dto.contaCorrenteId
      });
      return await this.lancamentoExtratoService.buscarEProcessarExtratos(dto);
    } catch (error) {
      console.error(`❌ [CONTROLLER] Erro em buscarEProcessarExtratos:`, {
        error: error.message,
        stack: error.stack,
        dto
      });
      throw error;
    }
  }

  @Post('buscar-processar-todos-clientes')
  @ApiOperation({ 
    summary: 'Buscar e processar extratos da API BB para TODOS os clientes com CPF/CNPJ',
    description: 'Faz uma única chamada à API e filtra os lançamentos comparando com todos os CPF/CNPJ cadastrados. Reutilizável por jobs automáticos.'
  })
  @ApiBody({ type: BuscarProcessarExtratosTodosClientesDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Extratos processados com sucesso',
    type: BuscarProcessarExtratosResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conta corrente não encontrada ou nenhum cliente com CPF/CNPJ',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  async buscarEProcessarExtratosTodosClientes(
    @Body() dto: BuscarProcessarExtratosTodosClientesDto,
  ): Promise<BuscarProcessarExtratosResponseDto> {
    try {
      console.log(`🔍 [CONTROLLER] Recebida requisição buscarEProcessarExtratosTodosClientes:`, {
        dataInicio: dto.dataInicio,
        dataFim: dto.dataFim,
        contaCorrenteId: dto.contaCorrenteId
      });
      return await this.lancamentoExtratoService.buscarEProcessarExtratosTodosClientes(dto);
    } catch (error) {
      console.error(`❌ [CONTROLLER] Erro em buscarEProcessarExtratosTodosClientes:`, {
        error: error.message,
        stack: error.stack,
        dto
      });
      throw error;
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
}

