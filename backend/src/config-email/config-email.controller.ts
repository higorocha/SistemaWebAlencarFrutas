import {
  Controller,
  Get,
  Post,
  Put,
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
import { ConfigEmailService } from './config-email.service';
import {
  CreateConfigEmailDto,
  UpdateConfigEmailDto,
  ConfigEmailResponseDto,
} from '../config/dto/config-email.dto';

@ApiTags('Configuração de Email')
@Controller('config-email')
export class ConfigEmailController {
  constructor(private readonly configEmailService: ConfigEmailService) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar configuração de email',
    description: 'Retorna a configuração de email única do sistema (se existir)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuração encontrada',
    type: ConfigEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Nenhuma configuração cadastrada',
  })
  async findConfigEmail(): Promise<ConfigEmailResponseDto | null> {
    return this.configEmailService.findConfigEmail();
  }

  @Post()
  @ApiOperation({
    summary: 'Salvar configuração de email',
    description: 'Cria ou atualiza a configuração de email única do sistema',
  })
  @ApiBody({
    description: 'Dados da configuração de email',
    type: CreateConfigEmailDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuração salva com sucesso',
    type: ConfigEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Servidor SMTP é obrigatório',
          'Email de envio deve ter um formato válido'
        ],
        error: 'Bad Request',
      },
    },
  })
  async upsertConfigEmail(
    @Body(ValidationPipe) configDto: CreateConfigEmailDto,
  ): Promise<ConfigEmailResponseDto> {
    return this.configEmailService.upsertConfigEmail(configDto);
  }

  @Put()
  @ApiOperation({
    summary: 'Atualizar configuração de email',
    description: 'Atualiza a configuração de email única do sistema (mesmo comportamento do POST)',
  })
  @ApiBody({
    description: 'Dados da configuração de email',
    type: CreateConfigEmailDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuração atualizada com sucesso',
    type: ConfigEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Servidor SMTP é obrigatório',
          'Email de envio deve ter um formato válido'
        ],
        error: 'Bad Request',
      },
    },
  })
  async updateConfigEmail(
    @Body(ValidationPipe) configDto: UpdateConfigEmailDto,
  ): Promise<ConfigEmailResponseDto> {
    return this.configEmailService.upsertConfigEmail(configDto);
  }

  @Delete()
  @ApiOperation({
    summary: 'Remover configuração de email',
    description: 'Remove a configuração de email do sistema (útil para reset)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuração removida com sucesso',
    schema: {
      example: {
        message: 'Configuração de email removida com sucesso',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Nenhuma configuração encontrada para remover',
    schema: {
      example: {
        message: 'Nenhuma configuração de email encontrada para remover',
      },
    },
  })
  async deleteConfigEmail(): Promise<{ message: string }> {
    return this.configEmailService.deleteConfigEmail();
  }

  @Get('exists')
  @ApiOperation({
    summary: 'Verificar se existe configuração',
    description: 'Verifica se existe uma configuração de email cadastrada',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status da existência da configuração',
    schema: {
      example: {
        exists: true,
      },
    },
  })
  async existeConfig(): Promise<{ exists: boolean }> {
    const exists = await this.configEmailService.existeConfig();
    return { exists };
  }

  @Post('testar-conexao')
  @ApiOperation({
    summary: 'Testar conexão SMTP',
    description: 'Testa a conexão com o servidor SMTP usando a configuração salva ou fornecida',
  })
  @ApiBody({
    description: 'Configuração para teste (opcional - usa a salva se não fornecida)',
    type: CreateConfigEmailDto,
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado do teste de conexão',
    schema: {
      example: {
        success: true,
        message: 'Conexão SMTP testada com sucesso',
      },
    },
  })
  async testarConexao(
    @Body(ValidationPipe) configDto?: CreateConfigEmailDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.configEmailService.testarConexao(configDto);
  }

  @Post('testar-email')
  @ApiOperation({
    summary: 'Enviar email de teste',
    description: 'Envia um email de teste usando a configuração do sistema',
  })
  @ApiBody({
    description: 'Email de destino para o teste',
    schema: {
      type: 'object',
      properties: {
        emailTeste: {
          type: 'string',
          format: 'email',
          description: 'Email de destino para o teste',
          example: 'teste@exemplo.com',
        },
      },
      required: ['emailTeste'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado do envio do email de teste',
    schema: {
      example: {
        success: true,
        message: 'Email de teste enviado com sucesso para teste@exemplo.com',
      },
    },
  })
  async testarEmail(
    @Body() body: { emailTeste: string },
  ): Promise<{ success: boolean; message: string }> {
    return this.configEmailService.enviarEmailTeste(body.emailTeste);
  }
} 