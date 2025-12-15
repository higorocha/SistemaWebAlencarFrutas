import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissoesGuard } from '../../auth/guards/permissoes.guard';
import { Niveis } from '../../auth/decorators/niveis.decorator';
import { NivelUsuario } from '../../auth/dto';
import { PagamentosService } from '../../pagamentos/pagamentos.service';
import {
  LiberarPagamentosDto,
  CancelarPagamentosDto,
} from '../../pagamentos/dto/pagamentos.dto';

/**
 * Controller Mobile para operações de Pagamentos (BB)
 *
 * Importante:
 * - A liberação de pagamentos será utilizada pelo app (ADMIN apenas)
 * - Cancelamento está disponível, mas não é usado no fluxo atual
 */
@ApiTags('Mobile - Pagamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissoesGuard)
@Niveis(NivelUsuario.ADMINISTRADOR)
@Controller('api/mobile/pagamentos')
export class PagamentosMobileController {
  constructor(private readonly pagamentosService: PagamentosService) {}

  /**
   * Libera um lote de pagamentos (numeroRequisicao) na API do BB.
   * Apenas ADMINISTRADOR pode executar.
   */
  @Post('liberar')
  @ApiOperation({
    summary: 'Liberar lote de pagamentos (PIX/Boletos/Guias)',
    description:
      'Libera um lote de pagamentos previamente enviado ao Banco do Brasil, usando numeroRequisicao e indicadorFloat.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liberação enviada com sucesso para o Banco do Brasil',
    type: Object,
  })
  async liberarPagamentos(
    @Body() dto: LiberarPagamentosDto,
    @Request() req: any,
  ): Promise<any> {
    const usuarioId = req.user?.id;
    return this.pagamentosService.liberarPagamentos(dto, usuarioId);
  }

  /**
   * Cancelar pagamentos específicos.
   * Implementado para ficar pronto, mas uso não é obrigatório no fluxo atual.
   */
  @Post('cancelar')
  @ApiOperation({
    summary: 'Cancelar pagamentos específicos',
    description:
      'Cancela pagamentos informando contaCorrenteId e lista de códigos de pagamento.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cancelamento enviado com sucesso para o Banco do Brasil',
    type: Object,
  })
  async cancelarPagamentos(
    @Body() dto: CancelarPagamentosDto,
    @Request() req: any,
  ): Promise<any> {
    const usuarioId = req.user?.id;
    return this.pagamentosService.cancelarPagamentos(dto, usuarioId);
  }

  /**
   * Obter resumo de pagamentos (pendentes, liberados e rejeitados) para mobile
   */
  @Get('resumo')
  @ApiOperation({
    summary: 'Obter resumo de pagamentos (pendentes, liberados e rejeitados)',
    description:
      'Retorna contagem e valores totais de lotes pendentes, liberados e rejeitados para a tela de resumo do app mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumo de pagamentos obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        pendentes: {
          type: 'object',
          properties: {
            totalLotes: { type: 'number' },
            valorTotal: { type: 'number' },
          },
        },
        liberados: {
          type: 'object',
          properties: {
            totalLotes: { type: 'number' },
            valorTotal: { type: 'number' },
          },
        },
        rejeitados: {
          type: 'object',
          properties: {
            totalLotes: { type: 'number' },
            valorTotal: { type: 'number' },
          },
        },
      },
    },
  })
  async getResumoPagamentos(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('tipoData') tipoData?: string,
    @Query('contaCorrenteId') contaCorrenteId?: string,
  ) {
    const contaId = contaCorrenteId ? parseInt(contaCorrenteId, 10) : undefined;
    return this.pagamentosService.getResumoPagamentosMobile(
      dataInicio,
      dataFim,
      tipoData,
      contaId,
    );
  }

  /**
   * Listar lotes de pagamentos de turmas de colheita (mobile)
   */
  @Get('lotes-turma-colheita')
  @ApiOperation({
    summary: 'Listar lotes de pagamentos de turmas de colheita (mobile)',
    description:
      'Lista lotes de pagamentos vinculados a turmas de colheita, seguindo o padrão do módulo mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de lotes de pagamentos de turmas de colheita',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async listarLotesTurmaColheitaMobile(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('tipoData') tipoData?: string,
    @Query('contaCorrenteId') contaCorrenteId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const contaId = contaCorrenteId ? parseInt(contaCorrenteId, 10) : undefined;
    return this.pagamentosService.listarLotesTurmaColheita(
      dataInicio,
      dataFim,
      page,
      limit,
      tipoData,
      contaId,
    );
  }

  /**
   * Listar lotes de pagamentos de folhas de pagamento (mobile)
   */
  @Get('lotes-folha-pagamento')
  @ApiOperation({
    summary: 'Listar lotes de pagamentos de folhas de pagamento (mobile)',
    description:
      'Lista lotes de pagamentos vinculados a folhas de pagamento, seguindo o padrão do módulo mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de lotes de pagamentos de folhas de pagamento',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async listarLotesFolhaPagamentoMobile(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('tipoData') tipoData?: string,
    @Query('contaCorrenteId') contaCorrenteId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const contaId = contaCorrenteId ? parseInt(contaCorrenteId, 10) : undefined;
    return this.pagamentosService.listarLotesFolhaPagamento(
      dataInicio,
      dataFim,
      page,
      limit,
      tipoData,
      contaId,
    );
  }
}


