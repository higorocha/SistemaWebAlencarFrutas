import { Controller, Get, Post, Body, Patch, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FornecedoresService } from './fornecedores.service';
import { CreateFornecedorDto, UpdateFornecedorDto, FornecedorResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Fornecedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/fornecedores')
export class FornecedoresController {
  constructor(private readonly fornecedoresService: FornecedoresService) {}

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

