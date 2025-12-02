// src/dashboard/dashboard.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@ApiTags('Dashboard')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Obter dados consolidados da dashboard geral' })
  @ApiResponse({
    status: 200,
    description: 'Dados da dashboard retornados com sucesso',
    type: DashboardResponseDto,
  })
  async getDashboardData(): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboardData();
  }

  @Get('painel-frutas/culturas-frutas')
  @ApiOperation({ summary: 'Obter dados para gráfico de culturas/frutas' })
  @ApiQuery({ name: 'tipo', required: false, enum: ['culturas', 'frutas'], description: 'Tipo de visualização' })
  @ApiQuery({ name: 'ids', required: false, type: [String], description: 'IDs selecionados (culturas ou frutas)' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data início (ISO 8601)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data fim (ISO 8601)' })
  @ApiResponse({
    status: 200,
    description: 'Dados do gráfico retornados com sucesso',
  })
  async getCulturasFrutas(
    @Query('tipo') tipo?: string,
    @Query('ids') ids?: string | string[],
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const idsArray = Array.isArray(ids) ? ids : ids ? [ids] : [];
    const tipoValidado: 'culturas' | 'frutas' = (tipo === 'culturas' || tipo === 'frutas') ? tipo : 'frutas';
    return this.dashboardService.getCulturasFrutas(
      tipoValidado,
      idsArray.map(id => parseInt(id, 10)),
      dataInicio,
      dataFim,
    );
  }

  @Get('painel-frutas/areas-frutas')
  @ApiOperation({ summary: 'Obter dados para gráfico de áreas e frutas' })
  @ApiQuery({ name: 'tipoArea', required: false, enum: ['proprias', 'fornecedores'], description: 'Tipo de área' })
  @ApiQuery({ name: 'frutaIds', required: false, type: [String], description: 'IDs das frutas selecionadas' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data início (ISO 8601)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data fim (ISO 8601)' })
  @ApiResponse({
    status: 200,
    description: 'Dados do gráfico retornados com sucesso',
  })
  async getAreasFrutas(
    @Query('tipoArea') tipoArea?: string,
    @Query('frutaIds') frutaIds?: string | string[],
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const frutaIdsArray = Array.isArray(frutaIds) ? frutaIds : frutaIds ? [frutaIds] : [];
    const tipoAreaValidado: 'proprias' | 'fornecedores' = (tipoArea === 'proprias' || tipoArea === 'fornecedores') ? tipoArea : 'proprias';
    return this.dashboardService.getAreasFrutas(
      tipoAreaValidado,
      frutaIdsArray.map(id => parseInt(id, 10)),
      dataInicio,
      dataFim,
    );
  }

  @Get('painel-frutas/listagem-areas')
  @ApiOperation({ summary: 'Obter listagem de áreas com frutas colhidas' })
  @ApiQuery({ name: 'busca', required: false, type: String, description: 'Busca por nome da área' })
  @ApiQuery({ name: 'frutaIds', required: false, type: [String], description: 'IDs das frutas para filtrar' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data início colheita (ISO 8601)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data fim colheita (ISO 8601)' })
  @ApiResponse({
    status: 200,
    description: 'Listagem de áreas retornada com sucesso',
  })
  async getListagemAreas(
    @Query('busca') busca?: string,
    @Query('frutaIds') frutaIds?: string | string[],
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const frutaIdsArray = Array.isArray(frutaIds) ? frutaIds : frutaIds ? [frutaIds] : [];
    return this.dashboardService.getListagemAreas(
      busca,
      frutaIdsArray.map(id => parseInt(id, 10)),
      dataInicio,
      dataFim,
    );
  }

  @Get('painel-frutas')
  async getPainelFrutas(
    @Query('mes') mes?: number,
    @Query('ano') ano?: number,
  ) {
    const mesNum = mes ? Number(mes) : undefined;
    const anoNum = ano ? Number(ano) : undefined;
    return this.dashboardService.getDadosPainelFrutas(mesNum, anoNum);
  }
}