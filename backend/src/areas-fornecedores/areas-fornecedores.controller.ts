import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AreasFornecedoresService } from './areas-fornecedores.service';
import { CreateAreaFornecedorDto, UpdateAreaFornecedorDto, AreaFornecedorResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Áreas dos Fornecedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/areas-fornecedores')
export class AreasFornecedoresController {
  constructor(private readonly areasFornecedoresService: AreasFornecedoresService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova área de fornecedor' })
  @ApiResponse({ status: 201, description: 'Área criada com sucesso', type: AreaFornecedorResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Fornecedor ou Cultura não encontrado' })
  @ApiResponse({ status: 409, description: 'Área com mesmo nome já existe para este fornecedor' })
  create(@Body() createAreaFornecedorDto: CreateAreaFornecedorDto): Promise<AreaFornecedorResponseDto> {
    return this.areasFornecedoresService.create(createAreaFornecedorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as áreas de fornecedores' })
  @ApiResponse({ status: 200, description: 'Lista de áreas', type: [AreaFornecedorResponseDto] })
  findAll(): Promise<AreaFornecedorResponseDto[]> {
    return this.areasFornecedoresService.findAll();
  }

  @Get('fornecedor/:fornecedorId')
  @ApiOperation({ summary: 'Listar áreas de um fornecedor específico' })
  @ApiResponse({ status: 200, description: 'Lista de áreas do fornecedor', type: [AreaFornecedorResponseDto] })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  findByFornecedor(@Param('fornecedorId') fornecedorId: string): Promise<AreaFornecedorResponseDto[]> {
    return this.areasFornecedoresService.findByFornecedor(+fornecedorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar área por ID' })
  @ApiResponse({ status: 200, description: 'Área encontrada', type: AreaFornecedorResponseDto })
  @ApiResponse({ status: 404, description: 'Área não encontrada' })
  findOne(@Param('id') id: string): Promise<AreaFornecedorResponseDto> {
    return this.areasFornecedoresService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar área de fornecedor' })
  @ApiResponse({ status: 200, description: 'Área atualizada com sucesso', type: AreaFornecedorResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Área, Fornecedor ou Cultura não encontrado' })
  @ApiResponse({ status: 409, description: 'Área com mesmo nome já existe para este fornecedor' })
  update(@Param('id') id: string, @Body() updateAreaFornecedorDto: UpdateAreaFornecedorDto): Promise<AreaFornecedorResponseDto> {
    return this.areasFornecedoresService.update(+id, updateAreaFornecedorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover área de fornecedor' })
  @ApiResponse({ status: 200, description: 'Área removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Área não encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.areasFornecedoresService.remove(+id);
  }
}
