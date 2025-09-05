import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
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

  @Get()
  @ApiOperation({ summary: 'Buscar todas as áreas agrícolas' })
  @ApiResponse({ status: 200, description: 'Lista de áreas agrícolas retornada com sucesso', type: [AreaResponseDto] })
  findAll() {
    return this.areasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma área agrícola específica' })
  @ApiResponse({ status: 200, description: 'Área agrícola encontrada', type: AreaResponseDto })
  @ApiResponse({ status: 404, description: 'Área agrícola não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.areasService.findOne(+id);
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
} 