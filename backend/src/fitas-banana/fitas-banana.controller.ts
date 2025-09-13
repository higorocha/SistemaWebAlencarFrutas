import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FitasBananaService } from './fitas-banana.service';
import { CreateFitaBananaDto, UpdateFitaBananaDto } from './dto';

@Controller('fitas-banana')
@UseGuards(JwtAuthGuard)
export class FitasBananaController {
  constructor(private readonly fitasBananaService: FitasBananaService) {}

  @Post()
  create(@Body() createFitaBananaDto: CreateFitaBananaDto, @Req() req) {
    const usuarioId = req.user.id;
    return this.fitasBananaService.create(createFitaBananaDto, usuarioId);
  }

  @Get()
  findAll() {
    return this.fitasBananaService.findAll();
  }

  @Get('usuario')
  findByUsuario(@Req() req) {
    const usuarioId = req.user.id;
    return this.fitasBananaService.findByUsuario(usuarioId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fitasBananaService.findOne(+id);
  }

  @Get(':id/estoque')
  getEstoqueFita(@Param('id') id: string) {
    return this.fitasBananaService.getEstoqueFita(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFitaBananaDto: UpdateFitaBananaDto, @Req() req) {
    const usuarioId = req.user.id;
    return this.fitasBananaService.update(+id, updateFitaBananaDto, usuarioId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fitasBananaService.remove(+id);
  }
}