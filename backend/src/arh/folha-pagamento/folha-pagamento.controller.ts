import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissoesGuard } from '../../auth/guards/permissoes.guard';
import { Niveis } from '../../auth/decorators/niveis.decorator';
import { NivelUsuario } from '../../auth/dto';
import { FolhaPagamentoService } from './folha-pagamento.service';
import { ListFolhaQueryDto } from './dto/list-folha-query.dto';
import { CreateFolhaDto } from './dto/create-folha.dto';
import { ListLancamentosQueryDto } from './dto/list-lancamentos-query.dto';
import { AddFuncionariosFolhaDto } from './dto/add-funcionarios.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';
import { MarcarPagamentoDto } from './dto/marcar-pagamento.dto';
import { FinalizarFolhaDto } from './dto/finalizar-folha.dto';

const ARH_OPERADORES = [
  NivelUsuario.ADMINISTRADOR,
  NivelUsuario.GERENTE_GERAL,
  NivelUsuario.ESCRITORIO,
];

@ApiTags('ARH - Folha de Pagamento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissoesGuard)
@Controller('api/arh/folhas')
export class FolhaPagamentoController {
  constructor(private readonly service: FolhaPagamentoService) {}

  @Get()
  listar(@Query() query: ListFolhaQueryDto) {
    return this.service.listarFolhas(query);
  }

  @Post()
  @Niveis(...ARH_OPERADORES)
  criar(@Body() dto: CreateFolhaDto, @Request() req: any) {
    return this.service.criarFolha(dto, req.user.id);
  }

  @Get(':id')
  detalhes(@Param('id', ParseIntPipe) id: number) {
    return this.service.detalhesFolha(id);
  }

  @Get(':id/lancamentos')
  listarLancamentos(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListLancamentosQueryDto,
  ) {
    return this.service.listarLancamentos(id, query);
  }

  @Post(':id/lancamentos')
  @Niveis(...ARH_OPERADORES)
  adicionarFuncionarios(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddFuncionariosFolhaDto,
  ) {
    return this.service.adicionarFuncionarios(id, dto);
  }

  @Delete(':id/lancamentos/:lancamentoId')
  @Niveis(...ARH_OPERADORES)
  removerFuncionario(
    @Param('id', ParseIntPipe) id: number,
    @Param('lancamentoId', ParseIntPipe) lancamentoId: number,
  ) {
    return this.service.removerFuncionario(id, lancamentoId);
  }

  @Patch(':id/lancamentos/:lancamentoId')
  @Niveis(...ARH_OPERADORES)
  atualizarLancamento(
    @Param('id', ParseIntPipe) id: number,
    @Param('lancamentoId', ParseIntPipe) lancamentoId: number,
    @Body() dto: UpdateLancamentoDto,
  ) {
    return this.service.atualizarLancamento(id, lancamentoId, dto);
  }

  @Patch(':id/lancamentos/:lancamentoId/pagamento')
  @Niveis(...ARH_OPERADORES)
  marcarPagamento(
    @Param('id', ParseIntPipe) id: number,
    @Param('lancamentoId', ParseIntPipe) lancamentoId: number,
    @Body() dto: MarcarPagamentoDto,
  ) {
    return this.service.marcarPagamento(id, lancamentoId, dto);
  }

  @Patch(':id/finalizar')
  @Niveis(...ARH_OPERADORES)
  finalizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinalizarFolhaDto,
    @Request() req: any,
  ) {
    return this.service.finalizarFolha(id, dto, req.user.id);
  }

  @Patch(':id/reabrir')
  @Niveis(...ARH_OPERADORES)
  reabrir(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.service.reabrirFolha(id, req.user.id);
  }

  @Patch(':id/liberar')
  @Niveis(NivelUsuario.ADMINISTRADOR)
  liberar(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.service.liberarFolha(id, req.user.id);
  }
}

