import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  ValidationPipe,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CredenciaisAPIService } from './credenciais-api.service';
import {
  CreateCredenciaisAPIDto,
  UpdateCredenciaisAPIDto,
  CredenciaisAPIResponseDto,
} from '../config/dto/credenciais-api.dto';

@ApiTags('Credenciais API')
@Controller('credenciais-api')
export class CredenciaisAPIController {
  constructor(private readonly credenciaisAPIService: CredenciaisAPIService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novas credenciais API',
    description: 'Cria novas credenciais para acesso às APIs bancárias',
  })
  @ApiBody({
    description: 'Dados das credenciais API',
    type: CreateCredenciaisAPIDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Credenciais criadas com sucesso',
    type: CredenciaisAPIResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou conta corrente não encontrada',
    schema: {
      example: {
        statusCode: 400,
        message: ['Banco é obrigatório', 'Cliente ID é obrigatório'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existem credenciais para esta combinação banco/conta/modalidade',
    schema: {
      example: {
        statusCode: 409,
        message: 'Já existem credenciais para 001 - 001 - Cobrança nesta conta corrente',
        error: 'Conflict',
      },
    },
  })
  async create(
    @Body(ValidationPipe) createCredenciaisAPIDto: CreateCredenciaisAPIDto,
  ): Promise<CredenciaisAPIResponseDto> {
    return this.credenciaisAPIService.create(createCredenciaisAPIDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas as credenciais API',
    description: 'Retorna todas as credenciais API cadastradas com informações da conta corrente',
  })
  @ApiQuery({
    name: 'contaCorrenteId',
    required: false,
    description: 'Filtrar por ID da conta corrente',
    type: Number,
  })
  @ApiQuery({
    name: 'banco',
    required: false,
    description: 'Filtrar por banco',
    type: String,
  })
  @ApiQuery({
    name: 'modalidadeApi',
    required: false,
    description: 'Filtrar por modalidade API',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de credenciais retornada com sucesso',
    type: [CredenciaisAPIResponseDto],
  })
  async findAll(
    @Query('contaCorrenteId') contaCorrenteId?: string,
    @Query('banco') banco?: string,
    @Query('modalidadeApi') modalidadeApi?: string,
  ): Promise<CredenciaisAPIResponseDto[]> {
    // Se foi informado ID da conta corrente, filtra por conta
    if (contaCorrenteId) {
      const id = parseInt(contaCorrenteId, 10);
      if (isNaN(id)) {
        throw new Error('ID da conta corrente deve ser um número válido');
      }
      return this.credenciaisAPIService.findByContaCorrente(id);
    }

    // Se foram informados banco e modalidade, filtra por ambos
    if (banco && modalidadeApi) {
      return this.credenciaisAPIService.findByBancoAndModalidade(banco, modalidadeApi);
    }

    // Retorna todas as credenciais
    return this.credenciaisAPIService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar credenciais API por ID',
    description: 'Retorna as credenciais API específicas pelo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID das credenciais API',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credenciais encontradas',
    type: CredenciaisAPIResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Credenciais não encontradas',
    schema: {
      example: {
        statusCode: 404,
        message: 'Credenciais API não encontradas',
        error: 'Not Found',
      },
    },
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CredenciaisAPIResponseDto> {
    return this.credenciaisAPIService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar credenciais API (parcial)',
    description: 'Atualiza dados das credenciais API existentes (atualização parcial)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID das credenciais API',
    type: Number,
  })
  @ApiBody({
    description: 'Dados para atualização (todos os campos são opcionais)',
    type: UpdateCredenciaisAPIDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credenciais atualizadas com sucesso',
    type: CredenciaisAPIResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Credenciais não encontradas',
    schema: {
      example: {
        statusCode: 404,
        message: 'Credenciais API não encontradas',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflito - combinação banco/conta/modalidade já existe',
    schema: {
      example: {
        statusCode: 409,
        message: 'Já existem credenciais para 001 - 001 - Cobrança nesta conta corrente',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: ['Banco não pode estar vazio'],
        error: 'Bad Request',
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateCredenciaisAPIDto: UpdateCredenciaisAPIDto,
  ): Promise<CredenciaisAPIResponseDto> {
    return this.credenciaisAPIService.update(id, updateCredenciaisAPIDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar credenciais API (completo)',
    description: 'Atualiza dados das credenciais API existentes (atualização completa)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID das credenciais API',
    type: Number,
  })
  @ApiBody({
    description: 'Dados para atualização (todos os campos são opcionais)',
    type: UpdateCredenciaisAPIDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credenciais atualizadas com sucesso',
    type: CredenciaisAPIResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Credenciais não encontradas',
    schema: {
      example: {
        statusCode: 404,
        message: 'Credenciais API não encontradas',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflito - combinação banco/conta/modalidade já existe',
    schema: {
      example: {
        statusCode: 409,
        message: 'Já existem credenciais para 001 - 001 - Cobrança nesta conta corrente',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: ['Banco não pode estar vazio'],
        error: 'Bad Request',
      },
    },
  })
  async updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateCredenciaisAPIDto: UpdateCredenciaisAPIDto,
  ): Promise<CredenciaisAPIResponseDto> {
    return this.credenciaisAPIService.update(id, updateCredenciaisAPIDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover credenciais API',
    description: 'Remove as credenciais API do sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID das credenciais API',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credenciais removidas com sucesso',
    schema: {
      example: {
        message: 'Credenciais API removidas com sucesso',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Credenciais não encontradas',
    schema: {
      example: {
        statusCode: 404,
        message: 'Credenciais API não encontradas',
        error: 'Not Found',
      },
    },
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.credenciaisAPIService.remove(id);
  }

  @Get('conta/:contaCorrenteId')
  @ApiOperation({
    summary: 'Buscar credenciais por conta corrente',
    description: 'Retorna todas as credenciais API de uma conta corrente específica',
  })
  @ApiParam({
    name: 'contaCorrenteId',
    description: 'ID da conta corrente',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de credenciais da conta corrente',
    type: [CredenciaisAPIResponseDto],
  })
  async findByContaCorrente(
    @Param('contaCorrenteId', ParseIntPipe) contaCorrenteId: number,
  ): Promise<CredenciaisAPIResponseDto[]> {
    return this.credenciaisAPIService.findByContaCorrente(contaCorrenteId);
  }

  @Get('banco/:banco/modalidade/:modalidadeApi')
  @ApiOperation({
    summary: 'Buscar credenciais por banco e modalidade',
    description: 'Retorna credenciais específicas por banco e modalidade API',
  })
  @ApiParam({
    name: 'banco',
    description: 'Código do banco (ex: 001)',
    type: String,
  })
  @ApiParam({
    name: 'modalidadeApi',
    description: 'Modalidade da API (ex: 001 - Cobrança)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de credenciais encontradas',
    type: [CredenciaisAPIResponseDto],
  })
  async findByBancoAndModalidade(
    @Param('banco') banco: string,
    @Param('modalidadeApi') modalidadeApi: string,
  ): Promise<CredenciaisAPIResponseDto[]> {
    return this.credenciaisAPIService.findByBancoAndModalidade(banco, modalidadeApi);
  }
} 