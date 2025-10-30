import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissoesGuard } from '../../auth/guards/permissoes.guard';
import { Niveis } from '../../auth/decorators/niveis.decorator';
import { NivelUsuario } from '../../auth/dto';
import { FitasBananaService } from '../../fitas-banana/fitas-banana.service';
import { ControleBananaService } from '../../controle-banana/controle-banana.service';

@ApiTags('Mobile - Fitas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissoesGuard)
@Niveis(
  NivelUsuario.GERENTE_CULTURA,
  NivelUsuario.ADMINISTRADOR,
  NivelUsuario.GERENTE_GERAL,
  NivelUsuario.ESCRITORIO,
)
@Controller('api/mobile/fitas')
export class FitasMobileController {
  constructor(
    private readonly fitasBananaService: FitasBananaService,
    private readonly controleBananaService: ControleBananaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar fitas de banana (mobile)' })
  @ApiResponse({ status: 200, description: 'Lista de fitas retornada com sucesso' })
  async listarFitas() {
    return this.fitasBananaService.findAll();
  }

  @Get('fitas-com-areas')
  @ApiOperation({ summary: 'Listar fitas com áreas e estoque disponível (mobile)' })
  @ApiResponse({ status: 200, description: 'Fitas com áreas retornadas com sucesso' })
  async listarFitasComAreas() {
    return this.controleBananaService.getFitasComAreas();
  }
}


