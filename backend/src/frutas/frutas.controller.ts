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
import { FrutasService } from './frutas.service';
import { CreateFrutaDto, UpdateFrutaDto, FrutaResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Frutas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/frutas')
export class FrutasController {
  constructor(private readonly frutasService: FrutasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova fruta' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Fruta criada com sucesso',
    type: FrutaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe uma fruta com este código',
  })
  create(@Body() createFrutaDto: CreateFrutaDto): Promise<FrutaResponseDto> {
    return this.frutasService.create(createFrutaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as frutas com paginação e filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Termo de busca' })
  @ApiQuery({ name: 'categoria', required: false, type: String, description: 'Filtrar por categoria' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filtrar por status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de frutas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/FrutaResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoria') categoria?: string,
    @Query('status') status?: string,
  ) {
    return this.frutasService.findAll(page, limit, search, categoria, status);
  }

  @Get('ativas')
  @ApiOperation({ summary: 'Listar apenas frutas ativas para seleção' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de frutas ativas retornada com sucesso',
    type: [FrutaResponseDto],
  })
  findActive(): Promise<FrutaResponseDto[]> {
    return this.frutasService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma fruta por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fruta encontrada com sucesso',
    type: FrutaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Fruta não encontrada',
  })
  findOne(@Param('id') id: string): Promise<FrutaResponseDto> {
    return this.frutasService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma fruta' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fruta atualizada com sucesso',
    type: FrutaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Fruta não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe uma fruta com este código',
  })
  update(
    @Param('id') id: string,
    @Body() updateFrutaDto: UpdateFrutaDto,
  ): Promise<FrutaResponseDto> {
    return this.frutasService.update(+id, updateFrutaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma fruta' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fruta removida com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Fruta não encontrada',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.frutasService.remove(+id);
  }
} 