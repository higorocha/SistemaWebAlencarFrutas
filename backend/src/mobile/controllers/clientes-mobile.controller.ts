import {
  Body,
  Controller,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissoesGuard } from '../../auth/guards/permissoes.guard';
import { Niveis } from '../../auth/decorators/niveis.decorator';
import { NivelUsuario } from '../../auth/dto';
import { ClientesService } from '../../clientes/clientes.service';
import { ClienteResponseDto, CreateClienteDto } from '../../clientes/dto';
import { MobileCreateClienteDto } from '../dto';

@ApiTags('Mobile - Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissoesGuard)
@Niveis(
  NivelUsuario.ADMINISTRADOR,
  NivelUsuario.GERENTE_GERAL,
  NivelUsuario.ESCRITORIO,
)
@Controller('api/mobile/clientes')
export class ClientesMobileController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiOperation({
    summary: 'Criar um novo cliente via aplicativo mobile',
    description:
      'Permite que usuários autorizados criem rapidamente um cliente a partir do aplicativo mobile.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cliente criado com sucesso',
    type: ClienteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um cliente com este nome ou documento',
  })
  async createClienteMobile(
    @Body() dto: MobileCreateClienteDto,
  ): Promise<ClienteResponseDto> {
    const payload: CreateClienteDto = {
      nome: dto.nome,
      status: 'ATIVO',
      industria: dto.industria ?? false,
    };

    return this.clientesService.create(payload);
  }
}

