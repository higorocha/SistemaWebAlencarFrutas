import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissoesGuard } from '../../auth/guards/permissoes.guard';
import { Niveis } from '../../auth/decorators/niveis.decorator';
import { NivelUsuario } from '../../auth/dto';
import { PushTokensService } from '../services/push-tokens.service';
import { CreatePushTokenDto, PushTokenResponseDto } from '../dto';

/**
 * Controller para gerenciar tokens de push notifications
 */
@ApiTags('Mobile - Push Tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissoesGuard)
@Niveis(
  NivelUsuario.GERENTE_CULTURA,
  NivelUsuario.ADMINISTRADOR,
  NivelUsuario.GERENTE_GERAL,
  NivelUsuario.ESCRITORIO,
)
@Controller('api/mobile/push-tokens')
export class PushTokensMobileController {
  constructor(private readonly pushTokensService: PushTokensService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar token de push notification' })
  @ApiResponse({
    status: 201,
    description: 'Token registrado com sucesso',
    type: PushTokenResponseDto,
  })
  async registerToken(
    @Req() req: any,
    @Body() createPushTokenDto: CreatePushTokenDto,
  ): Promise<PushTokenResponseDto> {
    const userId = req.user.id;
    return this.pushTokensService.registerToken(userId, createPushTokenDto);
  }

  @Delete(':token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover token de push notification' })
  @ApiParam({
    name: 'token',
    description: 'Token Expo Push Notification a ser removido',
  })
  @ApiResponse({
    status: 204,
    description: 'Token removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Token não encontrado',
  })
  async removeToken(@Param('token') token: string): Promise<void> {
    return this.pushTokensService.removeToken(token);
  }

  @Get('diagnostico')
  @ApiOperation({ summary: 'Diagnóstico de tokens de push (apenas para debug)' })
  @ApiResponse({
    status: 200,
    description: 'Informações de diagnóstico dos tokens',
  })
  async diagnostico(@Req() req: any) {
    const userId = req.user.id;
    return this.pushTokensService.getDiagnostico(userId);
  }
}

