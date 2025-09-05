import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
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
    summary: 'Buscar convênio de cobrança',
    description: 'Retorna o convênio de cobrança único do sistema (se existir)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Convênio encontrado',
    type: ConvenioCobrancaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Nenhum convênio cadastrado',
  })
  async findConvenio(): Promise<ConvenioCobrancaResponseDto | null> {
    return this.convenioCobrancaService.findConvenio();
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
    summary: 'Remover convênio de cobrança',
    description: 'Remove o convênio de cobrança do sistema (útil para reset)',
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
    status: HttpStatus.NO_CONTENT,
    description: 'Nenhum convênio encontrado para remover',
    schema: {
      example: {
        message: 'Nenhum convênio de cobrança encontrado para remover',
      },
    },
  })
  async deleteConvenio(): Promise<{ message: string }> {
    return this.convenioCobrancaService.deleteConvenio();
  }

  @Get('exists')
  @ApiOperation({
    summary: 'Verificar se existe convênio',
    description: 'Verifica se existe um convênio de cobrança cadastrado',
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
  async existeConvenio(): Promise<{ exists: boolean }> {
    const exists = await this.convenioCobrancaService.existeConvenio();
    return { exists };
  }
} 