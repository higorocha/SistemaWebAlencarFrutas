import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Query,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ConvenioCobrancaService } from './convenio-cobranca.service';
import {
  ConvenioCobrancaDto,
  ConvenioCobrancaResponseDto,
} from '../config/dto/convenio-cobranca.dto';

@ApiTags('Convênio de Cobrança')
@Controller('convenio-cobranca')
export class ConvenioCobrancaController {
  constructor(private readonly convenioCobrancaService: ConvenioCobrancaService) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar convênio de cobrança por conta corrente',
    description: 'Retorna o convênio de cobrança da conta corrente especificada (ou do sistema se conta não for informada)',
  })
  @ApiQuery({
    name: 'contaCorrenteId',
    required: false,
    type: Number,
    description: 'ID da conta corrente (opcional - se não informado, retorna o primeiro convênio encontrado)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Convênio encontrado',
    type: ConvenioCobrancaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Nenhum convênio cadastrado para esta conta',
  })
  async findConvenio(@Query('contaCorrenteId') contaCorrenteId?: number): Promise<ConvenioCobrancaResponseDto | null> {
    // Se contaCorrenteId não foi informado, retorna o primeiro convênio (comportamento legado)
    if (contaCorrenteId === undefined) {
      const convenio = await this.convenioCobrancaService.findFirstConvenio();
      return convenio;
    }
    // Se contaCorrenteId foi informado, busca o convênio específico da conta
    return this.convenioCobrancaService.findConvenio(contaCorrenteId);
  }

  @Post()
  @ApiOperation({
    summary: 'Salvar convênio de cobrança',
    description: 'Cria ou atualiza o convênio de cobrança único do sistema',
  })
  @ApiBody({
    description: 'Dados do convênio de cobrança',
    type: ConvenioCobrancaDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Convênio salvo com sucesso',
    type: ConvenioCobrancaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou validação de negócio falhou',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Juros deve ser um número válido',
          'Valor da multa é obrigatório quando multa está ativa'
        ],
        error: 'Bad Request',
      },
    },
  })
  async upsertConvenio(
    @Body(ValidationPipe) convenioDto: ConvenioCobrancaDto,
  ): Promise<ConvenioCobrancaResponseDto> {
    return this.convenioCobrancaService.upsertConvenio(convenioDto);
  }

  @Delete()
  @ApiOperation({
    summary: 'Remover convênio de cobrança por conta corrente',
    description: 'Remove o convênio de cobrança de uma conta corrente específica',
  })
  @ApiQuery({
    name: 'contaCorrenteId',
    required: true,
    type: Number,
    description: 'ID da conta corrente do convênio a ser removido',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Convênio removido com sucesso',
    schema: {
      example: {
        message: 'Convênio de cobrança removido com sucesso',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Convênio não encontrado',
    schema: {
      example: {
        message: 'Nenhum convênio de cobrança encontrado para esta conta corrente',
      },
    },
  })
  async deleteConvenioByContaCorrenteId(@Query('contaCorrenteId') contaCorrenteId: number): Promise<{ message: string }> {
    return this.convenioCobrancaService.deleteConvenioByContaCorrenteId(contaCorrenteId);
  }

  @Get('exists')
  @ApiOperation({
    summary: 'Verificar se existe convênio',
    description: 'Verifica se existe um convênio de cobrança cadastrado para uma conta corrente',
  })
  @ApiQuery({
    name: 'contaCorrenteId',
    required: true,
    type: Number,
    description: 'ID da conta corrente para verificar se existe convênio',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status da existência do convênio',
    schema: {
      example: {
        exists: true,
      },
    },
  })
  async existeConvenio(@Query('contaCorrenteId') contaCorrenteId: number): Promise<{ exists: boolean }> {
    const exists = await this.convenioCobrancaService.existeConvenio(contaCorrenteId);
    return { exists };
  }
} 