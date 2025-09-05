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
import { ConfigService } from './config.service';
import { 
  CreateConfigDadosEmpresaDto, 
  UpdateConfigDadosEmpresaDto, 
  ConfigDadosEmpresaResponseDto 
} from './dto/config-dados-empresa.dto';

@ApiTags('Configurações')
@Controller('config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get('dados-empresa')
  @ApiOperation({ 
    summary: 'Buscar dados da empresa',
    description: 'Retorna os dados gerais da empresa configurados no sistema'
  })
  @ApiOkResponse({ 
    description: 'Dados da empresa encontrados',
    type: ConfigDadosEmpresaResponseDto
  })
  @ApiNotFoundResponse({ 
    description: 'Dados da empresa não encontrados' 
  })
  async findDadosEmpresa(): Promise<ConfigDadosEmpresaResponseDto | null> {
    return await this.configService.findDadosEmpresa();
  }

  @Post('dados-empresa')
  @ApiOperation({ 
    summary: 'Salvar dados da empresa',
    description: 'Cria ou atualiza os dados gerais da empresa'
  })
  @ApiBody({ type: CreateConfigDadosEmpresaDto })
  @ApiCreatedResponse({ 
    description: 'Dados da empresa salvos com sucesso',
    type: ConfigDadosEmpresaResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Dados de entrada inválidos' 
  })
  @ApiConflictResponse({ 
    description: 'CNPJ já cadastrado' 
  })
  async saveDadosEmpresa(
    @Body() createConfigDadosEmpresaDto: CreateConfigDadosEmpresaDto
  ): Promise<ConfigDadosEmpresaResponseDto> {
    return await this.configService.saveDadosEmpresa(createConfigDadosEmpresaDto);
  }

  @Put('dados-empresa/:id')
  @ApiOperation({ 
    summary: 'Atualizar dados da empresa',
    description: 'Atualiza os dados da empresa pelo ID'
  })
  @ApiBody({ type: UpdateConfigDadosEmpresaDto })
  @ApiOkResponse({ 
    description: 'Dados da empresa atualizados com sucesso',
    type: ConfigDadosEmpresaResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Dados de entrada inválidos' 
  })
  @ApiNotFoundResponse({ 
    description: 'Dados da empresa não encontrados' 
  })
  @ApiConflictResponse({ 
    description: 'CNPJ já cadastrado' 
  })
  async updateDadosEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConfigDadosEmpresaDto: UpdateConfigDadosEmpresaDto
  ): Promise<ConfigDadosEmpresaResponseDto> {
    return await this.configService.updateDadosEmpresa(id, updateConfigDadosEmpresaDto);
  }

  @Delete('dados-empresa/:id')
  @ApiOperation({ 
    summary: 'Deletar dados da empresa',
    description: 'Remove os dados da empresa pelo ID'
  })
  @ApiOkResponse({ 
    description: 'Dados da empresa deletados com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Dados da empresa deletados com sucesso'
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Dados da empresa não encontrados' 
  })
  async deleteDadosEmpresa(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return await this.configService.deleteDadosEmpresa(id);
  }

  @Get('dados-empresa/all')
  @ApiOperation({ 
    summary: 'Listar todos os dados da empresa',
    description: 'Retorna todos os registros de dados da empresa (para administração)'
  })
  @ApiOkResponse({ 
    description: 'Lista de dados da empresa',
    type: [ConfigDadosEmpresaResponseDto]
  })
  async findAllDadosEmpresa(): Promise<ConfigDadosEmpresaResponseDto[]> {
    return await this.configService.findAllDadosEmpresa();
  }

  @Get('dados-empresa/:id')
  @ApiOperation({ 
    summary: 'Buscar dados da empresa por ID',
    description: 'Retorna os dados da empresa pelo ID específico'
  })
  @ApiOkResponse({ 
    description: 'Dados da empresa encontrados',
    type: ConfigDadosEmpresaResponseDto
  })
  @ApiNotFoundResponse({ 
    description: 'Dados da empresa não encontrados' 
  })
  async findDadosEmpresaById(@Param('id', ParseIntPipe) id: number): Promise<ConfigDadosEmpresaResponseDto> {
    return await this.configService.findDadosEmpresaById(id);
  }
} 