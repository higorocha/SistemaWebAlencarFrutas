import {
  Body,
  Controller,
  HttpStatus,
  Post,
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
}


