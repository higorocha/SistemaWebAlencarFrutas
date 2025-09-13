import { Controller, Get, Param, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HistoricoFitasService } from './historico-fitas.service';

@Controller('historico-fitas')
@UseGuards(JwtAuthGuard)
export class HistoricoFitasController {
  constructor(private readonly historicoFitasService: HistoricoFitasService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.historicoFitasService.findAll(pageNum, limitNum);
  }

  @Get('estatisticas')
  getEstatisticas() {
    return this.historicoFitasService.getEstatisticas();
  }

  @Get('usuario')
  findByUsuario(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const usuarioId = req.user.id;
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.historicoFitasService.findByUsuario(usuarioId, pageNum, limitNum);
  }

  @Get('controle/:controleId')
  findByControle(@Param('controleId') controleId: string) {
    return this.historicoFitasService.findByControle(+controleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historicoFitasService.findOne(+id);
  }
}