import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  HttpCode, 
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ContaCorrenteService } from './conta-corrente.service';
import { 
  CreateContaCorrenteDto, 
  UpdateContaCorrenteDto, 
  ContaCorrenteResponseDto 
} from '../config/dto/conta-corrente.dto';

@ApiTags('Conta Corrente')
@Controller('contacorrente')
export class ContaCorrenteController {
  constructor(private contaCorrenteService: ContaCorrenteService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar todas as contas correntes',
    description: 'Retorna uma lista com todas as contas correntes cadastradas'
  })
  @ApiOkResponse({ 
    description: 'Lista de contas correntes',
    type: [ContaCorrenteResponseDto]
  })
  async findAll(): Promise<ContaCorrenteResponseDto[]> {
    return await this.contaCorrenteService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Buscar conta corrente por ID',
    description: 'Retorna os dados de uma conta corrente específica'
  })
  @ApiOkResponse({ 
    description: 'Conta corrente encontrada',
    type: ContaCorrenteResponseDto
  })
  @ApiNotFoundResponse({ 
    description: 'Conta corrente não encontrada' 
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ContaCorrenteResponseDto> {
    return await this.contaCorrenteService.findOne(id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Criar nova conta corrente',
    description: 'Cadastra uma nova conta corrente no sistema'
  })
  @ApiBody({ type: CreateContaCorrenteDto })
  @ApiCreatedResponse({ 
    description: 'Conta corrente criada com sucesso',
    type: ContaCorrenteResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Dados de entrada inválidos' 
  })
  @ApiConflictResponse({ 
    description: 'Já existe uma conta corrente com esses dados' 
  })
  async create(@Body() createContaCorrenteDto: CreateContaCorrenteDto): Promise<ContaCorrenteResponseDto> {
    return await this.contaCorrenteService.create(createContaCorrenteDto);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Atualizar conta corrente',
    description: 'Atualiza os dados de uma conta corrente existente'
  })
  @ApiBody({ type: UpdateContaCorrenteDto })
  @ApiOkResponse({ 
    description: 'Conta corrente atualizada com sucesso',
    type: ContaCorrenteResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Dados de entrada inválidos' 
  })
  @ApiNotFoundResponse({ 
    description: 'Conta corrente não encontrada' 
  })
  @ApiConflictResponse({ 
    description: 'Já existe uma conta corrente com esses dados' 
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContaCorrenteDto: UpdateContaCorrenteDto
  ): Promise<ContaCorrenteResponseDto> {
    return await this.contaCorrenteService.update(id, updateContaCorrenteDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Excluir conta corrente',
    description: 'Remove uma conta corrente do sistema'
  })
  @ApiOkResponse({ 
    description: 'Conta corrente excluída com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Conta corrente removida com sucesso'
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Conta corrente não encontrada' 
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return await this.contaCorrenteService.remove(id);
  }
} 