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
import { CulturasService } from './culturas.service';
import { CreateCulturaDto, UpdateCulturaDto, CulturaResponseDto } from './dto';

@ApiTags('Culturas')
@Controller('api/culturas')
export class CulturasController {
  constructor(private readonly culturasService: CulturasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova cultura' })
  @ApiResponse({ status: 201, description: 'Cultura criada com sucesso', type: CulturaResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Cultura com esta descrição já existe' })
  create(@Body() createCulturaDto: CreateCulturaDto) {
    return this.culturasService.create(createCulturaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar todas as culturas' })
  @ApiResponse({ status: 200, description: 'Lista de culturas retornada com sucesso', type: [CulturaResponseDto] })
  findAll() {
    return this.culturasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma cultura específica' })
  @ApiResponse({ status: 200, description: 'Cultura encontrada', type: CulturaResponseDto })
  @ApiResponse({ status: 404, description: 'Cultura não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.culturasService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma cultura' })
  @ApiResponse({ status: 200, description: 'Cultura atualizada com sucesso', type: CulturaResponseDto })
  @ApiResponse({ status: 404, description: 'Cultura não encontrada' })
  @ApiResponse({ status: 409, description: 'Cultura com esta descrição já existe' })
  update(@Param('id', ParseIntPipe) id: string, @Body() updateCulturaDto: UpdateCulturaDto) {
    return this.culturasService.update(+id, updateCulturaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma cultura' })
  @ApiResponse({ status: 200, description: 'Cultura excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Cultura não encontrada' })
  @ApiResponse({ status: 409, description: 'Não é possível excluir uma cultura que está sendo usada em áreas agrícolas' })
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.culturasService.remove(+id);
  }
} 