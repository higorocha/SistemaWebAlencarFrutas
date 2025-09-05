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
import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto, ClienteResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo cliente' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cliente criado com sucesso',
    type: ClienteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um cliente com este CNPJ ou CPF',
  })
  create(@Body() createClienteDto: CreateClienteDto): Promise<ClienteResponseDto> {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os clientes com paginação e filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Termo de busca' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filtrar por status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de clientes retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ClienteResponseDto' },
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
    @Query('status') status?: string,
  ) {
    return this.clientesService.findAll(page, limit, search, status);
  }

  @Get('ativos')
  @ApiOperation({ summary: 'Listar apenas clientes ativos para seleção' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de clientes ativos retornada com sucesso',
    type: [ClienteResponseDto],
  })
  findActive(): Promise<ClienteResponseDto[]> {
    return this.clientesService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um cliente por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente encontrado com sucesso',
    type: ClienteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente não encontrado',
  })
  findOne(@Param('id') id: string): Promise<ClienteResponseDto> {
    return this.clientesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um cliente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente atualizado com sucesso',
    type: ClienteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um cliente com este CNPJ ou CPF',
  })
  update(
    @Param('id') id: string,
    @Body() updateClienteDto: UpdateClienteDto,
  ): Promise<ClienteResponseDto> {
    return this.clientesService.update(+id, updateClienteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um cliente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente não encontrado',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.clientesService.remove(+id);
  }
} 