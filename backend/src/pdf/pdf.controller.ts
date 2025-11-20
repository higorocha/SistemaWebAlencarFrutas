import { Controller, Get, Param, Res, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PdfService } from './pdf.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { ConfigService } from '../config/config.service';
import { ClientesService } from '../clientes/clientes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  formatCurrencyBR,
  formatDateBR,
  formatNumber,
  formatCPF,
  formatCNPJ,
  formatTelefone,
  capitalizeName,
  capitalizeNameShort,
} from '../utils/formatters';
import * as fs from 'fs/promises';
import * as path from 'path';

@ApiTags('PDF')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly pedidosService: PedidosService,
    private readonly configService: ConfigService,
    private readonly clientesService: ClientesService,
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

    // 2. Buscar dados completos do cliente (o findOne do pedido retorna apenas id, nome e industria)
    const clienteCompleto = pedido.clienteId 
      ? await this.clientesService.findOne(pedido.clienteId)
      : null;

    // 3. Buscar dados da empresa para o cabeçalho/rodapé
    const dadosEmpresa = await this.configService.findDadosEmpresa();

    // 4. Carregar logo em base64 para o PDF
    const logoBase64 = await this.carregarLogoBase64();

    // 5. Prepara dados para o template (formatação)
    const dadosTemplate = this.prepararDadosTemplate(pedido, clienteCompleto, dadosEmpresa, logoBase64);

    // 4. Gera o PDF
    const buffer = await this.pdfService.gerarPdf('pedido-criado', dadosTemplate);

    // 5. Configura Headers para download ou visualização
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=pedido-${pedido.numeroPedido}.pdf`,
      'Content-Length': buffer.length.toString(),
    });

    // 6. Envia o stream
    res.end(buffer);
  }

  /**
   * Carrega a logo e converte para base64
   */
  private async carregarLogoBase64(): Promise<string | null> {
    try {
      const logoPath = path.join(process.cwd(), 'src', 'pdf', 'assets', 'img', 'logoEstendido.png');
      const logoBuffer = await fs.readFile(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      return `data:image/png;base64,${logoBase64}`;
    } catch (error) {
      console.warn('Logo não encontrada, continuando sem logo:', error);
      return null;
    }
  }

  /**
   * Prepara os dados do pedido para o template Handlebars
   * Formata valores monetários, datas e status
   */
  private prepararDadosTemplate(pedido: any, clienteCompleto: any, dadosEmpresa: any, logoBase64: string | null): any {
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

    // Calcular dias desde a criação do pedido (sem considerar hora)
    const calcularDiasDesdePedido = () => {
      const hoje = new Date();
      const dataPedido = new Date(pedido.dataPedido);
      
      // Zerar horas para comparar apenas datas
      const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const pedidoSemHora = new Date(dataPedido.getFullYear(), dataPedido.getMonth(), dataPedido.getDate());
      
      // Calcular diferença em milissegundos e converter para dias
      const diffMs = hojeSemHora.getTime() - pedidoSemHora.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      return diffDias;
    };

    const diasDesdePedido = calcularDiasDesdePedido();
    const diasDesdePedidoTexto = diasDesdePedido > 0 ? `${diasDesdePedido} ${diasDesdePedido === 1 ? 'dia' : 'dias'}` : '';
    
    // Formatar número do pedido para exibir apenas a última parte (ex: "0152" de "#PED-2025-0152")
    const formatarNumeroPedido = (numeroPedido: string): string => {
      if (!numeroPedido) return '';
      const partes = numeroPedido.split('-');
      return partes.length > 0 ? partes[partes.length - 1] : numeroPedido;
    };
    const numeroPedidoFormatado = formatarNumeroPedido(pedido.numeroPedido);

    // Formatar valores monetários
    const freteFormatado = pedido.frete ? formatCurrencyBR(pedido.frete) : null;
    const icmsFormatado = pedido.icms ? formatCurrencyBR(pedido.icms) : null;
    const descontoFormatado = pedido.desconto ? formatCurrencyBR(pedido.desconto) : null;
    const avariaFormatada = pedido.avaria ? formatCurrencyBR(pedido.avaria) : null;
    const valorFinalFormatado = pedido.valorFinal ? formatCurrencyBR(pedido.valorFinal) : null;
    const valorRecebidoFormatado = pedido.valorRecebido ? formatCurrencyBR(pedido.valorRecebido) : null;

    // Verificar se há valores para exibir
    const temValores = !!(freteFormatado || icmsFormatado || descontoFormatado || avariaFormatada || valorFinalFormatado);

    const normalizarUnidade = (valor?: string | null) =>
      valor ? valor.toString().trim().toUpperCase() : null;

    const formatarQuantidade = (valor?: number | null) =>
      valor === null || valor === undefined ? null : formatNumber(valor);

    const formatarTexto = (
      valor: string | null | undefined,
      formatter: (texto: string) => string,
    ) => (valor ? formatter(valor) : null);

    const obterQuantidadePorUnidade = (
      frutaPedido: any,
      unidadesAlvo: string[],
    ): { quantidade: number | null; unidade: string | null } => {
      if (!unidadesAlvo?.length) {
        return { quantidade: null, unidade: null };
      }

      const unidadesNormalizadas = unidadesAlvo.map((unidade) => unidade.toUpperCase());
      const unidadePrecificada = normalizarUnidade(frutaPedido.unidadePrecificada);

      if (unidadePrecificada && unidadesNormalizadas.includes(unidadePrecificada)) {
        const quantidadePrecificada = frutaPedido.quantidadePrecificada ?? frutaPedido.quantidadeReal ?? frutaPedido.quantidadeReal2 ?? frutaPedido.quantidadePrevista;
        if (quantidadePrecificada !== null && quantidadePrecificada !== undefined) {
          return { quantidade: quantidadePrecificada, unidade: unidadePrecificada };
        }
      }

      const unidade1 = normalizarUnidade(frutaPedido.unidadeMedida1);
      if (unidade1 && unidadesNormalizadas.includes(unidade1)) {
        const quantidade =
          frutaPedido.quantidadeReal ??
          frutaPedido.quantidadePrecificada ??
          frutaPedido.quantidadePrevista ??
          null;
        if (quantidade !== null && quantidade !== undefined) {
          return { quantidade, unidade: unidade1 };
        }
      }

      const unidade2 = normalizarUnidade(frutaPedido.unidadeMedida2);
      if (unidade2 && unidadesNormalizadas.includes(unidade2)) {
        const quantidade =
          frutaPedido.quantidadeReal2 ??
          frutaPedido.quantidadePrecificada ??
          frutaPedido.quantidadeReal ??
          frutaPedido.quantidadePrevista ??
          null;
        if (quantidade !== null && quantidade !== undefined) {
          return { quantidade, unidade: unidade2 };
        }
      }

      return { quantidade: null, unidade: null };
    };

    // Formatar frutas do pedido
    const frutasPedidosFormatadas = pedido.frutasPedidos?.map((frutaPedido: any, index: number) => {
      const nomeFrutaOriginal = frutaPedido.fruta?.nome || frutaPedido.nome || '';
      const nomeFrutaFormatada = nomeFrutaOriginal ? capitalizeName(nomeFrutaOriginal) : '';

      const frutaFormatada = frutaPedido.fruta
        ? {
            ...frutaPedido.fruta,
            nome: frutaPedido.fruta.nome
              ? capitalizeName(frutaPedido.fruta.nome)
              : frutaPedido.fruta.nome,
            cultura: frutaPedido.fruta.cultura
              ? {
                  ...frutaPedido.fruta.cultura,
                  descricao: frutaPedido.fruta.cultura.descricao
                    ? capitalizeName(frutaPedido.fruta.cultura.descricao)
                    : frutaPedido.fruta.cultura.descricao,
                }
              : frutaPedido.fruta.cultura,
          }
        : frutaPedido.fruta;

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

      const dadosCxUnd = obterQuantidadePorUnidade(frutaPedido, ['CX', 'UND']);
      const dadosKg = obterQuantidadePorUnidade(frutaPedido, ['KG']);

      return {
        ...frutaPedido,
        itemNumero: index + 1,
        fruta: frutaFormatada,
        nomeFruta: nomeFrutaFormatada,
        quantidadePrevistaFormatada,
        quantidadePrevistaFormatada2,
        quantidadeRealFormatada,
        quantidadeReal2Formatada,
        valorUnitarioFormatado,
        valorTotalFormatado,
        quantidadeCxUndFormatada: formatarQuantidade(dadosCxUnd.quantidade),
        unidadeCxUnd: dadosCxUnd.unidade,
        quantidadeKgFormatada: formatarQuantidade(dadosKg.quantidade),
        unidadeKg: dadosKg.unidade,
      };
    }) || [];

    // Verificar se há quantidades reais ou valores unitários
    const temQuantidadeReal = frutasPedidosFormatadas.some(
      (fp: any) => fp.quantidadeRealFormatada || fp.quantidadeReal2Formatada,
    );
    const temValorUnitario = frutasPedidosFormatadas.some(
      (fp: any) => fp.valorUnitarioFormatado || fp.valorTotalFormatado,
    );

    // Obter ano atual para o rodapé
    const anoAtual = new Date().getFullYear();

    // Formatar dados do cliente (usar cliente completo se disponível)
    const clienteFormatado = clienteCompleto
      ? {
          ...clienteCompleto,
          nome: formatarTexto(clienteCompleto.nome, capitalizeNameShort),
          razaoSocial: formatarTexto(clienteCompleto.razaoSocial, capitalizeNameShort),
          logradouro: formatarTexto(clienteCompleto.logradouro, capitalizeName),
          bairro: formatarTexto(clienteCompleto.bairro, capitalizeName),
          cidade: formatarTexto(clienteCompleto.cidade, capitalizeName),
          complemento: formatarTexto(clienteCompleto.complemento, capitalizeName),
          cnpj: clienteCompleto.cnpj ? formatCNPJ(clienteCompleto.cnpj) : null,
          cpf: clienteCompleto.cpf ? formatCPF(clienteCompleto.cpf) : null,
          telefone1: clienteCompleto.telefone1 ? formatTelefone(clienteCompleto.telefone1) : null,
        }
      : null;

    return {
      ...pedido,
      // Número do pedido formatado (apenas última parte)
      numeroPedidoFormatado,
      // Cliente formatado
      cliente: clienteFormatado,
      // Dados da empresa (para header/footer)
      empresa: dadosEmpresa,
      // Logo em base64
      logoPath: logoBase64,
      // Ano atual para o rodapé
      anoAtual,
      // Título do documento
      titulo: 'Pedido Criado',
      subtitulo: `Pedido #${pedido.numeroPedido}`,
      // Status
      statusFormatado,
      statusLower,
      // Datas
      dataPedidoFormatada,
      diasDesdePedidoTexto, // Texto formatado com dias desde o pedido (ex: "3 dias" ou "")
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

