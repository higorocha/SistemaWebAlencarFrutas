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
import { ProcessarPagamentoPixApiDto } from './dto/processar-pix-api.dto';
import { ReprocessarPagamentosRejeitadosDto } from './dto/reprocessar-pagamentos-rejeitados.dto';
import { GerenciarAdiantamentoDto } from './dto/gerenciar-adiantamento.dto';

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

  @Patch(':id/lancamentos/:lancamentoId/adiantamento')
  @Niveis(...ARH_OPERADORES)
  gerenciarAdiantamento(
    @Param('id', ParseIntPipe) id: number,
    @Param('lancamentoId', ParseIntPipe) lancamentoId: number,
    @Body() dto: GerenciarAdiantamentoDto,
  ) {
    return this.service.gerenciarAdiantamento(id, lancamentoId, dto);
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

  @Patch(':id/lancamentos/:lancamentoId')
  @Niveis(...ARH_OPERADORES)
  atualizarLancamento(
    @Param('id', ParseIntPipe) id: number,
    @Param('lancamentoId', ParseIntPipe) lancamentoId: number,
    @Body() dto: UpdateLancamentoDto,
  ) {
    return this.service.atualizarLancamento(id, lancamentoId, dto);
  }

  @Get(':id/lancamentos/:lancamentoId/adiantamentos-disponiveis')
  listarAdiantamentosDisponiveis(
    @Param('id', ParseIntPipe) id: number,
    @Param('lancamentoId', ParseIntPipe) lancamentoId: number,
  ) {
    return this.service.listarAdiantamentosDisponiveis(id, lancamentoId);
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

  /**
   * Processa os pagamentos da folha via PIX-API do Banco do Brasil
   * Cria um lote de transferências PIX (1 por funcionário)
   * Requer que a folha esteja em status PENDENTE_LIBERACAO
   * O lote ficará pendente de liberação por um administrador
   * 
   * @deprecated Use `PATCH /api/arh/folhas/:id/liberar` que orquestra automaticamente
   * o processamento PIX-API e a liberação em uma única operação.
   * Este endpoint será mantido apenas para compatibilidade e uso manual em casos específicos.
   */
  @Post(':id/processar-pix-api')
  @Niveis(NivelUsuario.ADMINISTRADOR, NivelUsuario.GERENTE_GERAL, NivelUsuario.ESCRITORIO)
  processarPagamentoPixApi(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessarPagamentoPixApiDto,
    @Request() req: any,
  ) {
    return this.service.processarPagamentoPixApi(id, dto, req.user.id);
  }

  /**
   * Reprocessa os salários brutos da folha
   * Atualiza os valores base (salário/diária) dos lançamentos com os valores atuais dos cargos/funções
   * Recalcula valor bruto e líquido de todos os lançamentos
   */
  @Patch(':id/reprocessar')
  @Niveis(...ARH_OPERADORES)
  reprocessarFolha(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.service.reprocessarFolha(id, req.user.id);
  }

  /**
   * Reprocessa pagamentos rejeitados de uma folha
   * Limpa os vínculos antigos e cria novos lotes ou marca como pago conforme o meio de pagamento
   */
  @Patch(':id/reprocessar-pagamentos-rejeitados')
  @Niveis(...ARH_OPERADORES)
  async reprocessarPagamentosRejeitados(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReprocessarPagamentosRejeitadosDto,
    @Request() req: any,
  ) {
    try {
      console.log('🔄 [CONTROLLER] Reprocessar pagamentos rejeitados - Início:', {
        folhaId: id,
        dto,
        usuarioId: req.user?.id,
      });
      const result = await this.service.reprocessarPagamentosRejeitados(id, dto, req.user.id);
      console.log('✅ [CONTROLLER] Reprocessar pagamentos rejeitados - Sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ [CONTROLLER] Erro ao reprocessar pagamentos rejeitados:', {
        folhaId: id,
        error: error.message,
        stack: error.stack,
        dto,
      });
      throw error;
    }
  }

  /**
   * Exclui uma folha de pagamento
   * Só é permitido se a folha estiver em status RASCUNHO
   */
  @Delete(':id')
  @Niveis(...ARH_OPERADORES)
  excluirFolha(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.service.excluirFolha(id, req.user.id);
  }
}

