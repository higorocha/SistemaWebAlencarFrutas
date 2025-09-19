import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CnpjService } from './cnpj.service';

@ApiTags('CNPJ')
@Controller('api/cnpj')
export class CnpjController {
  constructor(private readonly cnpjService: CnpjService) {}

  @Get(':cnpj')
  @ApiOperation({
    summary: 'Consulta dados de CNPJ',
    description: 'Consulta informações de uma empresa através do CNPJ usando a API da ReceitaWS'
  })
  @ApiParam({
    name: 'cnpj',
    description: 'CNPJ a ser consultado (apenas números ou formatado)',
    example: '15654038000155'
  })
  @ApiResponse({
    status: 200,
    description: 'Dados da empresa encontrados',
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Razão social' },
        fantasia: { type: 'string', description: 'Nome fantasia' },
        cnpj: { type: 'string', description: 'CNPJ formatado' },
        logradouro: { type: 'string', description: 'Logradouro' },
        numero: { type: 'string', description: 'Número' },
        bairro: { type: 'string', description: 'Bairro' },
        municipio: { type: 'string', description: 'Município' },
        uf: { type: 'string', description: 'UF' },
        cep: { type: 'string', description: 'CEP' },
        email: { type: 'string', description: 'Email' },
        telefone: { type: 'string', description: 'Telefone' },
        situacao: { type: 'string', description: 'Situação da empresa' },
        abertura: { type: 'string', description: 'Data de abertura' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'CNPJ não encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'CNPJ inválido'
  })
  async consultarCnpj(@Param('cnpj') cnpj: string) {
    try {
      return await this.cnpjService.consultarCnpj(cnpj);
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        throw new HttpException('CNPJ não encontrado', HttpStatus.NOT_FOUND);
      }

      if (error.message.includes('inválido')) {
        throw new HttpException('CNPJ inválido', HttpStatus.BAD_REQUEST);
      }

      throw new HttpException(
        'Erro interno do servidor ao consultar CNPJ',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}