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
  UsePipes,
  ValidationPipe,
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
import { TurmaColheitaService } from '../../turma-colheita/turma-colheita.service';
import {
  MobilePedidoFiltersDto,
  MobileColheitaDto,
  MobilePedidosListResponseDto,
  MobileDashboardDto,
  MobilePedidoSimplificadoDto,
  MobileUpdatePedidoDto,
} from '../dto';
import { UpdateColheitaDto, CreatePedidoDto, PedidoResponseDto, UpdatePrecificacaoDto, UpdatePedidoDto, UpdatePedidoCompletoDto } from '../../pedidos/dto';
import { CreateTurmaColheitaPedidoCustoDto } from '../../turma-colheita/dto/create-colheita-pedido.dto';
import { TurmaColheitaPedidoCustoResponseDto } from '../../turma-colheita/dto/colheita-pedido-response.dto';
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
  constructor(
    private readonly pedidosService: PedidosService,
    private readonly turmaColheitaService: TurmaColheitaService,
  ) {}

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
   * Atualizar dados básicos de um pedido via mobile
   */
  @Patch(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  @Niveis(
    NivelUsuario.ADMINISTRADOR,
    NivelUsuario.GERENTE_GERAL,
    NivelUsuario.ESCRITORIO,
    NivelUsuario.GERENTE_CULTURA,
  )
  @ApiOperation({
    summary: 'Atualizar dados básicos do pedido',
    description:
      'Permite ajustar informações como cliente, datas e observações diretamente pelo aplicativo mobile.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido atualizado com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sem permissão para atualizar este pedido',
  })
  async atualizarPedidoMobile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MobileUpdatePedidoDto,
    @Req() request: any,
  ): Promise<PedidoResponseDto> {
    const usuarioId = request?.user?.id;
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    if (usuarioNivel === NivelUsuario.GERENTE_CULTURA) {
      const pedido = await this.pedidosService.findOne(
        id,
        usuarioNivel,
        usuarioCulturaId,
      );

      const temAcesso = this.validarAcessoPorCultura(pedido, usuarioCulturaId);
      if (!temAcesso) {
        throw new ForbiddenException(
          'Você não tem permissão para atualizar este pedido',
        );
      }
    }

    const updateDto: UpdatePedidoDto = {
      clienteId: dto.clienteId,
      dataPedido: dto.dataPedido,
      dataPrevistaColheita: dto.dataPrevistaColheita,
      observacoes: dto.observacoes,
      placaPrimaria: dto.placaPrimaria,
      placaSecundaria: dto.placaSecundaria,
    };

    return this.pedidosService.update(id, updateDto, usuarioId);
  }

  /**
   * Atualização completa do pedido (inclui frutas)
   * Reutiliza o método updateCompleto do serviço web para evitar duplicação
   */
  @Patch(':id/completo')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  @Niveis(
    NivelUsuario.ADMINISTRADOR,
    NivelUsuario.GERENTE_GERAL,
    NivelUsuario.ESCRITORIO,
  )
  @ApiOperation({
    summary: 'Atualização completa do pedido (mobile)',
    description:
      'Permite editar frutas, quantidades e dados básicos do pedido reaproveitando a lógica do sistema web.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido atualizado com sucesso',
    type: PedidoResponseDto,
  })
  async atualizarPedidoCompletoMobile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePedidoCompletoDto,
    @Req() request: any,
  ): Promise<PedidoResponseDto> {
    const usuarioId = request?.user?.id;
    return this.pedidosService.updateCompleto(id, dto, usuarioId);
  }

  /**
   * Registrar colheita de um pedido
   * Converte DTO mobile para DTO do service existente
   * Permite propriedades extras (como areaNome, maoObra) que são ignoradas na conversão
   */
  @Patch(':id/colheita')
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: false, // Permitir propriedades extras (serão ignoradas no converter)
    transform: true 
  }))
  @ApiOperation({
    summary: 'Registrar colheita pelo mobile',
    description: 'Registra colheita de frutas com áreas, fitas e campos de frete',
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

  /**
   * Registrar mão de obra (custo de colheita)
   * Reutiliza o TurmaColheitaService existente
   */
  @Post(':id/mao-obra')
  @ApiOperation({
    summary: 'Registrar mão de obra pelo mobile',
    description: 'Registra o custo de mão de obra para uma colheita de um pedido',
  })
  @ApiParam({ name: 'id', description: 'ID do pedido', type: Number })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Mão de obra registrada com sucesso',
    type: TurmaColheitaPedidoCustoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sem permissão para registrar mão de obra neste pedido',
  })
  async registrarMaoObra(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTurmaColheitaPedidoCustoDto,
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
          'Você não tem permissão para acessar este pedido',
        );
      }
    }

    // Garantir que o pedidoId no DTO é o correto
    dto.pedidoId = id;

    // Chamar service existente
    return this.turmaColheitaService.createCustoColheita(dto);
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
      dataPedido: pedido.dataPedido,
      dataPrevistaColheita: pedido.dataPrevistaColheita,
      dataColheita: pedido.dataColheita,
      observacoes: pedido.observacoes ?? undefined,
      placaPrimaria: pedido.placaPrimaria ?? undefined,
      placaSecundaria: pedido.placaSecundaria ?? undefined,
      frutas:
        pedido.frutasPedidos?.map((fp: any) => ({
          id: fp.id,
          frutaId: fp.frutaId, // Adicionar frutaId para correspondência com mão de obra
          nome: fp.fruta?.nome || 'Fruta não informada',
          dePrimeira: fp.fruta?.dePrimeira ?? false,
          quantidadePrevista: fp.quantidadePrevista || 0,
          quantidadeReal: fp.quantidadeReal,
          quantidadeReal2: fp.quantidadeReal2,
          unidade: fp.unidadeMedida1 || '',
          unidade2: fp.unidadeMedida2 || undefined,
          unidadeMedida1: fp.unidadeMedida1 || '',
          unidadeMedida2: fp.unidadeMedida2 || undefined,
          cultura: fp.fruta?.cultura?.descricao,
          culturaId: fp.fruta?.cultura?.id, // ID da cultura (para filtrar áreas)
          // Enriquecer com áreas vinculadas
          areas: Array.isArray(fp.areas)
            ? fp.areas
                .map((a: any) => ({
                  id: a.id,
                  areaPropriaId: a.areaPropriaId ?? undefined,
                  areaFornecedorId: a.areaFornecedorId ?? undefined,
                  areaNome: a.areaPropria?.nome || a.areaFornecedor?.nome,
                  observacoes: a.observacoes ?? undefined,
                  quantidadeColhidaUnidade1: a.quantidadeColhidaUnidade1 ?? undefined,
                  quantidadeColhidaUnidade2: a.quantidadeColhidaUnidade2 ?? undefined,
                }))
                .filter((a: any) => a.areaPropriaId || a.areaFornecedorId)
            : undefined,
          // Enriquecer com fitas vinculadas (banana)
          fitas: Array.isArray(fp.fitas)
            ? fp.fitas.map((f: any) => ({
                id: f.id,
                fitaBananaId: f.fitaBananaId,
                fitaNome: f.fitaBanana?.nome,
                corHex: f.fitaBanana?.corHex,
                quantidadeFita: f.quantidadeFita ?? undefined,
                observacoes: f.observacoes ?? undefined,
                detalhesAreas: [
                  {
                    areaId: f.controleBanana?.areaAgricola?.id,
                    areaNome: f.controleBanana?.areaAgricola?.nome,
                    controleBananaId: f.controleBananaId,
                    quantidade: f.quantidadeFita ?? undefined,
                  },
                ],
              }))
            : undefined,
        })) || [],
      vencido:
        dataPrevisao && diasDesdePrevisao
          ? diasDesdePrevisao > 0 &&
            pedido.status !== StatusPedido.COLHEITA_REALIZADA &&
            pedido.status !== StatusPedido.PEDIDO_FINALIZADO
          : false,
      diasDesdePrevisao,
      // Adicionar mão de obra (custos de colheita)
      maoObra: pedido.custosColheita?.map((custo: any) => ({
        id: custo.id,
        turmaColheitaId: custo.turmaColheitaId,
        frutaId: custo.frutaId,
        quantidadeColhida: custo.quantidadeColhida,
        valorColheita: custo.valorColheita,
        observacoes: custo.observacoes,
      })) || [],
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
        quantidadeReal2: (f as any).quantidadeReal2,
        areas: this.converterAreas(f),
        fitas: this.converterFitas((f as any).fitas),
      })),
      observacoesColheita: dto.observacoesColheita,
      // Campos de frete
      pesagem: dto.pesagem,
      placaPrimaria: dto.placaPrimaria,
      placaSecundaria: dto.placaSecundaria,
      nomeMotorista: dto.nomeMotorista,
      // Mão de obra (agora processada junto com colheita)
      maoObra: dto.maoObra as any, // Cast necessário pois unidadeMedida é opcional no mobile mas obrigatória no DTO (backend trata quando ausente)
    };
  }

  /**
   * Converte áreas do formato mobile para formato do DTO
   */
  private converterAreas(fruta: any): any[] | undefined {
    // Se o formato já vier como array de áreas completo
    if (Array.isArray(fruta.areas)) {
      return fruta.areas.map((a: any) => {
        const areaFormatada: any = {
          areaPropriaId: a.areaPropriaId ?? undefined,
          areaFornecedorId: a.areaFornecedorId ?? undefined,
          observacoes: a.observacoes ?? undefined,
          quantidadeColhidaUnidade1: a.quantidadeColhidaUnidade1 ?? undefined,
          quantidadeColhidaUnidade2: a.quantidadeColhidaUnidade2 ?? undefined,
        };
        // Incluir id apenas se existir (para update de área existente)
        if (a.id !== undefined && a.id !== null) {
          areaFormatada.id = a.id;
        }
        return areaFormatada;
      });
    }

    // Compatibilidade com payload antigo (campos simples)
    const areas: any[] = [];
    if (fruta.areaAgricolaId) {
      areas.push({ areaPropriaId: fruta.areaAgricolaId });
    }
    if (fruta.areaFornecedorId) {
      areas.push({ areaFornecedorId: fruta.areaFornecedorId });
    }
    return areas.length > 0 ? areas : undefined;
  }

  private converterFitas(fitas: any[] | undefined): any[] | undefined {
    if (!Array.isArray(fitas) || fitas.length === 0) return undefined;
    return fitas.map((f: any) => {
      const fitaFormatada: any = {
        fitaBananaId: f.fitaBananaId,
        quantidadeFita: f.quantidadeFita ?? undefined,
        observacoes: f.observacoes ?? undefined,
        detalhesAreas: f.detalhesAreas ?? [],
      };
      // Incluir id apenas se existir (para update de fita existente)
      if (f.id !== undefined && f.id !== null) {
        fitaFormatada.id = f.id;
      }
      return fitaFormatada;
    });
  }

  /**
   * Valida se usuário tem acesso a um pedido baseado em sua cultura
   */
  private validarAcessoPorCultura(pedido: any, culturaId: number | undefined): boolean {
    if (!culturaId) return false;

    // Verifica se alguma fruta do pedido pertence à cultura do usuário
    // A estrutura do Prisma retorna fruta.cultura.id (objeto relacionado), não fruta.culturaId
    return pedido.frutasPedidos?.some(
      (fp: any) => fp.fruta?.cultura?.id === culturaId,
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
   * Definir precificação do pedido via mobile
   * Reutiliza o service principal de precificação
   * Nota: GERENTE_CULTURA não tem acesso a esta funcionalidade
   */
  @Patch(':id/precificacao')
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: false,
    transform: true 
  }))
  @Niveis(
    NivelUsuario.ADMINISTRADOR,
    NivelUsuario.GERENTE_GERAL,
    NivelUsuario.ESCRITORIO,
  )
  @ApiOperation({
    summary: 'Definir precificação pelo mobile',
    description: 'Define a precificação de um pedido com valores unitários, frete, ICMS, desconto e avaria. Disponível para ADMINISTRADOR, GERENTE_GERAL e ESCRITORIO.',
  })
  @ApiParam({ name: 'id', description: 'ID do pedido', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Precificação definida com sucesso',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou status do pedido não permite precificação',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sem permissão para precificar este pedido',
  })
  async definirPrecificacaoMobile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrecificacaoDto,
    @Req() request: any,
  ): Promise<PedidoResponseDto> {
    const usuarioId = request?.user?.id;

    // Chamar service existente
    // O decorator @Niveis já garante que apenas ADMINISTRADOR, GERENTE_GERAL e ESCRITORIO têm acesso
    return this.pedidosService.updatePrecificacao(id, dto, usuarioId);
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
    @Req() request: any,
  ): Promise<PedidoResponseDto> {
    const usuarioId = request?.user?.id;
    // Criar pedido usando o service principal com origem 'mobile'
    return this.pedidosService.create(createPedidoDto, usuarioId, 'mobile');
  }
}
