import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto } from './dto';

@ApiTags('Áreas Agrícolas')
@Controller('api/areas-agricolas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova área agrícola' })
  @ApiResponse({ status: 201, description: 'Área agrícola criada com sucesso', type: AreaResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Área com este nome já existe' })
  create(@Body() createAreaDto: CreateAreaDto) {
    return this.areasService.create(createAreaDto);
  }

  @Get('buscar')
  @ApiOperation({ summary: 'Buscar áreas por nome' })
  @ApiResponse({ status: 200, description: 'Áreas encontradas', type: [AreaResponseDto] })
  buscarPorNome(@Query('termo') termo: string) {
    return this.areasService.buscarPorNome(termo);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar todas as áreas agrícolas ativas' })
  @ApiResponse({ status: 200, description: 'Lista de áreas agrícolas ativas retornada com sucesso', type: [AreaResponseDto] })
  findAll() {
    return this.areasService.findAll();
  }

  @Get('todas')
  @ApiOperation({ summary: 'Buscar todas as áreas agrícolas (incluindo desativadas) - Para administração' })
  @ApiResponse({ status: 200, description: 'Lista completa de áreas agrícolas retornada com sucesso', type: [AreaResponseDto] })
  findAllIncludingInactive() {
    return this.areasService.findAllIncludingInactive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma área agrícola específica' })
  @ApiResponse({ status: 200, description: 'Área agrícola encontrada', type: AreaResponseDto })
  @ApiResponse({ status: 404, description: 'Área agrícola não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.areasService.findOne(+id);
  }

  @Get(':id/detalhes')
  @ApiOperation({ summary: 'Buscar detalhes completos da área com estatísticas e KPIs' })
  @ApiResponse({ status: 200, description: 'Detalhes da área retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Área agrícola não encontrada' })
  findDetalhes(@Param('id', ParseIntPipe) id: string) {
    return this.areasService.findDetalhes(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma área agrícola' })
  @ApiResponse({ status: 200, description: 'Área agrícola atualizada com sucesso', type: AreaResponseDto })
  @ApiResponse({ status: 404, description: 'Área agrícola não encontrada' })
  @ApiResponse({ status: 409, description: 'Área com este nome já existe' })
  update(@Param('id', ParseIntPipe) id: string, @Body() updateAreaDto: UpdateAreaDto) {
    return this.areasService.update(+id, updateAreaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma área agrícola' })
  @ApiResponse({ status: 200, description: 'Área agrícola excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Área agrícola não encontrada' })
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.areasService.remove(+id);
  }

  @Patch(':id/toggle-desativar')
  @ApiOperation({ summary: 'Desativar/Reativar uma área agrícola' })
  @ApiResponse({ status: 200, description: 'Status da área alterado com sucesso', type: AreaResponseDto })
  @ApiResponse({ status: 404, description: 'Área agrícola não encontrada' })
  toggleDesativar(@Param('id', ParseIntPipe) id: string) {
    return this.areasService.toggleDesativar(+id);
  }
} 