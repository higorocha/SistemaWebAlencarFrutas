import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificacoesService } from './notificacoes.service';
import { CreateNotificacaoDto, UpdateNotificacaoDto, NotificacaoResponseDto } from './dto';

@ApiTags('Notificações')
@Controller('api/notificacoes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova notificação' })
  @ApiResponse({ status: 201, description: 'Notificação criada com sucesso', type: NotificacaoResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() createNotificacaoDto: CreateNotificacaoDto, @Request() req) {
    return this.notificacoesService.create(createNotificacaoDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar todas as notificações do usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de notificações retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        notificacoes: {
          type: 'array',
          items: { $ref: '#/components/schemas/NotificacaoResponseDto' }
        },
        nao_lidas: {
          type: 'number',
          description: 'Quantidade de notificações não lidas'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@Request() req) {
    return this.notificacoesService.findAll(req.user?.id);
  }

  // IMPORTANTE: Rotas específicas devem vir ANTES das rotas com parâmetros dinâmicos
  @Patch('ler-todas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiResponse({ status: 200, description: 'Todas as notificações foram marcadas como lidas' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  marcarTodasComoLidas(@Request() req) {
    return this.notificacoesService.marcarTodasComoLidas(req.user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma notificação específica' })
  @ApiResponse({ status: 200, description: 'Notificação encontrada', type: NotificacaoResponseDto })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.notificacoesService.findOne(+id, req.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma notificação' })
  @ApiResponse({ status: 200, description: 'Notificação atualizada com sucesso', type: NotificacaoResponseDto })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(@Param('id') id: string, @Body() updateNotificacaoDto: UpdateNotificacaoDto, @Request() req) {
    return this.notificacoesService.update(+id, updateNotificacaoDto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma notificação' })
  @ApiResponse({ status: 200, description: 'Notificação excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(@Param('id') id: string, @Request() req) {
    return this.notificacoesService.remove(+id, req.user?.id);
  }

  @Patch(':id/ler')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida', type: NotificacaoResponseDto })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  marcarComoLida(@Param('id') id: string, @Request() req) {
    return this.notificacoesService.marcarComoLida(+id, req.user?.id);
  }

  @Patch(':id/descartar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Descartar uma notificação' })
  @ApiResponse({ status: 200, description: 'Notificação descartada com sucesso' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  descartarNotificacao(@Param('id') id: string, @Request() req) {
    return this.notificacoesService.descartarNotificacao(+id, req.user?.id);
  }

  // Rotas para criação de notificações específicas (para uso interno do sistema)
} 