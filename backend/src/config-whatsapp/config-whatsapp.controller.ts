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
import { ConfigWhatsAppService } from './config-whatsapp.service';
import {
  CreateConfigWhatsAppDto,
  UpdateConfigWhatsAppDto,
  ConfigWhatsAppResponseDto,
} from '../config/dto/config-whatsapp.dto';

/**
 * DTO para envio de mensagem de teste
 */
class EnviarMensagemTesteDto {
  numeroDestino: string;
  mensagem: string;
}

@ApiTags('Configuração de WhatsApp')
@Controller('config-whatsapp')
export class ConfigWhatsAppController {
  constructor(private readonly configWhatsAppService: ConfigWhatsAppService) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar configuração de WhatsApp',
    description: 'Retorna a configuração de WhatsApp única do sistema (se existir)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuração encontrada',
    type: ConfigWhatsAppResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Nenhuma configuração cadastrada',
  })
  async findConfigWhatsApp(): Promise<ConfigWhatsAppResponseDto | null> {
    return this.configWhatsAppService.findConfigWhatsApp();
  }

  @Post()
  @ApiOperation({
    summary: 'Salvar configuração de WhatsApp',
    description: 'Cria ou atualiza a configuração de WhatsApp única do sistema',
  })
  @ApiBody({
    description: 'Dados da configuração de WhatsApp (aceita snake_case do frontend)',
    schema: {
      type: 'object',
      properties: {
        phone_number_id: { type: 'string', description: 'ID do número de telefone' },
        access_token: { type: 'string', description: 'Token de acesso' },
        business_account_id: { type: 'string', description: 'ID da conta comercial (opcional)' },
        verify_token: { type: 'string', description: 'Token de verificação (opcional)' },
        numero_telefone: { type: 'string', description: 'Número de telefone' },
        nome_exibicao: { type: 'string', description: 'Nome de exibição' },
        ativo: { type: 'boolean', description: 'Se está ativo' },
        webhook_url: { type: 'string', description: 'URL do webhook (opcional)' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuração salva com sucesso',
    type: ConfigWhatsAppResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'ID do número de telefone é obrigatório',
          'Token de acesso é obrigatório'
        ],
        error: 'Bad Request',
      },
    },
  })
  async upsertConfigWhatsApp(
    @Body() body: any,
  ): Promise<ConfigWhatsAppResponseDto> {
    // Mapear campos snake_case para camelCase
    const configDto: CreateConfigWhatsAppDto = {
      phoneNumberId: body.phone_number_id,
      accessToken: body.access_token,
      businessAccountId: body.business_account_id,
      verifyToken: body.verify_token,
      numeroTelefone: body.numero_telefone,
      nomeExibicao: body.nome_exibicao,
      ativo: body.ativo ?? true,
      webhookUrl: body.webhook_url,
      configuracoesAdicionais: body.configuracoesAdicionais,
    };

    const result = await this.configWhatsAppService.upsertConfigWhatsApp(configDto);
    
    // Retorna uma resposta mais informativa
    return {
      ...result,
      message: 'Configuração de WhatsApp salva com sucesso! As configurações foram aplicadas e estão prontas para uso.'
    } as any;
  }

  @Put()
  @ApiOperation({
    summary: 'Atualizar configuração de WhatsApp',
    description: 'Atualiza a configuração de WhatsApp única do sistema (mesmo comportamento do POST)',
  })
  @ApiBody({
    description: 'Dados da configuração de WhatsApp (aceita snake_case do frontend)',
    schema: {
      type: 'object',
      properties: {
        phone_number_id: { type: 'string', description: 'ID do número de telefone' },
        access_token: { type: 'string', description: 'Token de acesso' },
        business_account_id: { type: 'string', description: 'ID da conta comercial (opcional)' },
        verify_token: { type: 'string', description: 'Token de verificação (opcional)' },
        numero_telefone: { type: 'string', description: 'Número de telefone' },
        nome_exibicao: { type: 'string', description: 'Nome de exibição' },
        ativo: { type: 'boolean', description: 'Se está ativo' },
        webhook_url: { type: 'string', description: 'URL do webhook (opcional)' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuração atualizada com sucesso',
    type: ConfigWhatsAppResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'ID do número de telefone é obrigatório',
          'Token de acesso é obrigatório'
        ],
        error: 'Bad Request',
      },
    },
  })
  async updateConfigWhatsApp(
    @Body() body: any,
  ): Promise<ConfigWhatsAppResponseDto> {
    // Mapear campos snake_case para camelCase
    const configDto: UpdateConfigWhatsAppDto = {
      phoneNumberId: body.phone_number_id,
      accessToken: body.access_token,
      businessAccountId: body.business_account_id,
      verifyToken: body.verify_token,
      numeroTelefone: body.numero_telefone,
      nomeExibicao: body.nome_exibicao,
      ativo: body.ativo ?? true,
      webhookUrl: body.webhook_url,
      configuracoesAdicionais: body.configuracoesAdicionais,
    };

    return this.configWhatsAppService.upsertConfigWhatsApp(configDto);
  }

  @Delete()
  @ApiOperation({
    summary: 'Remover configuração de WhatsApp',
    description: 'Remove a configuração de WhatsApp do sistema (útil para reset)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuração removida com sucesso',
    schema: {
      example: {
        message: 'Configuração de WhatsApp removida com sucesso',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Nenhuma configuração encontrada para remover',
    schema: {
      example: {
        message: 'Nenhuma configuração de WhatsApp encontrada para remover',
      },
    },
  })
  async deleteConfigWhatsApp(): Promise<{ message: string }> {
    return this.configWhatsAppService.deleteConfigWhatsApp();
  }

  @Get('exists')
  @ApiOperation({
    summary: 'Verificar se existe configuração',
    description: 'Verifica se existe uma configuração de WhatsApp cadastrada',
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
    const exists = await this.configWhatsAppService.existeConfig();
    return { exists };
  }

  @Post('testar-conexao')
  @ApiOperation({
    summary: 'Testar conexão com API WhatsApp',
    description: 'Testa a conexão com a API do WhatsApp usando a configuração salva ou fornecida',
  })
  @ApiBody({
    description: 'Configuração para teste (opcional - usa a salva se não fornecida)',
    type: CreateConfigWhatsAppDto,
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado do teste de conexão',
    schema: {
      example: {
        success: true,
        message: 'Conexão com API WhatsApp testada com sucesso',
      },
    },
  })
  async testarConexao(
    @Body(ValidationPipe) configDto?: CreateConfigWhatsAppDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.configWhatsAppService.testarConexao(configDto);
  }

  @Post('testar')
  @ApiOperation({
    summary: 'Enviar mensagem de teste WhatsApp',
    description: 'Envia uma mensagem de teste via WhatsApp usando a configuração do sistema',
  })
  @ApiBody({
    description: 'Número de telefone para teste',
    schema: {
      type: 'object',
      properties: {
        telefone_teste: {
          type: 'string',
          description: 'Número de telefone para teste (apenas DDD + número)',
          example: '85999999999',
        },
      },
      required: ['telefone_teste'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado do envio da mensagem de teste',
    schema: {
      example: {
        success: true,
        message: 'Mensagem de teste enviada com sucesso para 85999999999',
      },
    },
  })
  async testarWhatsApp(
    @Body() body: { telefone_teste: string },
  ): Promise<{ success: boolean; message: string }> {
    const mensagemTeste = 'Esta é uma mensagem de teste do Sistema Alencar Frutas. Se você recebeu esta mensagem, a integração está funcionando corretamente! 🍎';
    return this.configWhatsAppService.enviarMensagemTeste(
      body.telefone_teste,
      mensagemTeste,
    );
  }

  @Post('enviar-mensagem-teste')
  @ApiOperation({
    summary: 'Enviar mensagem de teste',
    description: 'Envia uma mensagem de teste via WhatsApp usando a configuração do sistema',
  })
  @ApiBody({
    description: 'Dados para envio da mensagem de teste',
    schema: {
      type: 'object',
      properties: {
        numeroDestino: {
          type: 'string',
          description: 'Número de telefone de destino (formato internacional)',
          example: '+5585999999999',
        },
        mensagem: {
          type: 'string',
          description: 'Mensagem a ser enviada',
          example: 'Esta é uma mensagem de teste do sistema Alencar Frutas.',
        },
      },
      required: ['numeroDestino', 'mensagem'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado do envio da mensagem',
    schema: {
      example: {
        success: true,
        message: 'Mensagem de teste enviada com sucesso para +5585999999999',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou configuração não encontrada',
    schema: {
      example: {
        success: false,
        message: 'Nenhuma configuração de WhatsApp encontrada para envio',
      },
    },
  })
  async enviarMensagemTeste(
    @Body() body: EnviarMensagemTesteDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.configWhatsAppService.enviarMensagemTeste(
      body.numeroDestino,
      body.mensagem,
    );
  }
} 