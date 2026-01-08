import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdiantamentosService } from './adiantamentos.service';
import { CreateAdiantamentoDto } from './dto/create-adiantamento.dto';
import { ListAdiantamentosQueryDto } from './dto/list-adiantamentos-query.dto';

@ApiTags('ARH - Adiantamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/arh/funcionarios/:funcionarioId/adiantamentos')
export class AdiantamentosController {
  constructor(private readonly service: AdiantamentosService) {}

  @Get()
  listarAdiantamentos(
    @Param('funcionarioId', ParseIntPipe) funcionarioId: number,
    @Query() query: ListAdiantamentosQueryDto,
  ) {
    return this.service.listarAdiantamentos(funcionarioId, query);
  }

  @Get('ativos')
  listarAdiantamentosAtivos(
    @Param('funcionarioId', ParseIntPipe) funcionarioId: number,
  ) {
    return this.service.listarAdiantamentosAtivos(funcionarioId);
  }

  @Post()
  criarAdiantamento(
    @Param('funcionarioId', ParseIntPipe) funcionarioId: number,
    @Body() dto: CreateAdiantamentoDto,
    @Req() req: any,
  ) {
    const usuarioId = req.user.id;
    return this.service.criarAdiantamento(funcionarioId, dto, usuarioId);
  }

  @Put(':id')
  atualizarAdiantamento(
    @Param('funcionarioId', ParseIntPipe) funcionarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAdiantamentoDto,
  ) {
    return this.service.atualizarAdiantamento(funcionarioId, id, dto);
  }

  @Delete(':id')
  excluirAdiantamento(
    @Param('funcionarioId', ParseIntPipe) funcionarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.excluirAdiantamento(funcionarioId, id);
  }
}
