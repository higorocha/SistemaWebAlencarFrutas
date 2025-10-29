import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissoesGuard } from '../../auth/guards/permissoes.guard';
import { Niveis } from '../../auth/decorators/niveis.decorator';
import { CulturaGuard } from '../guards/cultura.guard';
import { NivelUsuario } from '../../auth/dto';
import { PedidosService } from '../../pedidos/pedidos.service';
import {
  MobilePedidoFiltersDto,
  MobileColheitaDto,
  MobilePedidosListResponseDto,
  MobileDashboardDto,
  MobilePedidoSimplificadoDto,
} from '../dto';
import { UpdateColheitaDto, CreatePedidoDto, PedidoResponseDto } from '../../pedidos/dto';
import { StatusPedido } from '@prisma/client';

/**
 * Controller específico para o aplicativo mobile
 * Reutiliza a lógica do PedidosService mas adapta respostas e aplica filtros específicos
 */
@ApiTags('Mobile - Pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissoesGuard, CulturaGuard)
@Niveis(
  NivelUsuario.GERENTE_CULTURA,
  NivelUsuario.ADMINISTRADOR,
  NivelUsuario.GERENTE_GERAL,
  NivelUsuario.ESCRITORIO,
)
@Controller('api/mobile/pedidos')
export class PedidosMobileController {
  constructor(private readonly pedidosService: PedidosService) {}

  /**
   * Dashboard simplificado para mobile
   * Retorna contadores e pedidos recentes filtrados por cultura
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard simplificado para mobile',
    description:
      'Retorna estatísticas de colheita filtradas por cultura (para GERENTE_CULTURA)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard mobile obtido com sucesso',
    type: MobileDashboardDto,
  })
  async getDashboardMobile(@Req() request: any): Promise<MobileDashboardDto> {
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    // Buscar estatísticas do dashboard original
    const stats = await this.pedidosService.getDashboardStats(
      1,
      10,
      usuarioNivel,
      usuarioCulturaId,
    );

    // Buscar pedidos recentes (últimos 10)
    const pedidosRecentes = await this.pedidosService.findAll(
      1,
      10,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      usuarioNivel,
      usuarioCulturaId,
    );

    return {
      aguardandoColheita:
        (stats.aguardandoColheita?.total || 0) +
        (stats.pedidoCriado?.total || 0),
      colheitaParcial: stats.colheitaParcial?.total || 0,
      colheitasRealizadasHoje: this.contarColheitasHoje(
        stats.colheitaRealizada?.pedidos || [],
      ),
      colheitasRealizadasSemana: this.contarColheitasSemana(
        stats.colheitaRealizada?.pedidos || [],
      ),
      pedidosRecentes: this.adaptarPedidosParaMobile(pedidosRecentes.data),
    };
  }

  /**
   * Listar pedidos com filtros específicos para mobile
   * Filtrado automaticamente por cultura para GERENTE_CULTURA
   */
  @Get()
  @ApiOperation({
    summary: 'Listar pedidos para mobile',
    description:
      'Lista pedidos filtrados por cultura e status específicos para o app mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedidos listados com sucesso',
    type: MobilePedidosListResponseDto,
  })
  async listarPedidosMobile(
    @Req() request: any,
    @Query() filters?: MobilePedidoFiltersDto,
  ): Promise<MobilePedidosListResponseDto> {
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    // Determinar status a filtrar baseado nos filtros mobile
    let statusFiltro: string[] | undefined;

    if (filters?.aguardandoColheita) {
      statusFiltro = [
        StatusPedido.AGUARDANDO_COLHEITA,
        StatusPedido.PEDIDO_CRIADO,
      ];
    } else if (filters?.colheitasPendentes) {
      statusFiltro = [
        StatusPedido.COLHEITA_PARCIAL,
        StatusPedido.AGUARDANDO_COLHEITA,
      ];
    } else if (filters?.status && filters.status.length > 0) {
      statusFiltro = filters.status;
    }

    // Buscar pedidos usando o service existente
    const pedidos = await this.pedidosService.findAll(
      1,                  // page
      1000,               // limit (retornar "tudo")
      undefined,          // search (não usado)
      undefined,          // searchType (não usado)
      statusFiltro,       // status (array de status de pedido)
      undefined,          // clienteId (não usado)
      undefined,          // dataInicio (não usado)
      undefined,          // dataFim (não usado)
      undefined,          // tipoData (não usado)
      undefined,          // filters (não usado)
      usuarioNivel,       // usuarioNivel (filtro de cultura para GERENTE_CULTURA)
      usuarioCulturaId,   // usuarioCulturaId (ID da cultura do usuário)
    );

    return {
      data: this.adaptarPedidosParaMobile(pedidos.data),
      total: pedidos.total,
      filtrosAplicados: {
        status: filters?.status,
        cultura:
          usuarioCulturaId && usuarioNivel === NivelUsuario.GERENTE_CULTURA
            ? `Cultura ID ${usuarioCulturaId}`
            : undefined,
      },
    };
  }

  /**
   * Buscar detalhes de um pedido específico
   * Valida se usuário tem acesso baseado em cultura
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar detalhes de um pedido',
    description: 'Retorna detalhes completos de um pedido específico',
  })
  @ApiParam({ name: 'id', description: 'ID do pedido', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido encontrado',
    type: MobilePedidoSimplificadoDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sem permissão para acessar este pedido',
  })
  async buscarPedido(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: any,
  ): Promise<MobilePedidoSimplificadoDto> {
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    // Buscar pedido usando service existente
    const pedido = await this.pedidosService.findOne(
      id,
      usuarioNivel,
      usuarioCulturaId,
    );

    // Validar acesso baseado em cultura
    if (usuarioNivel === NivelUsuario.GERENTE_CULTURA) {
      const temAcesso = this.validarAcessoPorCultura(
        pedido,
        usuarioCulturaId,
      );
      if (!temAcesso) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este pedido',
        );
      }
    }

    return this.adaptarPedidoParaMobile(pedido);
  }

  /**
   * Registrar colheita de um pedido
   * Converte DTO mobile para DTO do service existente
   */
  @Patch(':id/colheita')
  @ApiOperation({
    summary: 'Registrar colheita pelo mobile',
    description: 'Registra colheita de frutas sem sistema de fitas (MVP)',
  })
  @ApiParam({ name: 'id', description: 'ID do pedido', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Colheita registrada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sem permissão para registrar colheita neste pedido',
  })
  async registrarColheitaMobile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MobileColheitaDto,
    @Req() request: any,
  ) {
    const usuarioId = request?.user?.id;
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    // Validar acesso ao pedido
    const pedido = await this.pedidosService.findOne(
      id,
      usuarioNivel,
      usuarioCulturaId,
    );

    if (usuarioNivel === NivelUsuario.GERENTE_CULTURA) {
      const temAcesso = this.validarAcessoPorCultura(
        pedido,
        usuarioCulturaId,
      );
      if (!temAcesso) {
        throw new ForbiddenException(
          'Você não tem permissão para registrar colheita neste pedido',
        );
      }
    }

    // Converter DTO mobile para DTO do service
    const colheitaDto = this.converterParaColheitaDto(dto);

    // Chamar service existente
    return this.pedidosService.updateColheita(id, colheitaDto, usuarioId);
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Adapta lista de pedidos para formato mobile simplificado
   */
  private adaptarPedidosParaMobile(pedidos: any[]): MobilePedidoSimplificadoDto[] {
    return pedidos.map((p) => this.adaptarPedidoParaMobile(p));
  }

  /**
   * Adapta um pedido individual para formato mobile
   */
  private adaptarPedidoParaMobile(pedido: any): MobilePedidoSimplificadoDto {


    const hoje = new Date();
    const dataPrevisao = pedido.dataPrevistaColheita
      ? new Date(pedido.dataPrevistaColheita)
      : null;

    const diasDesdePrevisao = dataPrevisao
      ? Math.floor((hoje.getTime() - dataPrevisao.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    return {
      id: pedido.id,
      numeroPedido: pedido.numeroPedido,
      cliente: pedido.cliente,
      status: pedido.status,
      dataPrevistaColheita: pedido.dataPrevistaColheita,
      dataColheita: pedido.dataColheita,
      frutas:
        pedido.frutasPedidos?.map((fp: any) => ({
          id: fp.id,
          nome: fp.fruta?.nome || 'Fruta não informada',
          quantidadePrevista: fp.quantidadePrevista || 0,
          quantidadeReal: fp.quantidadeReal,
          unidade: fp.unidadeMedida1 || '',
          cultura: fp.fruta?.cultura?.descricao,
        })) || [],
      vencido:
        dataPrevisao && diasDesdePrevisao
          ? diasDesdePrevisao > 0 &&
            pedido.status !== StatusPedido.COLHEITA_REALIZADA &&
            pedido.status !== StatusPedido.PEDIDO_FINALIZADO
          : false,
      diasDesdePrevisao,
    };
  }

  /**
   * Converte DTO mobile para DTO do service de colheita
   */
  private converterParaColheitaDto(dto: MobileColheitaDto): UpdateColheitaDto {
    return {
      dataColheita: new Date(dto.dataColheita),
      frutas: dto.frutas.map((f) => ({
        frutaPedidoId: f.frutaPedidoId,
        quantidadeReal: f.quantidadeReal,
        // Áreas: converter formato mobile para formato do DTO
        areas: this.converterAreas(f),
      })),
      observacoesColheita: dto.observacoesColheita,
    };
  }

  /**
   * Converte áreas do formato mobile para formato do DTO
   */
  private converterAreas(fruta: any): any[] | undefined {
    const areas: any[] = [];

    // Se tem área própria
    if (fruta.areaAgricolaId) {
      areas.push({
        areaPropriaId: fruta.areaAgricolaId,
      });
    }

    // Se tem área de fornecedor
    if (fruta.areaFornecedorId) {
      areas.push({
        areaFornecedorId: fruta.areaFornecedorId,
      });
    }

    return areas.length > 0 ? areas : undefined;
  }

  /**
   * Valida se usuário tem acesso a um pedido baseado em sua cultura
   */
  private validarAcessoPorCultura(pedido: any, culturaId: number | undefined): boolean {
    if (!culturaId) return false;

    // Verifica se alguma fruta do pedido pertence à cultura do usuário
    return pedido.frutasPedidos?.some(
      (fp: any) => fp.fruta?.culturaId === culturaId,
    );
  }

  /**
   * Conta colheitas realizadas hoje
   */
  private contarColheitasHoje(pedidos: any[]): number {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return pedidos.filter((p) => {
      if (!p.dataColheita) return false;
      const dataColheita = new Date(p.dataColheita);
      dataColheita.setHours(0, 0, 0, 0);
      return dataColheita.getTime() === hoje.getTime();
    }).length;
  }

  /**
   * Conta colheitas realizadas esta semana
   */
  private contarColheitasSemana(pedidos: any[]): number {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
    inicioSemana.setHours(0, 0, 0, 0);

    return pedidos.filter((p) => {
      if (!p.dataColheita) return false;
      const dataColheita = new Date(p.dataColheita);
      return dataColheita >= inicioSemana;
    }).length;
  }

  /**
   * Criar novo pedido via mobile
   * Reutiliza o service principal de criação
   * Nota: GERENTE_CULTURA não tem acesso a esta funcionalidade
   */
  @Post()
  @ApiOperation({
    summary: 'Criar novo pedido via mobile',
    description: 'Cria um novo pedido. Disponível para ADMINISTRADOR, GERENTE_GERAL e ESCRITORIO.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pedido criado com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @Niveis(
    NivelUsuario.ADMINISTRADOR,
    NivelUsuario.GERENTE_GERAL,
    NivelUsuario.ESCRITORIO,
  )
  async createPedido(
    @Body() createPedidoDto: CreatePedidoDto,
  ): Promise<PedidoResponseDto> {
    // Criar pedido usando o service principal
    return this.pedidosService.create(createPedidoDto);
  }
}
