import { Controller, Get, Param, Res, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PdfService } from './pdf.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { formatCurrencyBR, formatDateBR, formatNumber } from '../utils/formatters';

@ApiTags('PDF')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly pedidosService: PedidosService,
  ) {}

  @Get('pedido/:id')
  @ApiOperation({ summary: 'Gerar PDF do pedido' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: {
      'application/pdf': {},
    },
  })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async downloadPedidoPdf(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() request?: any,
  ) {
    // Extrair dados do usuário do JWT
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    // 1. Busca dados usando o Service existente (reaproveita lógica)
    const pedido = await this.pedidosService.findOne(+id, usuarioNivel, usuarioCulturaId);

    // 2. Prepara dados para o template (formatação)
    const dadosTemplate = this.prepararDadosTemplate(pedido);

    // 3. Gera o PDF
    const buffer = await this.pdfService.gerarPdf('relatorio-pedidos', dadosTemplate);

    // 4. Configura Headers para download ou visualização
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=pedido-${pedido.numeroPedido}.pdf`,
      'Content-Length': buffer.length.toString(),
    });

    // 5. Envia o stream
    res.end(buffer);
  }

  /**
   * Prepara os dados do pedido para o template Handlebars
   * Formata valores monetários, datas e status
   */
  private prepararDadosTemplate(pedido: any): any {
    // Formatar status
    const statusMap: { [key: string]: string } = {
      PEDIDO_CRIADO: 'Pedido Criado',
      AGUARDANDO_COLHEITA: 'Aguardando Colheita',
      COLHEITA_PARCIAL: 'Colheita Parcial',
      COLHEITA_REALIZADA: 'Colheita Realizada',
      AGUARDANDO_PRECIFICACAO: 'Aguardando Precificação',
      PRECIFICACAO_REALIZADA: 'Precificação Realizada',
      AGUARDANDO_PAGAMENTO: 'Aguardando Pagamento',
      PAGAMENTO_PARCIAL: 'Pagamento Parcial',
      PEDIDO_FINALIZADO: 'Pedido Finalizado',
      CANCELADO: 'Cancelado',
    };

    const statusFormatado = statusMap[pedido.status] || pedido.status;
    const statusLower = pedido.status.toLowerCase().replace(/_/g, '-');

    // Formatar datas
    const dataPedidoFormatada = formatDateBR(pedido.dataPedido);
    const dataPrevistaColheitaFormatada = formatDateBR(pedido.dataPrevistaColheita);
    const dataColheitaFormatada = pedido.dataColheita ? formatDateBR(pedido.dataColheita) : null;
    const dataGeracaoFormatada = formatDateBR(new Date());

    // Formatar valores monetários
    const freteFormatado = pedido.frete ? formatCurrencyBR(pedido.frete) : null;
    const icmsFormatado = pedido.icms ? formatCurrencyBR(pedido.icms) : null;
    const descontoFormatado = pedido.desconto ? formatCurrencyBR(pedido.desconto) : null;
    const avariaFormatada = pedido.avaria ? formatCurrencyBR(pedido.avaria) : null;
    const valorFinalFormatado = pedido.valorFinal ? formatCurrencyBR(pedido.valorFinal) : null;
    const valorRecebidoFormatado = pedido.valorRecebido ? formatCurrencyBR(pedido.valorRecebido) : null;

    // Verificar se há valores para exibir
    const temValores = !!(freteFormatado || icmsFormatado || descontoFormatado || avariaFormatada || valorFinalFormatado);

    // Formatar frutas do pedido
    const frutasPedidosFormatadas = pedido.frutasPedidos?.map((frutaPedido: any) => {
      const quantidadePrevistaFormatada = formatNumber(frutaPedido.quantidadePrevista);
      const quantidadePrevistaFormatada2 = frutaPedido.unidadeMedida2 && frutaPedido.quantidadePrevista
        ? formatNumber(frutaPedido.quantidadePrevista)
        : null;

      const quantidadeRealFormatada = frutaPedido.quantidadeReal
        ? formatNumber(frutaPedido.quantidadeReal)
        : null;
      const quantidadeReal2Formatada = frutaPedido.quantidadeReal2 && frutaPedido.unidadeMedida2
        ? formatNumber(frutaPedido.quantidadeReal2)
        : null;

      const valorUnitarioFormatado = frutaPedido.valorUnitario
        ? formatCurrencyBR(frutaPedido.valorUnitario)
        : null;
      const valorTotalFormatado = frutaPedido.valorTotal
        ? formatCurrencyBR(frutaPedido.valorTotal)
        : null;

      return {
        ...frutaPedido,
        quantidadePrevistaFormatada,
        quantidadePrevistaFormatada2,
        quantidadeRealFormatada,
        quantidadeReal2Formatada,
        valorUnitarioFormatado,
        valorTotalFormatado,
      };
    }) || [];

    // Verificar se há quantidades reais ou valores unitários
    const temQuantidadeReal = frutasPedidosFormatadas.some(
      (fp: any) => fp.quantidadeRealFormatada || fp.quantidadeReal2Formatada,
    );
    const temValorUnitario = frutasPedidosFormatadas.some(
      (fp: any) => fp.valorUnitarioFormatado || fp.valorTotalFormatado,
    );

    return {
      ...pedido,
      // Status
      statusFormatado,
      statusLower,
      // Datas
      dataPedidoFormatada,
      dataPrevistaColheitaFormatada,
      dataColheitaFormatada,
      dataGeracaoFormatada,
      // Valores
      freteFormatado,
      icmsFormatado,
      descontoFormatado,
      avariaFormatada,
      valorFinalFormatado,
      valorRecebidoFormatado,
      temValores,
      // Frutas
      frutasPedidos: frutasPedidosFormatadas,
      temQuantidadeReal,
      temValorUnitario,
    };
  }
}

