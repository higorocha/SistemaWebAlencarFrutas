import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ControleBananaService } from './controle-banana.service';
import { CreateControleBananaDto, UpdateControleBananaDto } from './dto';

@Controller('controle-banana')
@UseGuards(JwtAuthGuard)
export class ControleBananaController {
  constructor(private readonly controleBananaService: ControleBananaService) {}

  @Post()
  create(@Body() createControleBananaDto: CreateControleBananaDto, @Req() req) {
    const usuarioId = req.user.id;
    return this.controleBananaService.create(createControleBananaDto, usuarioId);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.controleBananaService.findAll(pageNum, limitNum);
  }

  @Get('dashboard')
  getDashboardData() {
    return this.controleBananaService.getDashboardData();
  }

  @Get('areas-com-fitas')
  getAreasComFitas() {
    return this.controleBananaService.getAreasComFitas();
  }

  @Get('fitas-com-areas')
  getFitasComAreas() {
    return this.controleBananaService.getFitasComAreas();
  }

  @Post('subtrair-estoque')
  async subtrairEstoque(@Body() data: { detalhesAreas: Array<{fitaBananaId: number, areaId: number, quantidade: number, controleBananaId: number}> }, @Req() req) {
    const usuarioId = req.user.id;
    return this.controleBananaService.processarSubtracaoFitas(data.detalhesAreas, usuarioId);
  }

  @Get('detalhes-area/:areaId')
  getDetalhesArea(@Param('areaId') areaId: string) {
    return this.controleBananaService.getDetalhesArea(+areaId);
  }

  @Get('detalhes-fita/:fitaId')
  getDetalhesFita(@Param('fitaId') fitaId: string) {
    return this.controleBananaService.getDetalhesFita(+fitaId);
  }

  @Get('area/:areaId')
  findByArea(@Param('areaId') areaId: string) {
    return this.controleBananaService.findByArea(+areaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.controleBananaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateControleBananaDto: UpdateControleBananaDto, @Req() req) {
    const usuarioId = req.user.id;
    return this.controleBananaService.update(+id, updateControleBananaDto, usuarioId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const usuarioId = req.user.id;
    return this.controleBananaService.remove(+id, usuarioId);
  }
}