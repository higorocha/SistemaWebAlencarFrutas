import { Controller, Get, Param, Res, UseGuards, Req, Query, Body, Post, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PdfService } from './pdf.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { ConfigService } from '../config/config.service';
import { ClientesService } from '../clientes/clientes.service';
import { FolhaPagamentoService } from '../arh/folha-pagamento/folha-pagamento.service';
import { ContaCorrenteService } from '../conta-corrente/conta-corrente.service';
import { ContaCorrenteResponseDto } from '../config/dto/conta-corrente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import {
  formatCurrencyBR,
  formatDateBR,
  formatDateBRSemTimezone,
  formatNumber,
  formatCPF,
  formatCNPJ,
  formatTelefone,
  capitalizeName,
  capitalizeNameShort,
  numeroParaExtenso,
} from '../utils/formatters';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as QRCode from 'qrcode';
import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom';
import svg64 from 'svg64';

// Importar jsbarcode usando require (compatibilidade com CommonJS)
const JSBarcode = require('jsbarcode');

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
    private readonly folhaPagamentoService: FolhaPagamentoService,
    private readonly contaCorrenteService: ContaCorrenteService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Gera PDF de pedido individual
   * @template pedido-criado.hbs
   * @description Gera PDF com resumo básico do pedido, incluindo informações do cliente, frutas, valores e observações
   * @endpoint GET /api/pdf/pedido/:id
   * @usage VisualizarPedidoModal.js - botão de visualizar/baixar PDF do pedido
   */
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
    console.log('[PDF Controller] Iniciando geração de PDF para pedido ID:', id);
    
    // Extrair dados do usuário do JWT
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    // 1. Busca dados usando o Service existente (reaproveita lógica)
    const pedido = await this.pedidosService.findOne(+id, usuarioNivel, usuarioCulturaId);
    console.log('[PDF Controller] Pedido encontrado. Número do pedido:', pedido?.numeroPedido);

    // 2. Buscar dados completos do cliente (o findOne do pedido retorna apenas id, nome e industria)
    const clienteCompleto = pedido.clienteId 
      ? await this.clientesService.findOne(pedido.clienteId)
      : null;

    // 3. Buscar dados da empresa para o cabeçalho/rodapé
    const dadosEmpresa = await this.configService.findDadosEmpresa();

    // 4. Carregar logo em base64 para o PDF
    const logoBase64 = await this.carregarLogoBase64();

    // 5. Prepara dados para o template (formatação)
    let dadosTemplate;
    try {
      dadosTemplate = this.prepararDadosTemplate(pedido, clienteCompleto, dadosEmpresa, logoBase64);
    } catch (error) {
      console.error('[PDF Controller] ❌ ERRO ao executar prepararDadosTemplate:', error);
      throw error;
    }

    // 4. Gera o PDF
    const buffer = await this.pdfService.gerarPdf('pedido-criado', dadosTemplate);

    // 5. Formatar nome do arquivo: pedido-0152-NomeCliente.pdf
    console.log('[PDF Controller] Formatando nome do arquivo...');
    console.log('[PDF Controller] Número pedido original:', pedido.numeroPedido);
    console.log('[PDF Controller] Tipo do número pedido:', typeof pedido.numeroPedido);
    
    // Extrai apenas a última parte numérica do número do pedido (ex: "0165" de "PED-2025-0165")
    let numeroPedidoFormatado = '';
    if (pedido.numeroPedido) {
      const numeroLimpo = String(pedido.numeroPedido).replace(/^#/, '').trim();
      console.log('[PDF Controller] Número limpo:', numeroLimpo);
      
      const partes = numeroLimpo.split('-');
      console.log('[PDF Controller] Partes após split:', partes);
      
      if (partes.length > 0) {
        numeroPedidoFormatado = partes[partes.length - 1];
        console.log('[PDF Controller] Última parte (número formatado):', numeroPedidoFormatado);
      } else {
        // Fallback: extrai últimos 4 dígitos
        const match = numeroLimpo.match(/(\d{4})$/);
        numeroPedidoFormatado = match ? match[1] : numeroLimpo;
        console.log('[PDF Controller] Fallback - número formatado:', numeroPedidoFormatado);
      }
    } else {
      console.log('[PDF Controller] AVISO: pedido.numeroPedido está vazio ou undefined!');
    }
    
    const nomeClienteArquivo = clienteCompleto?.nome 
      ? capitalizeNameShort(clienteCompleto.nome)
      : 'cliente';
    
    const nomeArquivo = this.gerarNomeArquivo({
      tipo: 'pedido',
      identificador: numeroPedidoFormatado || pedido.id?.toString(),
      cliente: nomeClienteArquivo,
    });
    console.log('[PDF Controller] Nome do arquivo final:', nomeArquivo);

    // 6. Configura Headers para download ou visualização
    console.log('[PDF Controller] Configurando headers com nome do arquivo:', nomeArquivo);
    
    // Usa RFC 5987 para encoding correto do nome do arquivo (suporta caracteres especiais)
    // Formato: attachment; filename="nome.pdf"; filename*=UTF-8''nome.pdf
    const contentDisposition = `attachment; filename="${nomeArquivo}"; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition,
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Length': buffer.length.toString(),
    });
    
    console.log('[PDF Controller] Content-Disposition header:', contentDisposition);
    console.log('[PDF Controller] Headers configurados. Enviando PDF...');

    // 7. Envia o stream
    res.end(buffer);
    console.log('[PDF Controller] PDF enviado com sucesso!');
  }

  private gerarNomeArquivo({
    tipo,
    identificador,
    cliente,
    extensao = 'pdf',
  }: {
    tipo: string;
    identificador?: string | number;
    cliente?: string;
    extensao?: string;
  }): string {
    const sanitize = (valor?: string | number) => {
      if (!valor && valor !== 0) return null;
      return String(valor)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
    };

    const partes = [tipo, identificador, cliente].map(sanitize).filter(Boolean);
    const base = partes.length > 0 ? partes.join('-') : 'documento';
    return `${base}.${extensao}`;
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
   * @template pedido-criado.hbs
   * @description Formata valores monetários, datas, status e organiza dados do pedido para renderização no PDF
   * Formata valores monetários, datas e status
   */
  private prepararDadosTemplate(pedido: any, clienteCompleto: any, dadosEmpresa: any, logoBase64: string | null): any {
    console.log('[PDF] 📋 Preparando dados do pedido:', {
      pedidoId: pedido?.id,
      numeroPedido: pedido?.numeroPedido,
      cliente: clienteCompleto?.nome || pedido?.cliente?.nome,
      totalFrutas: pedido?.frutasPedidos?.length || 0,
    });
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
      const unidade1 = normalizarUnidade(frutaPedido.unidadeMedida1);
      const unidade2 = normalizarUnidade(frutaPedido.unidadeMedida2);


      // ✅ CORREÇÃO: Verificar unidadeMedida1 PRIMEIRO (prioridade para quantidades reais colhidas)
      if (unidade1 && unidadesNormalizadas.includes(unidade1)) {
        // Prioridade: quantidadeReal (colhida) > quantidadePrecificada (se unidade corresponder) > quantidadePrevista
        let quantidade = frutaPedido.quantidadeReal ?? null;
        
        // Se não há quantidadeReal, verificar quantidadePrecificada (só se unidade precificada corresponder à unidadeMedida1)
        if (quantidade === null && unidadePrecificada === unidade1) {
          quantidade = frutaPedido.quantidadePrecificada ?? null;
        }
        
        // Se ainda não há, usar quantidadePrevista (sempre associada à unidadeMedida1)
        if (quantidade === null) {
          quantidade = frutaPedido.quantidadePrevista ?? null;
        }
        
        if (quantidade !== null && quantidade !== undefined && quantidade > 0) {
          return { quantidade, unidade: unidade1 };
        }
      }

      // ✅ CORREÇÃO: Verificar unidadeMedida2 - só usar quantidades associadas a essa unidade
      if (unidade2 && unidadesNormalizadas.includes(unidade2)) {
        // Prioridade: quantidadeReal2 (colhida na unidade 2)
        // NUNCA usar quantidadeReal aqui, pois ele está associado à unidadeMedida1
        const quantidade = frutaPedido.quantidadeReal2 ?? null;
        if (quantidade !== null && quantidade !== undefined && quantidade > 0) {
          return { quantidade, unidade: unidade2 };
        }
      }

      // ✅ CORREÇÃO: Se há unidade precificada e ela corresponde ao alvo, usar quantidade precificada (fallback)
      // Isso só acontece se não encontrou nas unidades medidas acima
      if (unidadePrecificada && unidadesNormalizadas.includes(unidadePrecificada)) {
        const quantidadePrecificada = frutaPedido.quantidadePrecificada;
        if (quantidadePrecificada !== null && quantidadePrecificada !== undefined && quantidadePrecificada > 0) {
          return { quantidade: quantidadePrecificada, unidade: unidadePrecificada };
        }
      }

      return { quantidade: null, unidade: null };
    };

    // ✅ LÓGICA INTELIGENTE: Verificar se há quantidade precificada > 0 no pedido
    // IMPORTANTE: unidadePrecificada sempre existe (recebe unidadeMedida1 por padrão)
    // Mas quantidadePrecificada pode ser 0 quando não foi precificado
    const temUnidadePrecificada = pedido.frutasPedidos?.some((fp: any) => {
      const qtdPrec = fp.quantidadePrecificada;
      const temQuantidade = qtdPrec !== null && qtdPrec !== undefined && Number(qtdPrec) > 0;
      return temQuantidade;
    }) || false;

    console.log('[PDF] 🔍 Modo de exibição:', {
      modo: temUnidadePrecificada ? 'INTELIGENTE (com precificação)' : 'PADRÃO (sem precificação)',
      totalFrutas: pedido.frutasPedidos?.length || 0,
    });

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

      // ✅ LÓGICA INTELIGENTE: Verificar se esta fruta tem quantidade precificada > 0
      // IMPORTANTE: unidadePrecificada sempre existe, mas quantidadePrecificada pode ser 0
      const unidadePrecificadaFruta = normalizarUnidade(frutaPedido.unidadePrecificada);
      const quantidadePrecificadaFruta = frutaPedido.quantidadePrecificada;
      const temPrecificacao = quantidadePrecificadaFruta !== null && 
                              quantidadePrecificadaFruta !== undefined && 
                              Number(quantidadePrecificadaFruta) > 0;

      console.log('[PDF] 🍎 Fruta:', {
        nome: nomeFrutaFormatada,
        modo: temPrecificacao ? 'INTELIGENTE' : 'PADRÃO',
        unidadeMedida1: normalizarUnidade(frutaPedido.unidadeMedida1),
        quantidadeReal: frutaPedido.quantidadeReal,
        unidadeMedida2: normalizarUnidade(frutaPedido.unidadeMedida2),
        quantidadeReal2: frutaPedido.quantidadeReal2,
        unidadePrecificada: unidadePrecificadaFruta,
        quantidadePrecificada: quantidadePrecificadaFruta,
      });

      let quantidadeColunaKg: { quantidade: number | null; unidade: string | null } = { quantidade: null, unidade: null };
      let quantidadeColunaCxUnd: { quantidade1: number | null; unidade1: string | null; quantidade2: number | null; unidade2: string | null } = {
        quantidade1: null,
        unidade1: null,
        quantidade2: null,
        unidade2: null,
      };
      let cabecalhoColunaKg = 'KG';
      let cabecalhoColunaCxUnd = 'CX/UND';

      if (temPrecificacao) {
        // ✅ MODO INTELIGENTE: Usar unidade precificada na coluna KG
        
        if (unidadePrecificadaFruta) {
          cabecalhoColunaKg = unidadePrecificadaFruta;
          quantidadeColunaKg = {
            quantidade: Number(quantidadePrecificadaFruta),
            unidade: unidadePrecificadaFruta,
          };
        }

        // Coluna CX/UND: exibir unidadeMedida1 e unidadeMedida2 (se existirem e não forem a mesma da precificada)
        const unidade1 = normalizarUnidade(frutaPedido.unidadeMedida1);
        const unidade2 = normalizarUnidade(frutaPedido.unidadeMedida2);
        
        
        // Se unidadeMedida1 não é a mesma da precificada, adicionar na coluna CX/UND
        if (unidade1 && unidade1 !== unidadePrecificadaFruta) {
          // Prioridade: quantidadeReal > quantidadePrevista
          const qtd1 = frutaPedido.quantidadeReal ?? frutaPedido.quantidadePrevista ?? null;
          if (qtd1 !== null && qtd1 !== undefined && qtd1 > 0) {
            quantidadeColunaCxUnd.quantidade1 = qtd1;
            quantidadeColunaCxUnd.unidade1 = unidade1;
          }
        }

        // Se unidadeMedida2 existe e não é a mesma da precificada, adicionar na coluna CX/UND
        if (unidade2 && unidade2 !== unidadePrecificadaFruta) {
          const qtd2 = frutaPedido.quantidadeReal2 ?? null;
          if (qtd2 !== null && qtd2 !== undefined && qtd2 > 0) {
            quantidadeColunaCxUnd.quantidade2 = qtd2;
            quantidadeColunaCxUnd.unidade2 = unidade2;
          }
        }

        // Ajustar cabeçalho da coluna CX/UND baseado nas unidades encontradas
        const unidadesCxUnd = [
          quantidadeColunaCxUnd.unidade1,
          quantidadeColunaCxUnd.unidade2,
        ].filter(Boolean);
        
        if (unidadesCxUnd.length > 0) {
          cabecalhoColunaCxUnd = unidadesCxUnd.join('/');
        } else {
          cabecalhoColunaCxUnd = quantidadeColunaCxUnd.unidade1 || quantidadeColunaCxUnd.unidade2 || 'CX/UND';
        }

      } else {
        // ✅ MODO PADRÃO: Comportamento original (quantidadePrecificada é 0 ou null)
        const dadosCxUnd = obterQuantidadePorUnidade(frutaPedido, ['CX', 'UND']);
        const dadosKg = obterQuantidadePorUnidade(frutaPedido, ['KG']);

        quantidadeColunaKg = dadosKg;
        quantidadeColunaCxUnd = {
          quantidade1: dadosCxUnd.quantidade,
          unidade1: dadosCxUnd.unidade,
          quantidade2: null,
          unidade2: null,
        };

      }

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
        // Dados para coluna KG (pode ser KG padrão ou unidade precificada)
        quantidadeKgFormatada: formatarQuantidade(quantidadeColunaKg.quantidade),
        unidadeKg: quantidadeColunaKg.unidade,
        quantidadeKg: quantidadeColunaKg.quantidade,
        // Dados para coluna CX/UND (pode ser CX/UND padrão ou unidadeMedida1/unidadeMedida2)
        quantidadeCxUndFormatada: formatarQuantidade(quantidadeColunaCxUnd.quantidade1),
        unidadeCxUnd: quantidadeColunaCxUnd.unidade1,
        quantidadeCxUnd: quantidadeColunaCxUnd.quantidade1,
        // Novos campos para suportar duas unidades na coluna CX/UND
        quantidadeCxUnd2Formatada: formatarQuantidade(quantidadeColunaCxUnd.quantidade2),
        unidadeCxUnd2: quantidadeColunaCxUnd.unidade2,
        quantidadeCxUnd2: quantidadeColunaCxUnd.quantidade2,
        // Flags para controle do template
        temPrecificacao,
        cabecalhoColunaKg,
        cabecalhoColunaCxUnd,
      };
    }) || [];

    // ✅ Calcular totais agrupados por unidade (considerando modo inteligente)
    let totalCx = 0;
    let totalUnd = 0;
    let totalKg = 0;
    let totalUnidadePrecificada = 0;
    const unidadesPrecificadas: Record<string, number> = {};

    // Determinar cabeçalhos dinâmicos (pegar da primeira fruta que tem precificação, se houver)
    let cabecalhoColunaKgGlobal = 'KG';
    let cabecalhoColunaCxUndGlobal = 'CX/UND';
    const primeiraFrutaComPrecificacao = frutasPedidosFormatadas.find((f: any) => f.temPrecificacao);
    if (primeiraFrutaComPrecificacao) {
      cabecalhoColunaKgGlobal = primeiraFrutaComPrecificacao.cabecalhoColunaKg || 'KG';
      cabecalhoColunaCxUndGlobal = primeiraFrutaComPrecificacao.cabecalhoColunaCxUnd || 'CX/UND';
    }

    frutasPedidosFormatadas.forEach((fruta: any) => {
      if (fruta.temPrecificacao) {
        // ✅ MODO INTELIGENTE: Calcular totais específicos
        // Total da unidade precificada (coluna KG dinâmica)
        if (fruta.unidadeKg && fruta.quantidadeKg !== null && fruta.quantidadeKg !== undefined) {
          const unidade = normalizarUnidade(fruta.unidadeKg);
          if (unidade) {
            if (!unidadesPrecificadas[unidade]) {
              unidadesPrecificadas[unidade] = 0;
            }
            unidadesPrecificadas[unidade] += fruta.quantidadeKg;
          }
        }

        // Totais para coluna CX/UND (unidadeMedida1 e unidadeMedida2)
        if (fruta.unidadeCxUnd) {
          const unidade1 = normalizarUnidade(fruta.unidadeCxUnd);
          if (unidade1 === 'CX' && fruta.quantidadeCxUnd !== null && fruta.quantidadeCxUnd !== undefined) {
            totalCx += fruta.quantidadeCxUnd;
          } else if (unidade1 === 'UND' && fruta.quantidadeCxUnd !== null && fruta.quantidadeCxUnd !== undefined) {
            totalUnd += fruta.quantidadeCxUnd;
          }
        }

        if (fruta.unidadeCxUnd2) {
          const unidade2 = normalizarUnidade(fruta.unidadeCxUnd2);
          if (unidade2 === 'CX' && fruta.quantidadeCxUnd2 !== null && fruta.quantidadeCxUnd2 !== undefined) {
            totalCx += fruta.quantidadeCxUnd2;
          } else if (unidade2 === 'UND' && fruta.quantidadeCxUnd2 !== null && fruta.quantidadeCxUnd2 !== undefined) {
            totalUnd += fruta.quantidadeCxUnd2;
          }
        }
      } else {
        // ✅ MODO PADRÃO: Comportamento original
        // Totais para coluna CX/UND
        if (fruta.unidadeCxUnd === 'CX' && fruta.quantidadeCxUnd !== null && fruta.quantidadeCxUnd !== undefined) {
          totalCx += fruta.quantidadeCxUnd;
        } else if (fruta.unidadeCxUnd === 'UND' && fruta.quantidadeCxUnd !== null && fruta.quantidadeCxUnd !== undefined) {
          totalUnd += fruta.quantidadeCxUnd;
        }
        
        // Totais para coluna KG
        if (fruta.unidadeKg === 'KG' && fruta.quantidadeKg !== null && fruta.quantidadeKg !== undefined) {
          totalKg += fruta.quantidadeKg;
        }
      }
    });

    console.log('[PDF] 📊 Totais do pedido:', {
      totalCx: totalCx > 0 ? `${totalCx} CX` : null,
      totalUnd: totalUnd > 0 ? `${totalUnd} UND` : null,
      totalKg: totalKg > 0 ? `${totalKg} KG` : null,
      totalUnidadePrecificada: primeiraFrutaComPrecificacao && primeiraFrutaComPrecificacao.unidadeKg
        ? (() => {
            const unidadeNormalizada = normalizarUnidade(primeiraFrutaComPrecificacao.unidadeKg);
            if (unidadeNormalizada && unidadesPrecificadas[unidadeNormalizada] > 0) {
              return `${unidadesPrecificadas[unidadeNormalizada]} ${unidadeNormalizada}`;
            }
            return null;
          })()
        : null,
      modo: temUnidadePrecificada ? 'INTELIGENTE' : 'PADRÃO',
    });

    // Formatar totais de CX/UND separadamente (para renderização inline)
    const totalCxFormatado = totalCx > 0 ? formatNumber(totalCx) : null;
    const totalUndFormatado = totalUnd > 0 ? formatNumber(totalUnd) : null;
    
    // Formatar total de KG separadamente (modo padrão)
    const totalKgFormatado = totalKg > 0 ? formatNumber(totalKg) : null;

    // Formatar total da unidade precificada (modo inteligente)
    const totalUnidadePrecificadaFormatado = primeiraFrutaComPrecificacao && primeiraFrutaComPrecificacao.unidadeKg
      ? (() => {
          const unidadeNormalizada = normalizarUnidade(primeiraFrutaComPrecificacao.unidadeKg);
          if (unidadeNormalizada && unidadesPrecificadas[unidadeNormalizada] > 0) {
            return formatNumber(unidadesPrecificadas[unidadeNormalizada]);
          }
          return null;
        })()
      : null;

    // Verificar se há quantidades reais ou valores unitários
    const temQuantidadeReal = frutasPedidosFormatadas.some(
      (fp: any) => fp.quantidadeRealFormatada || fp.quantidadeReal2Formatada,
    );
    const temValorUnitario = frutasPedidosFormatadas.some(
      (fp: any) => fp.valorUnitarioFormatado || fp.valorTotalFormatado,
    );

    // ✅ Calcular total das frutas (sem interferências de frete, ICMS, desconto, avaria)
    // Este é o valor que deve aparecer na tabela de frutas
    const totalFrutas = pedido.frutasPedidos?.reduce(
      (acc, frutaPedido) => acc + (parseFloat(frutaPedido.valorTotal) || 0),
      0
    ) || 0;
    const totalFrutasFormatado = totalFrutas > 0 ? formatCurrencyBR(totalFrutas) : null;

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
      // Total das frutas (sem interferências) - para exibir na tabela
      totalFrutasFormatado,
      // Frutas
      frutasPedidos: frutasPedidosFormatadas,
      temQuantidadeReal,
      temValorUnitario,
      // Totais agrupados por unidade (valores separados para renderização inline)
      totalCxFormatado,
      totalUndFormatado,
      totalKgFormatado,
      totalUnidadePrecificadaFormatado,
      // Cabeçalhos dinâmicos para o template
      cabecalhoColunaKg: cabecalhoColunaKgGlobal,
      cabecalhoColunaCxUnd: cabecalhoColunaCxUndGlobal,
      // Flag global para indicar se está usando modo inteligente
      usandoModoInteligente: temUnidadePrecificada,
    };
  }

  /**
   * Gera PDF da folha de pagamento
   * @template folha-pagamento.hbs
   * @description Gera PDF completo da folha de pagamento com lançamentos agrupados por gerente, gráfico histórico e resumo detalhado
   * @endpoint GET /api/pdf/folha-pagamento/:id
   * @usage Módulo ARH - Folha de Pagamento - botão de exportar PDF
   */
  @Get('folha-pagamento/:id')
  @ApiOperation({ summary: 'Gerar PDF da folha de pagamento' })
  @ApiParam({ name: 'id', description: 'ID da folha de pagamento' })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: {
      'application/pdf': {},
    },
  })
  @ApiResponse({ status: 404, description: 'Folha de pagamento não encontrada' })
  async downloadFolhaPagamentoPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    console.log('[PDF Controller] Iniciando geração de PDF para folha ID:', id);

    // 1. Buscar dados da folha
    const folha = await this.folhaPagamentoService.detalhesFolha(+id);
    console.log('[PDF Controller] Folha encontrada. Competência:', `${folha.competenciaMes}/${folha.competenciaAno}`);

    // 2. Buscar lançamentos da folha
    const lancamentos = await this.folhaPagamentoService.listarLancamentos(+id, {});

    // 3. Buscar últimas 6 folhas para o gráfico histórico (buscar mais para garantir que temos a atual + 5 anteriores)
    const ultimasFolhasResponse = await this.folhaPagamentoService.listarFolhas({
      limit: 10, // Buscar mais para garantir que temos a folha atual
      page: 1,
    });
    const ultimasFolhas = ultimasFolhasResponse?.data || [];

    // 4. Buscar dados da empresa para o cabeçalho/rodapé
    const dadosEmpresa = await this.configService.findDadosEmpresa();

    // 5. Buscar dados da conta corrente se for PIX_API
    let contaCorrente: ContaCorrenteResponseDto | null = null;
    if (folha.meioPagamento === 'PIX_API' && folha.contaCorrenteId) {
      try {
        contaCorrente = await this.contaCorrenteService.findOne(folha.contaCorrenteId);
      } catch (error) {
        console.warn('[PDF Controller] ⚠️ Erro ao buscar conta corrente:', error);
        // Não falhar a geração do PDF se a conta não for encontrada
      }
    }

    // 6. Carregar logo em base64 para o PDF
    const logoBase64 = await this.carregarLogoBase64();

    // 7. Preparar dados para o template (formatação e agrupamento)
    let dadosTemplate;
    try {
      dadosTemplate = this.prepararDadosTemplateFolha(folha, lancamentos, dadosEmpresa, logoBase64, ultimasFolhas, contaCorrente);
    } catch (error) {
      console.error('[PDF Controller] ❌ ERRO ao executar prepararDadosTemplateFolha:', error);
      throw error;
    }

    // 8. Gerar o PDF
    const buffer = await this.pdfService.gerarPdf('folha-pagamento', dadosTemplate);

    // 9. Formatar nome do arquivo: folha-pagamento-01-2025-1.pdf
    const competenciaLabel = `${String(folha.competenciaMes).padStart(2, '0')}/${folha.competenciaAno}`;
    const periodoLabel = folha.periodo ? `-${folha.periodo}` : '';
    const nomeArquivo = this.gerarNomeArquivo({
      tipo: 'folha-pagamento',
      identificador: `${String(folha.competenciaMes).padStart(2, '0')}-${folha.competenciaAno}${periodoLabel}`,
    });
    console.log('[PDF Controller] Nome do arquivo final:', nomeArquivo);

    // 10. Configurar Headers para download
    const contentDisposition = `attachment; filename="${nomeArquivo}"; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition,
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Length': buffer.length.toString(),
    });

    console.log('[PDF Controller] PDF enviado com sucesso!');

    // 11. Enviar o stream
    res.end(buffer);
  }

  /**
   * Prepara os dados da folha de pagamento para o template Handlebars
   * @template folha-pagamento.hbs
   * @description Formata valores monetários, datas e agrupa lançamentos por abas (gerentes)
   * Formata valores monetários, datas e agrupa lançamentos por abas (gerentes)
   */
  private prepararDadosTemplateFolha(folha: any, lancamentos: any[], dadosEmpresa: any, logoBase64: string | null, ultimasFolhas: any[] = [], contaCorrente: any = null): any {
    console.log('[PDF] 📋 Preparando dados da folha:', {
      folhaId: folha?.id,
      competencia: `${folha?.competenciaMes}/${folha?.competenciaAno}`,
      totalLancamentos: lancamentos?.length || 0,
    });

    // Formatar status
    const statusMap: { [key: string]: string } = {
      RASCUNHO: 'Rascunho',
      PENDENTE_LIBERACAO: 'Pendente Liberação',
      EM_PROCESSAMENTO: 'Em Processamento',
      FECHADA: 'Fechada',
      CANCELADA: 'Cancelada',
    };

    const statusFormatado = statusMap[folha.status] || folha.status;

    // Formatar datas
    // Usar formatDateBRSemTimezone para dataInicial e dataFinal para evitar problemas de timezone
    const dataInicialFormatada = formatDateBRSemTimezone(folha.dataInicial);
    const dataFinalFormatada = formatDateBRSemTimezone(folha.dataFinal);
    const dataPagamentoFormatada = folha.dataPagamento ? formatDateBR(folha.dataPagamento) : null;
    const dataGeracaoFormatada = formatDateBR(new Date());

    // Formatar competência
    const competenciaLabel = `${String(folha.competenciaMes).padStart(2, '0')}/${folha.competenciaAno}`;
    const periodoLabel = folha.periodo ? ` - ${folha.periodo}ª Quinzena` : '';
    const competenciaCompleta = `${competenciaLabel}${periodoLabel}`;

    // Formatar valores monetários
    const totalBrutoFormatado = formatCurrencyBR(Number(folha.totalBruto || 0));
    const totalLiquidoFormatado = formatCurrencyBR(Number(folha.totalLiquido || 0));
    const totalPagoFormatado = formatCurrencyBR(Number(folha.totalPago || 0));
    const totalPendenteFormatado = formatCurrencyBR(Number(folha.totalPendente || 0));

    // Formatar meio de pagamento
    const meioPagamentoMap: { [key: string]: string } = {
      PIX: 'PIX Manual',
      PIX_API: 'PIX - API (Banco do Brasil)',
      ESPECIE: 'Espécie',
    };
    const meioPagamentoFormatado = folha.meioPagamento ? (meioPagamentoMap[folha.meioPagamento] || folha.meioPagamento) : null;

    // Agrupar lançamentos por gerente (igual ao frontend)
    const lancamentosAgrupados = this.agruparLancamentosPorGerente(lancamentos);

    // Formatar lançamentos agrupados
    const abasFormatadas = this.formatarAbasLancamentos(lancamentosAgrupados);

    // Calcular resumo detalhado
    const resumoDetalhado = this.calcularResumoDetalhado(lancamentos);

    // Preparar dados do gráfico histórico (últimas 6 folhas)
    // Incluir a folha atual na lista se não estiver
    const folhasComAtual = ultimasFolhas.find((f: any) => f.id === folha.id)
      ? ultimasFolhas
      : [folha, ...ultimasFolhas];
    
    const dadosGraficoHistorico = this.prepararDadosGraficoHistorico(folhasComAtual, folha.id);
    
    // Serializar dados do gráfico para JSON (para uso no template)
    const dadosGraficoSerializado = dadosGraficoHistorico ? {
      labels: JSON.stringify(dadosGraficoHistorico.labels),
      datasets: dadosGraficoHistorico.datasets.map((dataset: any) => ({
        label: dataset.label,
        data: JSON.stringify(dataset.data),
        backgroundColor: Array.isArray(dataset.backgroundColor) 
          ? JSON.stringify(dataset.backgroundColor)
          : dataset.backgroundColor,
        borderColor: Array.isArray(dataset.borderColor)
          ? JSON.stringify(dataset.borderColor)
          : dataset.borderColor,
        borderWidth: Array.isArray(dataset.borderWidth)
          ? JSON.stringify(dataset.borderWidth)
          : (typeof dataset.borderWidth === 'number' ? dataset.borderWidth : JSON.stringify(dataset.borderWidth)),
      })),
      legendas: JSON.stringify(dadosGraficoHistorico.legendas || []),
      indiceFolhaAtual: dadosGraficoHistorico.indiceFolhaAtual,
    } : null;

    // Formatar dados da conta corrente (se PIX_API)
    const contaCorrenteAgencia = contaCorrente?.agencia || null;
    const contaCorrenteAgenciaDigito = contaCorrente?.agenciaDigito || null;
    const contaCorrenteNumero = contaCorrente?.contaCorrente || null;
    const contaCorrenteDigito = contaCorrente?.contaCorrenteDigito || null;
    const contaCorrenteFormatada = contaCorrente ? true : null;

    return {
      // Dados da folha
      folha: {
        id: folha.id,
        competenciaCompleta,
        competenciaMes: folha.competenciaMes,
        competenciaAno: folha.competenciaAno,
        periodo: folha.periodo,
        dataInicialFormatada,
        dataFinalFormatada,
        dataPagamentoFormatada,
        referencia: folha.referencia,
        status: folha.status,
        statusFormatado,
        observacoes: folha.observacoes,
        meioPagamento: folha.meioPagamento,
        meioPagamentoFormatado,
        contaCorrenteAgencia,
        contaCorrenteAgenciaDigito,
        contaCorrenteNumero,
        contaCorrenteDigito,
        contaCorrenteFormatada,
        totalBrutoFormatado,
        totalLiquidoFormatado,
        totalPagoFormatado,
        totalPendenteFormatado,
        quantidadeLancamentos: folha.quantidadeLancamentos || lancamentos.length,
      },
      // Dados da empresa (para header/footer)
      empresa: dadosEmpresa,
      // Logo em base64
      logoPath: logoBase64,
      // Data de geração
      dataGeracaoFormatada,
      // Ano atual para o rodapé
      anoAtual: new Date().getFullYear(),
      // Título do documento
      titulo: 'Folha de Pagamento',
      subtitulo: competenciaCompleta,
      // Resumo detalhado
      resumoDetalhado,
      // Dados do gráfico histórico (serializado para JSON)
      graficoHistorico: dadosGraficoSerializado,
      // Abas de lançamentos
      abas: abasFormatadas,
    };
  }

  /**
   * Prepara os dados para o gráfico histórico das últimas folhas
   * @template folha-pagamento.hbs (usado dentro do template)
   * @description Mostra apenas o valor líquido (efetivamente pago) de cada folha para o gráfico Chart.js
   * Mostra apenas o valor líquido (efetivamente pago) de cada folha
   */
  private prepararDadosGraficoHistorico(ultimasFolhas: any[], folhaAtualId: number): any {
    if (!ultimasFolhas || ultimasFolhas.length === 0) {
      return null;
    }

    // Ordenar todas as folhas (mais recente primeiro)
    const folhasOrdenadas = [...ultimasFolhas].sort((a, b) => {
      // Ordenar por ano e mês (mais recente primeiro)
      if (a.competenciaAno !== b.competenciaAno) {
        return b.competenciaAno - a.competenciaAno;
      }
      if (a.competenciaMes !== b.competenciaMes) {
        return b.competenciaMes - a.competenciaMes;
      }
      return (b.periodo || 0) - (a.periodo || 0);
    });

    // Pegar as últimas 6 folhas (já estão ordenadas por mais recente primeiro)
    const todasFolhas = folhasOrdenadas.slice(0, 6);

    // Reverter para mostrar mais antigas primeiro no gráfico (cronológico)
    todasFolhas.reverse();

    // Encontrar índice da folha atual na lista revertida
    const indiceFolhaAtualReversa = todasFolhas.findIndex((f) => f.id === folhaAtualId);

    // Cores diferentes para cada folha (paleta verde com variações)
    const cores = [
      'rgba(16, 185, 129, 0.7)',  // Verde esmeralda
      'rgba(34, 197, 94, 0.7)',   // Verde claro
      'rgba(74, 222, 128, 0.7)',  // Verde muito claro
      'rgba(110, 231, 183, 0.7)', // Verde pastel
      'rgba(167, 243, 208, 0.7)', // Verde muito pastel
      'rgba(209, 250, 229, 0.7)', // Verde muito claro
    ];
    
    const coresBorda = [
      'rgba(16, 185, 129, 1)',
      'rgba(34, 197, 94, 1)',
      'rgba(74, 222, 128, 1)',
      'rgba(110, 231, 183, 1)',
      'rgba(167, 243, 208, 1)',
      'rgba(209, 250, 229, 1)',
    ];

    // Cor especial para folha atual (verde mais escuro e vibrante)
    const corFolhaAtual = 'rgba(5, 150, 105, 0.9)'; // Verde principal mais opaco
    const corBordaFolhaAtual = 'rgba(5, 150, 105, 1)'; // Verde principal sólido

    // Formatar labels (competência) e valores
    const labels: string[] = [];
    const valoresLiquido: number[] = [];
    const coresBarras: string[] = [];
    const coresBordasBarras: string[] = [];
    const largurasBordas: number[] = [];
    const legendas: string[] = [];
    const indicesFolhaAtual: number[] = []; // Para marcar qual é a folha atual

    todasFolhas.forEach((folha, index) => {
      const competenciaLabel = `${String(folha.competenciaMes).padStart(2, '0')}/${folha.competenciaAno}`;
      const periodoLabel = folha.periodo ? `-${folha.periodo}` : '';
      const label = `${competenciaLabel}${periodoLabel}`;
      
      labels.push(label);

      // Usar apenas o valor líquido (efetivamente pago)
      const valorLiquido = Number(folha.totalLiquido || 0);
      valoresLiquido.push(valorLiquido);
      
      // Verificar se é a folha atual
      const isFolhaAtual = folha.id === folhaAtualId;
      
      if (isFolhaAtual) {
        // Folha atual: cor destacada e borda mais grossa
        coresBarras.push(corFolhaAtual);
        coresBordasBarras.push(corBordaFolhaAtual);
        largurasBordas.push(4); // Borda mais grossa
        indicesFolhaAtual.push(index);
      } else {
        // Outras folhas: cores normais
        // Usar índice ajustado para não usar a cor da folha atual
        let corIndex = index;
        if (indiceFolhaAtualReversa >= 0 && index > indiceFolhaAtualReversa) {
          corIndex = index - 1; // Ajustar se folha atual estiver antes
        }
        coresBarras.push(cores[corIndex % cores.length]);
        coresBordasBarras.push(coresBorda[corIndex % coresBorda.length]);
        largurasBordas.push(2); // Borda normal
      }
      
      // Formatar datas - usar formatDateBRSemTimezone para evitar problemas de timezone
      const dataInicialFormatada = formatDateBRSemTimezone(folha.dataInicial);
      const dataFinalFormatada = formatDateBRSemTimezone(folha.dataFinal);
      const referencia = folha.referencia || '-';
      
      // Criar legenda com todas as informações (marcar folha atual)
      const prefixoAtual = isFolhaAtual ? '⭐ ATUAL - ' : '';
      const legenda = `${prefixoAtual}${label} | ${formatCurrencyBR(valorLiquido)} | Ref: ${referencia} | ${dataInicialFormatada} a ${dataFinalFormatada}`;
      legendas.push(legenda);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Valor Líquido',
          data: valoresLiquido,
          backgroundColor: coresBarras, // Array de cores, uma para cada barra
          borderColor: coresBordasBarras, // Array de cores de borda
          borderWidth: largurasBordas, // Array de larguras de borda (folha atual tem borda mais grossa)
        },
      ],
      legendas, // Legendas customizadas para exibir no template
      indiceFolhaAtual: indiceFolhaAtualReversa >= 0 ? indiceFolhaAtualReversa : null, // Índice da folha atual na lista revertida
    };
  }

  /**
   * Agrupa lançamentos por gerente (igual à lógica do frontend)
   * @template folha-pagamento.hbs (método auxiliar)
   * @description Separa lançamentos em grupos: gerentes, sem gerente e por gerente individual
   */
  private agruparLancamentosPorGerente(lancamentos: any[]): {
    gerentes: any[];
    semGerente: any[];
    porGerente: Record<string, { gerente: any; lancamentos: any[] }>;
  } {
    const grupos: {
      gerentes: any[];
      semGerente: any[];
      porGerente: Record<string, { gerente: any; lancamentos: any[] }>;
    } = {
      gerentes: [],
      semGerente: [],
      porGerente: {},
    };

    lancamentos.forEach((lancamento) => {
      const funcionario = lancamento.funcionario;
      const tipoContrato = funcionario?.tipoContrato;
      const cargo = lancamento.cargo;

      // Verificar se é um gerente (mensalista com cargo gerencial)
      if (tipoContrato === 'MENSALISTA' && cargo?.isGerencial === true) {
        grupos.gerentes.push(lancamento);
      } else {
        // Para diaristas, verificar se têm gerente
        const gerente = funcionario?.gerente;
        if (gerente && gerente.id) {
          const gerenteId = String(gerente.id);
          if (!grupos.porGerente[gerenteId]) {
            grupos.porGerente[gerenteId] = {
              gerente: gerente,
              lancamentos: [],
            };
          }
          grupos.porGerente[gerenteId].lancamentos.push(lancamento);
        } else {
          // Diarista sem gerente
          grupos.semGerente.push(lancamento);
        }
      }
    });

    return grupos;
  }

  /**
   * Formata as abas de lançamentos para o template
   * @template folha-pagamento.hbs (método auxiliar)
   * @description Organiza lançamentos agrupados em abas formatadas para exibição no PDF
   */
  private formatarAbasLancamentos(lancamentosAgrupados: {
    gerentes: any[];
    semGerente: any[];
    porGerente: Record<string, { gerente: any; lancamentos: any[] }>;
  }): any[] {
    const abas: any[] = [];

    // 1. Aba: Gerentes (se houver)
    if (lancamentosAgrupados.gerentes.length > 0) {
      abas.push({
        titulo: `Gerentes (${lancamentosAgrupados.gerentes.length})`,
        lancamentos: this.formatarLancamentos(lancamentosAgrupados.gerentes),
      });
    }

    // 2. Aba: Diaristas sem gerente (se houver)
    if (lancamentosAgrupados.semGerente.length > 0) {
      abas.push({
        titulo: `Sem Gerente (${lancamentosAgrupados.semGerente.length})`,
        lancamentos: this.formatarLancamentos(lancamentosAgrupados.semGerente),
      });
    }

    // 3. Abas: Cada gerente individual (ordenadas por nome)
    const gerentesOrdenados = Object.values(lancamentosAgrupados.porGerente).sort(
      (a, b) => {
        const nomeA = a.gerente?.nome || '';
        const nomeB = b.gerente?.nome || '';
        return nomeA.localeCompare(nomeB);
      }
    );

    gerentesOrdenados.forEach((grupo) => {
      if (grupo.lancamentos.length > 0) {
        abas.push({
          titulo: `${capitalizeName(grupo.gerente.nome)} (${grupo.lancamentos.length})`,
          lancamentos: this.formatarLancamentos(grupo.lancamentos),
        });
      }
    });

    return abas;
  }

  /**
   * Formata uma lista de lançamentos para exibição no PDF
   * @template folha-pagamento.hbs (método auxiliar)
   * @description Formata valores monetários, datas e status de cada lançamento
   */
  private formatarLancamentos(lancamentos: any[]): any[] {
    return lancamentos.map((lancamento, index) => {
      const funcionario = lancamento.funcionario;
      const cargo = lancamento.cargo;
      const funcao = lancamento.funcao;

      // Determinar cargo/função
      const cargoFuncao = cargo?.nome || funcao?.nome || lancamento.referenciaNomeCargo || lancamento.referenciaNomeFuncao || '-';
      const tipoContrato = funcionario?.tipoContrato || lancamento.tipoContrato;

      // Formatar valores base (salário para mensalista, diária para diarista)
      const salarioBase = Number(lancamento.salarioBaseReferencia || 0);
      const valorDiaria = Number(lancamento.valorDiariaAplicada || 0);
      
      // Determinar o valor base a ser exibido baseado no tipo de contrato
      let baseFormatado: string | null = null;
      let baseTipo: string | null = null; // "Salário" ou "Diária"
      
      if (tipoContrato === 'MENSALISTA') {
        // Para mensalista, mostrar o salário base se existir e for maior que 0
        if (salarioBase > 0) {
          baseFormatado = formatCurrencyBR(salarioBase);
          baseTipo = 'Salário';
        }
      } else if (tipoContrato === 'DIARISTA') {
        // Para diarista, mostrar o valor da diária se existir e for maior que 0
        if (valorDiaria > 0) {
          baseFormatado = formatCurrencyBR(valorDiaria);
          baseTipo = 'Diária';
        }
      } else {
        // Para outros tipos, tentar salário primeiro, depois diária
        if (salarioBase > 0) {
          baseFormatado = formatCurrencyBR(salarioBase);
          baseTipo = 'Salário';
        } else if (valorDiaria > 0) {
          baseFormatado = formatCurrencyBR(valorDiaria);
          baseTipo = 'Diária';
        }
      }
      
      // Manter campos separados para compatibilidade (se necessário)
      const salarioBaseFormatado = salarioBase > 0 ? formatCurrencyBR(salarioBase) : null;
      const valorDiariaFormatado = valorDiaria > 0 ? formatCurrencyBR(valorDiaria) : null;
      const horasExtrasFormatadas = lancamento.horasExtras
        ? `${formatNumber(Number(lancamento.horasExtras))}h`
        : null;
      const valorHoraExtraFormatado = lancamento.valorHoraExtra
        ? formatCurrencyBR(Number(lancamento.valorHoraExtra))
        : null;
      const valorHorasExtrasTotal = lancamento.horasExtras && lancamento.valorHoraExtra
        ? formatCurrencyBR(Number(lancamento.horasExtras) * Number(lancamento.valorHoraExtra))
        : null;
      const ajudaCustoFormatado = lancamento.ajudaCusto
        ? formatCurrencyBR(Number(lancamento.ajudaCusto))
        : null;
      const extrasFormatado = lancamento.extras
        ? formatCurrencyBR(Number(lancamento.extras))
        : null;
      const adiantamentoFormatado = lancamento.adiantamento
        ? formatCurrencyBR(Number(lancamento.adiantamento))
        : null;
      const valorBrutoFormatado = formatCurrencyBR(Number(lancamento.valorBruto || 0));
      const valorLiquidoFormatado = formatCurrencyBR(Number(lancamento.valorLiquido || 0));

      // Formatar status de pagamento
      const statusPagamentoMap: { [key: string]: string } = {
        PENDENTE: 'Pendente',
        ENVIADO: 'Enviado',
        ACEITO: 'Aceito',
        PROCESSANDO: 'Processando',
        PAGO: 'Pago',
        REJEITADO: 'Rejeitado',
        CANCELADO: 'Cancelado',
        ERRO: 'Erro',
      };
      const statusPagamentoFormatado = statusPagamentoMap[lancamento.statusPagamento] || lancamento.statusPagamento;

      // Formatar chave PIX para exibição (substituindo CPF)
      const chavePixFormatada = funcionario?.chavePix 
        ? `PIX: ${funcionario.chavePix}` 
        : null;

      return {
        itemNumero: index + 1,
        funcionario: {
          nome: capitalizeName(funcionario?.nome || ''),
          apelido: funcionario?.apelido ? capitalizeName(funcionario.apelido) : null,
          cpf: chavePixFormatada, // Agora exibe chave PIX ao invés de CPF
        },
        cargoFuncao: capitalizeName(cargoFuncao),
        tipoContrato,
        diasTrabalhados: lancamento.diasTrabalhados || 0,
        faltas: lancamento.faltas || 0,
        baseFormatado, // Valor base formatado (salário ou diária conforme tipo de contrato)
        baseTipo, // Tipo do valor base ("Salário" ou "Diária")
        salarioBaseFormatado, // Mantido para compatibilidade
        valorDiariaFormatado, // Mantido para compatibilidade
        horasExtrasFormatadas,
        valorHoraExtraFormatado,
        valorHorasExtrasTotal,
        ajudaCustoFormatado,
        extrasFormatado,
        adiantamentoFormatado,
        valorBrutoFormatado,
        valorLiquidoFormatado,
        statusPagamento: lancamento.statusPagamento,
        statusPagamentoFormatado,
        pagamentoEfetuado: lancamento.pagamentoEfetuado || false,
      };
    });
  }

  /**
   * Calcula resumo detalhado dos lançamentos
   * @template folha-pagamento.hbs (método auxiliar)
   * @description Calcula totais de horas extras, valores, descontos e quantidades para o resumo
   */
  private calcularResumoDetalhado(lancamentos: any[]): any {
    if (!lancamentos || lancamentos.length === 0) {
      return {
        totalHorasExtras: 0,
        totalValorHorasExtras: 0,
        totalAjudaCusto: 0,
        totalExtras: 0,
        totalAdiantamento: 0,
        quantidadeFuncionarios: 0,
        quantidadeComValores: 0,
        quantidadePendentes: 0,
        quantidadePagos: 0,
      };
    }

    const totalHorasExtras = lancamentos.reduce((sum, l) => sum + Number(l.horasExtras || 0), 0);
    const totalValorHorasExtras = lancamentos.reduce((sum, l) => {
      const horas = Number(l.horasExtras || 0);
      const valorHora = Number(l.valorHoraExtra || 0);
      return sum + (horas * valorHora);
    }, 0);
    const totalAjudaCusto = lancamentos.reduce((sum, l) => sum + Number(l.ajudaCusto || 0), 0);
    const totalExtras = lancamentos.reduce((sum, l) => sum + Number(l.extras || 0), 0);
    const totalAdiantamento = lancamentos.reduce((sum, l) => sum + Number(l.adiantamento || 0), 0);
    const quantidadeFuncionarios = lancamentos.length;
    const quantidadeComValores = lancamentos.filter(l => {
      const tipoContrato = l.funcionario?.tipoContrato;
      const temValorBruto = Number(l.valorBruto || 0) > 0;
      const temDiasTrabalhados = l.diasTrabalhados !== null && l.diasTrabalhados !== undefined;

      if (tipoContrato === 'MENSALISTA') {
        return temValorBruto;
      }
      if (tipoContrato === 'DIARISTA') {
        return temDiasTrabalhados && temValorBruto;
      }
      return temDiasTrabalhados;
    }).length;
    const quantidadePendentes = lancamentos.filter(l => l.statusPagamento === 'PENDENTE').length;
    const quantidadePagos = lancamentos.filter(l => l.statusPagamento === 'PAGO').length;

    return {
      totalHorasExtras,
      totalValorHorasExtras,
      totalAjudaCusto,
      totalExtras,
      totalAdiantamento,
      quantidadeFuncionarios,
      quantidadeComValores,
      quantidadePendentes,
      quantidadePagos,
      // Formatados
      totalHorasExtrasFormatado: `${formatNumber(totalHorasExtras)}h`,
      totalValorHorasExtrasFormatado: formatCurrencyBR(totalValorHorasExtras),
      totalAjudaCustoFormatado: formatCurrencyBR(totalAjudaCusto),
      totalExtrasFormatado: formatCurrencyBR(totalExtras),
      totalAdiantamentoFormatado: formatCurrencyBR(totalAdiantamento),
    };
  }

  /**
   * Gera PDF com lista de pedidos do cliente
   * @template pedidos-cliente.hbs
   * @description Gera PDF com todos os pedidos selecionados/filtrados do cliente, incluindo qualificação do cliente, frutas de cada pedido e totalização
   * @endpoint POST /api/pdf/pedidos-cliente/:clienteId
   * @body { pedidosIds?: number[] } - IDs dos pedidos a incluir (opcional - se vazio, inclui todos filtrados)
   * @usage PedidosClienteModal.js - botão "Exportar PDF" com seleção de pedidos via checkboxes
   */
  @Post('pedidos-cliente/:clienteId')
  @ApiOperation({ summary: 'Gerar PDF dos pedidos do cliente' })
  @ApiParam({ name: 'clienteId', description: 'ID do cliente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pedidosIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'IDs dos pedidos a incluir no PDF (opcional - se vazio, inclui todos os pedidos filtrados)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: {
      'application/pdf': {},
    },
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async downloadPedidosClientePdf(
    @Param('clienteId') clienteId: string,
    @Body() body: { pedidosIds?: number[] },
    @Res() res: Response,
    @Req() request?: any,
  ) {
    console.log('[PDF Controller] Iniciando geração de PDF para pedidos do cliente ID:', clienteId);
    console.log('[PDF Controller] Pedidos selecionados:', body?.pedidosIds);

    // Extrair dados do usuário do JWT
    const usuarioNivel = request?.user?.nivel;
    const usuarioCulturaId = request?.user?.culturaId;

    // 1. Buscar dados completos do cliente
    const clienteCompleto = await this.clientesService.findOne(+clienteId);
    if (!clienteCompleto) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    // 2. Buscar pedidos do cliente usando o serviço existente
    const pedidosResponse = await this.pedidosService.findByCliente(
      +clienteId,
      undefined, // sem filtro de status
      usuarioNivel,
      usuarioCulturaId,
    );

    let pedidosParaPDF = pedidosResponse.data || [];

    // 3. Filtrar pedidos se IDs foram fornecidos
    if (body?.pedidosIds && Array.isArray(body.pedidosIds) && body.pedidosIds.length > 0) {
      pedidosParaPDF = pedidosParaPDF.filter((pedido: any) =>
        body.pedidosIds!.includes(pedido.id),
      );
      console.log('[PDF Controller] Filtrados', pedidosParaPDF.length, 'pedidos selecionados');
    }

    if (pedidosParaPDF.length === 0) {
      throw new BadRequestException('Nenhum pedido encontrado para gerar o PDF');
    }

    // 4. Buscar dados completos dos pedidos (com frutasPedidos detalhadas)
    const pedidosCompletos = await Promise.all(
      pedidosParaPDF.map(async (pedido: any) => {
        return await this.pedidosService.findOne(pedido.id, usuarioNivel, usuarioCulturaId);
      }),
    );

    // 5. Buscar dados da empresa para o cabeçalho/rodapé
    const dadosEmpresa = await this.configService.findDadosEmpresa();

    // 6. Carregar logo em base64 para o PDF
    const logoBase64 = await this.carregarLogoBase64();

    // 7. Preparar dados para o template
    let dadosTemplate;
    try {
      dadosTemplate = this.prepararDadosTemplatePedidosCliente(
        clienteCompleto,
        pedidosCompletos,
        dadosEmpresa,
        logoBase64,
      );
    } catch (error) {
      console.error('[PDF Controller] ❌ ERRO ao executar prepararDadosTemplatePedidosCliente:', error);
      throw error;
    }

    // 8. Gerar o PDF
    const buffer = await this.pdfService.gerarPdf('pedidos-cliente', dadosTemplate);

    // 9. Formatar nome do arquivo
    const nomeClienteArquivo = capitalizeNameShort(clienteCompleto.nome || 'cliente');
    const nomeArquivo = this.gerarNomeArquivo({
      tipo: 'pedidos-cliente',
      identificador: clienteId,
      cliente: nomeClienteArquivo,
    });
    console.log('[PDF Controller] Nome do arquivo final:', nomeArquivo);

    // 10. Configurar Headers para download
    const contentDisposition = `attachment; filename="${nomeArquivo}"; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition,
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Length': buffer.length.toString(),
    });

    console.log('[PDF Controller] PDF enviado com sucesso!');

    // 11. Enviar o stream
    res.end(buffer);
  }

  /**
   * Gera PDF global de colheitas de um fornecedor (respeitando filtros opcionais do modal)
   * @template fornecedor-colheitas.hbs
   * @endpoint POST /api/pdf/fornecedor-colheitas/:fornecedorId
   * @usage EstatisticasFornecedorModal.js - botão "Gerar PDF"
   */
  @Post('fornecedor-colheitas/:fornecedorId')
  @ApiOperation({ summary: 'Gerar PDF de colheitas do fornecedor' })
  @ApiParam({ name: 'fornecedorId', description: 'ID do fornecedor' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aplicarFiltros: { type: 'boolean', description: 'Se true, aplica filtros do modal no PDF (gráfico e listagens)' },
        filtroBusca: { type: 'string', description: 'Busca por pedido, fruta, área ou quantidade (opcional)' },
        dataInicio: { type: 'string', description: 'Data início (YYYY-MM-DD) (opcional)' },
        dataFim: { type: 'string', description: 'Data fim (YYYY-MM-DD) (opcional)' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: { 'application/pdf': {} },
  })
  async downloadFornecedorColheitasPdf(
    @Param('fornecedorId') fornecedorId: string,
    @Body()
    body: {
      aplicarFiltros?: boolean;
      filtroBusca?: string;
      dataInicio?: string;
      dataFim?: string;
    },
    @Res() res: Response,
  ) {
    const fornecedorIdNum = Number(fornecedorId);
    if (!Number.isFinite(fornecedorIdNum)) {
      throw new BadRequestException('fornecedorId inválido');
    }

    // 1) Buscar fornecedor
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id: fornecedorIdNum },
      select: { id: true, nome: true },
    });
    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    // 2) Buscar áreas e colheitas (por relação frutas_pedidos_areas)
    const areas = await this.prisma.areaFornecedor.findMany({
      where: { fornecedorId: fornecedorIdNum },
      select: {
        id: true,
        nome: true,
        quantidadeHa: true,
        frutasPedidosAreas: {
          where: { areaFornecedorId: { not: null } },
          select: {
            id: true,
            quantidadeColhidaUnidade1: true,
            quantidadeColhidaUnidade2: true,
            frutaPedido: {
              select: {
                id: true,
                frutaId: true,
                quantidadePrevista: true,
                quantidadeReal: true,
                quantidadeReal2: true,
                quantidadePrecificada: true,
                unidadeMedida1: true,
                unidadeMedida2: true,
                unidadePrecificada: true,
                // ✅ Valor de venda (precificação do pedido)
                valorUnitario: true,
                valorTotal: true,
                fruta: {
                  select: {
                    id: true,
                    nome: true,
                    cultura: { select: { id: true, descricao: true } },
                  },
                },
                pedido: {
                  select: {
                    id: true,
                    numeroPedido: true,
                    dataColheita: true,
                    status: true,
                  },
                },
                areas: {
                  select: {
                    id: true,
                    quantidadeColhidaUnidade1: true,
                    quantidadeColhidaUnidade2: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 3) Buscar pagamentos do fornecedor (compra) para mapear com colheitas
    const pagamentos = await this.prisma.fornecedorPagamento.findMany({
      where: { fornecedorId: fornecedorIdNum },
      select: {
        id: true,
        frutaPedidoAreaId: true,
        status: true,
        quantidade: true,
        unidadeMedida: true,
        valorUnitario: true,
        valorTotal: true,
        dataColheita: true,
        dataPagamento: true,
      },
    });
    const pagamentoPorRelacao = new Map<number, typeof pagamentos[0]>();
    pagamentos.forEach((p) => {
      pagamentoPorRelacao.set(p.frutaPedidoAreaId, p);
    });

    // Helpers de data (ainda usados para formatação nas tabelas)
    const normalizarDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    
    // Helpers de semana - COMENTADOS (não mais necessários sem o gráfico)
    /*
    const getMondayWeekStart = (d: Date) => {
      const dia = normalizarDia(d);
      const day = dia.getDay(); // 0=dom,1=seg,...6=sab
      const diff = (day + 6) % 7; // seg=0 ... dom=6
      const monday = new Date(dia);
      monday.setDate(monday.getDate() - diff);
      return monday;
    };
    const weekKey = (monday: Date) => monday.toISOString().slice(0, 10);
    const weekLabel = (monday: Date) => {
      const domingo = new Date(monday);
      domingo.setDate(domingo.getDate() + 6);
      const fmt = (x: Date) => {
        const dd = String(x.getDate()).padStart(2, '0');
        const mm = String(x.getMonth() + 1).padStart(2, '0');
        return `${dd}/${mm}`;
      };
      return `${fmt(monday)}–${fmt(domingo)}`;
    };
    */

    // Helpers de formatação
    const formatarNumeroPedido = (numeroPedido: string): string => {
      if (!numeroPedido) return '';
      const partes = numeroPedido.split('-');
      return partes.length > 0 ? partes[partes.length - 1] : numeroPedido;
    };

    // 4) Montar lista de colheitas (base)
    type ColheitaPdf = {
      id: number; // relação frutas_pedidos_areas
      pedidoId: number;
      pedido: string;
      frutaPedidoId: number;
      frutaId: number;
      fruta: string;
      cultura: string;
      areaId: number;
      areaNome: string;
      areaHa: number | null;
      dataColheita: Date | null;
      quantidade: number;
      unidade: string;
      // compra (fornecedor)
      pagamentoId: number | null;
      statusCompra: string | null;
      valorUnitarioCompra: number | null;
      valorTotalCompra: number | null;
      // venda (pedido)
      valorUnitarioVenda: number | null;
      valorTotalVendaProporcional: number | null;
      temVenda: boolean;
    };

    const colheitasBase: ColheitaPdf[] = [];

    areas.forEach((area) => {
      area.frutasPedidosAreas.forEach((relacao) => {
        const fp = relacao.frutaPedido;
        if (!fp?.pedido || !fp.fruta) return;

        const quantidadeArea =
          relacao.quantidadeColhidaUnidade1 ??
          relacao.quantidadeColhidaUnidade2 ??
          fp.quantidadeReal ??
          fp.quantidadePrecificada ??
          fp.quantidadePrevista ??
          0;

        const somaAreasRelacionadas = (fp.areas || []).reduce((acc, a) => {
          const q = a.quantidadeColhidaUnidade1 ?? a.quantidadeColhidaUnidade2 ?? 0;
          return acc + q;
        }, 0);

        const quantidadeReferencia =
          (fp.quantidadeReal ??
            fp.quantidadePrecificada ??
            fp.quantidadePrevista ??
            somaAreasRelacionadas) || 0;

        const pagamento = pagamentoPorRelacao.get(relacao.id);
        const temPagamento = !!pagamento?.id;

        const vendaTotalFruta = typeof fp.valorTotal === 'number' ? fp.valorTotal : 0;
        const vendaUnit = typeof fp.valorUnitario === 'number' ? fp.valorUnitario : 0;
        const temVenda = vendaTotalFruta > 0 && vendaUnit > 0;
        let vendaProporcional: number | null = null;
        if (temVenda && quantidadeReferencia > 0) {
          vendaProporcional = (vendaTotalFruta * (Number(quantidadeArea) || 0)) / quantidadeReferencia;
        }

        const dataColheita = fp.pedido.dataColheita
          ? new Date(fp.pedido.dataColheita)
          : pagamento?.dataColheita
            ? new Date(pagamento.dataColheita)
            : null;

        colheitasBase.push({
          id: relacao.id,
          pedidoId: fp.pedido.id,
          pedido: formatarNumeroPedido(fp.pedido.numeroPedido), // ✅ Formatado (ex: "0017" ao invés de "PED-2025-0017")
          frutaPedidoId: fp.id,
          frutaId: fp.fruta.id,
          fruta: capitalizeName(fp.fruta.nome || 'Fruta'),
          cultura: capitalizeName(fp.fruta.cultura?.descricao || 'Cultura'),
          areaId: area.id,
          areaNome: capitalizeName(area.nome || 'Área'),
          areaHa: typeof area.quantidadeHa === 'number' ? area.quantidadeHa : null,
          dataColheita,
          quantidade: Number(quantidadeArea) || 0,
          unidade: (pagamento?.unidadeMedida || fp.unidadeMedida1 || 'UN').toString(),
          pagamentoId: temPagamento ? pagamento!.id : null,
          statusCompra: temPagamento ? String(pagamento!.status) : null,
          valorUnitarioCompra: temPagamento ? Number(pagamento!.valorUnitario) : null,
          valorTotalCompra: temPagamento ? Number(pagamento!.valorTotal) : null,
          valorUnitarioVenda: temVenda ? vendaUnit : null,
          valorTotalVendaProporcional: vendaProporcional !== null ? Number(vendaProporcional) : null,
          temVenda,
        });
      });
    });

    if (colheitasBase.length === 0) {
      throw new BadRequestException('Nenhuma colheita encontrada para este fornecedor');
    }

    // 5) Aplicar filtros (opcional)
    const aplicarFiltros = body?.aplicarFiltros === true;
    const termo = (body?.filtroBusca || '').trim().toLowerCase();
    const inicio = body?.dataInicio ? new Date(`${body.dataInicio}T00:00:00`) : null;
    const fim = body?.dataFim ? new Date(`${body.dataFim}T23:59:59`) : null;

    let colheitas = [...colheitasBase];
    if (aplicarFiltros) {
      if (termo) {
        colheitas = colheitas.filter((c) => {
          const pedido = (c.pedido || '').toLowerCase();
          const fruta = (c.fruta || '').toLowerCase();
          const areaNome = (c.areaNome || '').toLowerCase();
          const qtd = String(c.quantidade || 0).toLowerCase();
          return (
            pedido.includes(termo) ||
            fruta.includes(termo) ||
            areaNome.includes(termo) ||
            qtd.includes(termo)
          );
        });
      }

      if (inicio && fim) {
        colheitas = colheitas.filter((c) => {
          if (!c.dataColheita) return false;
          const d = new Date(c.dataColheita);
          return d >= inicio && d <= fim;
        });
      }
    }

    if (colheitas.length === 0) {
      throw new BadRequestException('Nenhuma colheita encontrada com os filtros aplicados');
    }

    // 6) Áreas do cabeçalho (somente as presentes nas colheitas do PDF)
    const areasMap = new Map<number, { id: number; nome: string; ha: number | null }>();
    colheitas.forEach((c) => {
      if (!areasMap.has(c.areaId)) {
        areasMap.set(c.areaId, { id: c.areaId, nome: c.areaNome, ha: c.areaHa ?? null });
      }
    });
    const areasNoPdf = Array.from(areasMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));

    // 7) Semanas para gráfico - REMOVIDO (gráfico não é mais necessário no PDF)
    // const weekBuckets = new Map<string, { label: string; itens: ColheitaPdf[] }>();
    // ... código comentado ...

    // 8) Dados do gráfico - REMOVIDO
    // const graficoSemanal = null;

    // 9) Resumo por cultura/fruta
    type ResumoLinha = {
      cultura: string;
      fruta: string;
      quantidadesPorUnidade: Array<{ unidade: string; quantidade: string }>; // ✅ string (formatado)
      quantidadesPorUnidadePrecificada: Array<{ unidade: string; quantidade: string }>; // ✅ string (formatado)
      quantidadesPorUnidadeNaoPrecificada: Array<{ unidade: string; quantidade: string }>; // ✅ string (formatado)
      totalColheitas: number;
      colheitasPrecificadas: number;
      colheitasNaoPrecificadas: number;
      valorUnitarioMedioCompra: string;
      compraPago: string;
      compraPrecificado: string;
      vendaTotal: string;
      temFaltaVenda: boolean;
      observacaoVenda?: string | null;
    };

    const grupoResumo = new Map<string, any>();
    colheitas.forEach((c) => {
      const key = `${c.cultura}||${c.fruta}`;
      if (!grupoResumo.has(key)) {
        grupoResumo.set(key, {
          cultura: c.cultura,
          fruta: c.fruta,
          qtdPorUnidade: new Map<string, number>(),
          qtdPorUnidadePrecificada: new Map<string, number>(),
          qtdPorUnidadeNaoPrecificada: new Map<string, number>(),
          compraPago: 0,
          compraPrecificado: 0,
          somaVuCompra: 0,
          qtdVuCompra: 0,
          vendaTotal: 0,
          compraComVendaFaltando: 0,
          compraComPagamento: 0,
          compraSemPagamento: 0,
        });
      }
      const g = grupoResumo.get(key);
      g.qtdPorUnidade.set(c.unidade, (g.qtdPorUnidade.get(c.unidade) || 0) + (Number(c.quantidade) || 0));

      // Compra
      if (c.pagamentoId) {
        g.compraComPagamento += 1;
        g.qtdPorUnidadePrecificada.set(c.unidade, (g.qtdPorUnidadePrecificada.get(c.unidade) || 0) + (Number(c.quantidade) || 0));
        if (c.statusCompra === 'PAGO') g.compraPago += Number(c.valorTotalCompra || 0);
        if (c.statusCompra === 'PENDENTE' || c.statusCompra === 'PROCESSANDO') g.compraPrecificado += Number(c.valorTotalCompra || 0);
        if (typeof c.valorUnitarioCompra === 'number' && Number.isFinite(c.valorUnitarioCompra) && c.valorUnitarioCompra > 0) {
          g.somaVuCompra += c.valorUnitarioCompra;
          g.qtdVuCompra += 1;
        }
        // Só conta como "faltando venda" se a compra está precificada mas o pedido/fruta não tem valor de venda
        if (!c.temVenda) g.compraComVendaFaltando += 1;
      } else {
        g.compraSemPagamento += 1;
        g.qtdPorUnidadeNaoPrecificada.set(c.unidade, (g.qtdPorUnidadeNaoPrecificada.get(c.unidade) || 0) + (Number(c.quantidade) || 0));
      }

      // Venda
      if (typeof c.valorTotalVendaProporcional === 'number' && Number.isFinite(c.valorTotalVendaProporcional) && c.valorTotalVendaProporcional > 0) {
        g.vendaTotal += c.valorTotalVendaProporcional;
      }
    });

    const sumQtdMap = (m: Map<string, number>) =>
      Array.from(m.values()).reduce((acc, v) => acc + (Number(v) || 0), 0);

    const resumoLinhas: ResumoLinha[] = Array.from(grupoResumo.values())
      // Ordenar por cultura, e dentro da cultura colocar primeiro quem tem maior "total colhido"
      .sort((a, b) => {
        const byCultura = String(a.cultura || '').localeCompare(String(b.cultura || ''));
        if (byCultura !== 0) return byCultura;

        const totalA = sumQtdMap(a.qtdPorUnidade as Map<string, number>);
        const totalB = sumQtdMap(b.qtdPorUnidade as Map<string, number>);
        if (totalB !== totalA) return totalB - totalA;

        return String(a.fruta || '').localeCompare(String(b.fruta || ''));
      })
      .map((g) => {
        // Aplicar formatação de milhar nas quantidades
        const qtds = Array.from(g.qtdPorUnidade.entries())
          .map(([unidade, quantidade]) => ({ 
            unidade, 
            quantidade: formatNumber(quantidade) // ✅ Formatação de milhar aplicada
          }))
          .sort((a, b) => a.unidade.localeCompare(b.unidade));

        const qtdsPrecificadas = Array.from(g.qtdPorUnidadePrecificada.entries())
          .map(([unidade, quantidade]) => ({ 
            unidade, 
            quantidade: formatNumber(quantidade) // ✅ Formatação de milhar aplicada
          }))
          .sort((a, b) => a.unidade.localeCompare(b.unidade));

        const qtdsNaoPrecificadas = Array.from(g.qtdPorUnidadeNaoPrecificada.entries())
          .map(([unidade, quantidade]) => ({ 
            unidade, 
            quantidade: formatNumber(quantidade) // ✅ Formatação de milhar aplicada
          }))
          .sort((a, b) => a.unidade.localeCompare(b.unidade));

        const vuMedio =
          g.qtdVuCompra > 0 ? g.somaVuCompra / g.qtdVuCompra : null;

        const temFaltaVenda = g.compraComVendaFaltando > 0;
        // Mensagem mais clara: só aparece quando há compra precificada mas venda não precificada
        const obs = temFaltaVenda
          ? `${g.compraComVendaFaltando} colheita(s) precificada(s) para compra, mas o pedido/fruta correspondente ainda não foi precificado para venda ao cliente.`
          : null;

        return {
          cultura: g.cultura,
          fruta: g.fruta,
          quantidadesPorUnidade: qtds,
          quantidadesPorUnidadePrecificada: qtdsPrecificadas,
          quantidadesPorUnidadeNaoPrecificada: qtdsNaoPrecificadas,
          totalColheitas: g.compraComPagamento + g.compraSemPagamento,
          colheitasPrecificadas: g.compraComPagamento,
          colheitasNaoPrecificadas: g.compraSemPagamento,
          valorUnitarioMedioCompra: vuMedio !== null ? formatCurrencyBR(vuMedio) : '-',
          compraPago: formatCurrencyBR(g.compraPago || 0),
          compraPrecificado: formatCurrencyBR(g.compraPrecificado || 0),
          vendaTotal: g.vendaTotal > 0 ? formatCurrencyBR(g.vendaTotal) : '-',
          temFaltaVenda,
          observacaoVenda: obs,
        };
      });

    // 10) Calcular período das colheitas e estatísticas gerais
    const datasColheitas = colheitas
      .map(c => c.dataColheita)
      .filter(d => d !== null && d !== undefined)
      .sort((a, b) => new Date(a!).getTime() - new Date(b!).getTime());

    const periodo = datasColheitas.length > 0 ? {
      dataInicio: formatDateBRSemTimezone(datasColheitas[0]!),
      dataFim: formatDateBRSemTimezone(datasColheitas[datasColheitas.length - 1]!),
    } : null;

    const culturasUnicas = new Set(colheitas.map(c => c.cultura));
    const frutasUnicas = new Set(colheitas.map(c => c.fruta));

    const estatisticasGerais = {
      totalColheitas: colheitas.length,
      totalCulturas: culturasUnicas.size,
      totalFrutas: frutasUnicas.size,
      totalAreas: areasNoPdf.length,
    };


    // 11) Tabelas (precificadas vs não precificadas)
    const precificadas = colheitas.filter((c) => !!c.pagamentoId);
    const naoPrecificadas = colheitas.filter((c) => !c.pagamentoId);

    // Agrupar por Fruta e depois por Área dentro de cada Fruta
    const agruparPorFrutaEArea = (lista: ColheitaPdf[]) => {
      const mapFruta = new Map<string, {
        cultura: string;
        fruta: string;
        areas: Map<string, {
          areaNome: string;
          linhas: any[];
          totaisPorUnidade: Map<string, number>;
        }>;
        totaisPorUnidade: Map<string, number>;
      }>();

      lista.forEach((c) => {
        const kFruta = `${c.cultura}||${c.fruta}`;
        const areaNome = c.areaNome || 'Área não informada';

        if (!mapFruta.has(kFruta)) {
          mapFruta.set(kFruta, {
            cultura: c.cultura,
            fruta: c.fruta,
            areas: new Map(),
            totaisPorUnidade: new Map<string, number>(),
          });
        }

        const grupoFruta = mapFruta.get(kFruta)!;

        // Agrupar por área dentro da fruta
        if (!grupoFruta.areas.has(areaNome)) {
          grupoFruta.areas.set(areaNome, {
            areaNome,
            linhas: [],
            totaisPorUnidade: new Map<string, number>(),
          });
        }

        const grupoArea = grupoFruta.areas.get(areaNome)!;
        grupoArea.linhas.push({
          pedido: c.pedido,
          dataColheitaRaw: c.dataColheita ? new Date(c.dataColheita).getTime() : 0,
          dataColheita: c.dataColheita ? formatDateBRSemTimezone(c.dataColheita) : '-',
          quantidade: formatNumber(c.quantidade || 0),
          unidade: c.unidade,
          valorUnitarioCompra: c.valorUnitarioCompra && c.valorUnitarioCompra > 0 ? formatCurrencyBR(c.valorUnitarioCompra) : '-',
          valorTotalCompra: c.valorTotalCompra && c.valorTotalCompra > 0 ? formatCurrencyBR(c.valorTotalCompra) : '-',
          statusCompra: c.statusCompra || '-',
          valorVenda: c.valorTotalVendaProporcional && c.valorTotalVendaProporcional > 0 ? formatCurrencyBR(c.valorTotalVendaProporcional) : '-',
        });

        // Totais por unidade da área
        grupoArea.totaisPorUnidade.set(c.unidade, (grupoArea.totaisPorUnidade.get(c.unidade) || 0) + (Number(c.quantidade) || 0));
        // Totais por unidade da fruta (geral)
        grupoFruta.totaisPorUnidade.set(c.unidade, (grupoFruta.totaisPorUnidade.get(c.unidade) || 0) + (Number(c.quantidade) || 0));
      });

      return Array.from(mapFruta.values())
        .sort((a, b) => (a.cultura + a.fruta).localeCompare(b.cultura + b.fruta))
        .map((g) => ({
          cultura: g.cultura,
          fruta: g.fruta,
          areas: Array.from(g.areas.values())
            .sort((a, b) => a.areaNome.localeCompare(b.areaNome))
            .map((area) => ({
              areaNome: area.areaNome,
              linhas: area.linhas
                .sort((a, b) => (Number(b.dataColheitaRaw) || 0) - (Number(a.dataColheitaRaw) || 0))
                .map(({ dataColheitaRaw, ...rest }) => rest),
              totaisPorUnidade: Array.from(area.totaisPorUnidade.entries()).map(([unidade, quantidade]) => ({
                unidade,
                quantidade: formatNumber(quantidade),
              })),
            })),
          totaisPorUnidade: Array.from(g.totaisPorUnidade.entries()).map(([unidade, quantidade]) => ({
            unidade,
            quantidade: formatNumber(quantidade),
          })),
        }));
    };

    const gruposPrecificadas = agruparPorFrutaEArea(precificadas);
    const gruposNaoPrecificadas = agruparPorFrutaEArea(naoPrecificadas);

    // 12) Dados empresa + logo
    const dadosEmpresa = await this.configService.findDadosEmpresa();
    const logoBase64 = await this.carregarLogoBase64();

    // 13) Dados para template
    const dadosTemplate = {
      empresa: dadosEmpresa,
      logoPath: logoBase64,
      dataGeracaoFormatada: new Date().toLocaleDateString('pt-BR'),
      tituloDocumento: 'Relatório de Colheitas do Fornecedor',
      fornecedor: {
        id: fornecedor.id,
        nome: capitalizeName(fornecedor.nome || 'Fornecedor'),
      },
      aplicarFiltros,
      filtros: aplicarFiltros
        ? {
            busca: body?.filtroBusca?.trim() || null,
            dataInicio: body?.dataInicio || null,
            dataFim: body?.dataFim || null,
          }
        : null,
      areas: areasNoPdf,
      periodo, // ✅ Período das colheitas
      estatisticasGerais, // ✅ Estatísticas gerais
      // grafico: removido - não é mais necessário no PDF
      resumo: resumoLinhas,
      tabelas: {
        precificadas: gruposPrecificadas,
        naoPrecificadas: gruposNaoPrecificadas,
      },
    };

    // 14) Gerar PDF
    const buffer = await this.pdfService.gerarPdf('fornecedor-colheitas', dadosTemplate);

    // 15) Nome do arquivo
    const nomeFornecedorArquivo = capitalizeNameShort(fornecedor.nome || 'fornecedor');
    const nomeArquivo = this.gerarNomeArquivo({
      tipo: 'fornecedor-colheitas',
      identificador: String(fornecedorIdNum),
      cliente: nomeFornecedorArquivo,
    });

    const contentDisposition = `attachment; filename="${nomeArquivo}"; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition,
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  /**
   * Gera PDF de colheitas pendentes de precificação do fornecedor (mesma estrutura do relatório geral, só pendentes)
   * @template fornecedor-colheitas-pendentes.hbs
   * @endpoint POST /api/pdf/fornecedor-colheitas-pendentes/:fornecedorId
   */
  @Post('fornecedor-colheitas-pendentes/:fornecedorId')
  @ApiOperation({ summary: 'Gerar PDF de colheitas pendentes de precificação do fornecedor' })
  @ApiParam({ name: 'fornecedorId', description: 'ID do fornecedor' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aplicarFiltros: { type: 'boolean' },
        filtroBusca: { type: 'string' },
        dataInicio: { type: 'string' },
        dataFim: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'PDF gerado com sucesso', content: { 'application/pdf': {} } })
  async downloadFornecedorColheitasPendentesPdf(
    @Param('fornecedorId') fornecedorId: string,
    @Body()
    body: {
      aplicarFiltros?: boolean;
      filtroBusca?: string;
      dataInicio?: string;
      dataFim?: string;
    },
    @Res() res: Response,
  ) {
    const fornecedorIdNum = Number(fornecedorId);
    if (!Number.isFinite(fornecedorIdNum)) {
      throw new BadRequestException('fornecedorId inválido');
    }

    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id: fornecedorIdNum },
      select: { id: true, nome: true },
    });
    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    const areas = await this.prisma.areaFornecedor.findMany({
      where: { fornecedorId: fornecedorIdNum },
      select: {
        id: true,
        nome: true,
        quantidadeHa: true,
        frutasPedidosAreas: {
          where: { areaFornecedorId: { not: null } },
          select: {
            id: true,
            quantidadeColhidaUnidade1: true,
            quantidadeColhidaUnidade2: true,
            frutaPedido: {
              select: {
                id: true,
                frutaId: true,
                quantidadePrevista: true,
                quantidadeReal: true,
                quantidadeReal2: true,
                quantidadePrecificada: true,
                unidadeMedida1: true,
                unidadeMedida2: true,
                unidadePrecificada: true,
                valorUnitario: true,
                valorTotal: true,
                fruta: {
                  select: {
                    id: true,
                    nome: true,
                    cultura: { select: { id: true, descricao: true } },
                  },
                },
                pedido: {
                  select: {
                    id: true,
                    numeroPedido: true,
                    dataColheita: true,
                    status: true,
                    cliente: { select: { nome: true } },
                  },
                },
                areas: {
                  select: {
                    id: true,
                    quantidadeColhidaUnidade1: true,
                    quantidadeColhidaUnidade2: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const pagamentos = await this.prisma.fornecedorPagamento.findMany({
      where: { fornecedorId: fornecedorIdNum },
      select: {
        id: true,
        frutaPedidoAreaId: true,
        status: true,
        quantidade: true,
        unidadeMedida: true,
        valorUnitario: true,
        valorTotal: true,
        dataColheita: true,
        dataPagamento: true,
      },
    });
    const pagamentoPorRelacao = new Map<number, (typeof pagamentos)[0]>();
    pagamentos.forEach((p) => {
      pagamentoPorRelacao.set(p.frutaPedidoAreaId, p);
    });

    const formatarNumeroPedido = (numeroPedido: string): string => {
      if (!numeroPedido) return '';
      const partes = numeroPedido.split('-');
      return partes.length > 0 ? partes[partes.length - 1] : numeroPedido;
    };

    type ColheitaPdf = {
      id: number;
      pedidoId: number;
      pedido: string;
      cliente: string;
      frutaPedidoId: number;
      frutaId: number;
      fruta: string;
      cultura: string;
      areaId: number;
      areaNome: string;
      areaHa: number | null;
      dataColheita: Date | null;
      quantidade: number;
      unidade: string;
      pagamentoId: number | null;
      statusCompra: string | null;
      statusPedido: string | null;
      valorUnitarioCompra: number | null;
      valorTotalCompra: number | null;
      valorUnitarioVenda: number | null;
      valorTotalVendaProporcional: number | null;
      temVenda: boolean;
    };

    const colheitasBase: ColheitaPdf[] = [];

    areas.forEach((area) => {
      area.frutasPedidosAreas.forEach((relacao) => {
        const fp = relacao.frutaPedido;
        if (!fp?.pedido || !fp.fruta) return;

        const quantidadeArea =
          relacao.quantidadeColhidaUnidade1 ??
          relacao.quantidadeColhidaUnidade2 ??
          fp.quantidadeReal ??
          fp.quantidadePrecificada ??
          fp.quantidadePrevista ??
          0;

        const somaAreasRelacionadas = (fp.areas || []).reduce((acc, a) => {
          const q = a.quantidadeColhidaUnidade1 ?? a.quantidadeColhidaUnidade2 ?? 0;
          return acc + q;
        }, 0);

        const quantidadeReferencia =
          (fp.quantidadeReal ??
            fp.quantidadePrecificada ??
            fp.quantidadePrevista ??
            somaAreasRelacionadas) || 0;

        const pagamento = pagamentoPorRelacao.get(relacao.id);
        const temPagamento = !!pagamento?.id;

        const vendaTotalFruta = typeof fp.valorTotal === 'number' ? fp.valorTotal : 0;
        const vendaUnit = typeof fp.valorUnitario === 'number' ? fp.valorUnitario : 0;
        const temVenda = vendaTotalFruta > 0 && vendaUnit > 0;
        let vendaProporcional: number | null = null;
        if (temVenda && quantidadeReferencia > 0) {
          vendaProporcional = (vendaTotalFruta * (Number(quantidadeArea) || 0)) / quantidadeReferencia;
        }

        const dataColheita = fp.pedido.dataColheita
          ? new Date(fp.pedido.dataColheita)
          : pagamento?.dataColheita
            ? new Date(pagamento.dataColheita)
            : null;

        colheitasBase.push({
          id: relacao.id,
          pedidoId: fp.pedido.id,
          pedido: formatarNumeroPedido(fp.pedido.numeroPedido),
          cliente: fp.pedido?.cliente?.nome ? capitalizeNameShort(fp.pedido.cliente.nome) : '-',
          frutaPedidoId: fp.id,
          frutaId: fp.fruta.id,
          fruta: capitalizeName(fp.fruta.nome || 'Fruta'),
          cultura: capitalizeName(fp.fruta.cultura?.descricao || 'Cultura'),
          areaId: area.id,
          areaNome: capitalizeName(area.nome || 'Área'),
          areaHa: typeof area.quantidadeHa === 'number' ? area.quantidadeHa : null,
          dataColheita,
          quantidade: Number(quantidadeArea) || 0,
          unidade: (pagamento?.unidadeMedida || fp.unidadeMedida1 || 'UN').toString(),
          pagamentoId: temPagamento ? pagamento!.id : null,
          statusCompra: temPagamento ? String(pagamento!.status) : null,
          statusPedido: fp.pedido?.status ?? null,
          valorUnitarioCompra: temPagamento ? Number(pagamento!.valorUnitario) : null,
          valorTotalCompra: temPagamento ? Number(pagamento!.valorTotal) : null,
          valorUnitarioVenda: temVenda ? vendaUnit : null,
          valorTotalVendaProporcional: vendaProporcional !== null ? Number(vendaProporcional) : null,
          temVenda,
        });
      });
    });

    if (colheitasBase.length === 0) {
      throw new BadRequestException('Nenhuma colheita encontrada para este fornecedor');
    }

    const aplicarFiltros = body?.aplicarFiltros === true;
    const termo = (body?.filtroBusca || '').trim().toLowerCase();
    const inicio = body?.dataInicio ? new Date(`${body.dataInicio}T00:00:00`) : null;
    const fim = body?.dataFim ? new Date(`${body.dataFim}T23:59:59`) : null;

    let colheitas = colheitasBase.filter((c) => !c.pagamentoId);
    if (aplicarFiltros) {
      if (termo) {
        colheitas = colheitas.filter((c) => {
          const pedido = (c.pedido || '').toLowerCase();
          const fruta = (c.fruta || '').toLowerCase();
          const areaNome = (c.areaNome || '').toLowerCase();
          const qtd = String(c.quantidade || 0).toLowerCase();
          return (
            pedido.includes(termo) ||
            fruta.includes(termo) ||
            areaNome.includes(termo) ||
            qtd.includes(termo)
          );
        });
      }
      if (inicio && fim) {
        colheitas = colheitas.filter((c) => {
          if (!c.dataColheita) return false;
          const d = new Date(c.dataColheita);
          return d >= inicio && d <= fim;
        });
      }
    }

    if (colheitas.length === 0) {
      throw new BadRequestException('Nenhuma colheita pendente de precificação com os filtros aplicados');
    }

    const areasMap = new Map<number, { id: number; nome: string; ha: number | null }>();
    colheitas.forEach((c) => {
      if (!areasMap.has(c.areaId)) {
        areasMap.set(c.areaId, { id: c.areaId, nome: c.areaNome, ha: c.areaHa ?? null });
      }
    });
    const areasNoPdf = Array.from(areasMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));

    type ResumoPendenteLinha = {
      cultura: string;
      fruta: string;
      colheitasPendentes: number;
      quantidadesPorUnidade: Array<{ unidade: string; quantidade: string }>;
    };

    const grupoResumo = new Map<string, { cultura: string; fruta: string; count: number; qtdPorUnidade: Map<string, number> }>();
    colheitas.forEach((c) => {
      const key = `${c.cultura}||${c.fruta}`;
      if (!grupoResumo.has(key)) {
        grupoResumo.set(key, {
          cultura: c.cultura,
          fruta: c.fruta,
          count: 0,
          qtdPorUnidade: new Map<string, number>(),
        });
      }
      const g = grupoResumo.get(key)!;
      g.count += 1;
      g.qtdPorUnidade.set(c.unidade, (g.qtdPorUnidade.get(c.unidade) || 0) + (Number(c.quantidade) || 0));
    });

    const resumoLinhas: ResumoPendenteLinha[] = Array.from(grupoResumo.values())
      .sort((a, b) => {
        const byCultura = String(a.cultura || '').localeCompare(String(b.cultura || ''));
        if (byCultura !== 0) return byCultura;
        const totalA = Array.from(a.qtdPorUnidade.values()).reduce((acc, v) => acc + (Number(v) || 0), 0);
        const totalB = Array.from(b.qtdPorUnidade.values()).reduce((acc, v) => acc + (Number(v) || 0), 0);
        if (totalB !== totalA) return totalB - totalA;
        return String(a.fruta || '').localeCompare(String(b.fruta || ''));
      })
      .map((g) => ({
        cultura: g.cultura,
        fruta: g.fruta,
        colheitasPendentes: g.count,
        quantidadesPorUnidade: Array.from(g.qtdPorUnidade.entries())
          .map(([unidade, quantidade]) => ({ unidade, quantidade: formatNumber(quantidade) }))
          .sort((a, b) => a.unidade.localeCompare(b.unidade)),
      }));

    const datasColheitas = colheitas
      .map((c) => c.dataColheita)
      .filter((d): d is Date => d !== null && d !== undefined)
      .sort((a, b) => a.getTime() - b.getTime());
    const periodo =
      datasColheitas.length > 0
        ? {
            dataInicio: formatDateBRSemTimezone(datasColheitas[0]!),
            dataFim: formatDateBRSemTimezone(datasColheitas[datasColheitas.length - 1]!),
          }
        : null;

    const culturasUnicas = new Set(colheitas.map((c) => c.cultura));
    const frutasUnicas = new Set(colheitas.map((c) => c.fruta));
    const estatisticasGerais = {
      totalColheitas: colheitas.length,
      totalCulturas: culturasUnicas.size,
      totalFrutas: frutasUnicas.size,
      totalAreas: areasNoPdf.length,
    };

    const statusPedidoTexts: Record<string, string> = {
      PEDIDO_CRIADO: 'Criado',
      AGUARDANDO_COLHEITA: 'Aguardando Colheita',
      COLHEITA_PARCIAL: 'Colheita Parcial',
      COLHEITA_REALIZADA: 'Colheita Realizada',
      AGUARDANDO_PRECIFICACAO: 'Aguardando Precificação',
      PRECIFICACAO_REALIZADA: 'Precificação Realizada',
      AGUARDANDO_PAGAMENTO: 'Aguardando Pagamento',
      PAGAMENTO_PARCIAL: 'Pagamento Parcial',
      PAGAMENTO_REALIZADO: 'Pagamento Realizado',
      PEDIDO_FINALIZADO: 'Finalizado',
      CANCELADO: 'Cancelado',
    };

    const agruparPorFrutaEArea = (lista: ColheitaPdf[]) => {
      type AreaGrupo = {
        areaNome: string;
        linhas: Array<{
          pedido: string;
          cliente: string;
          dataColheitaRaw?: number;
          dataColheita: string;
          quantidade: string;
          unidade: string;
          valorUnitarioCompra: string;
          statusKey: string;
          statusPedido: string;
        }>;
        totaisPorUnidade: Map<string, number>;
      };
      type FrutaGrupo = {
        cultura: string;
        fruta: string;
        areas: Map<string, AreaGrupo>;
        totaisPorUnidade: Map<string, number>;
      };
      const mapFruta = new Map<string, FrutaGrupo>();

      lista.forEach((c) => {
        const kFruta = `${c.cultura}||${c.fruta}`;
        const areaNome = c.areaNome || 'Área não informada';

        if (!mapFruta.has(kFruta)) {
          mapFruta.set(kFruta, {
            cultura: c.cultura,
            fruta: c.fruta,
            areas: new Map(),
            totaisPorUnidade: new Map<string, number>(),
          });
        }

        const grupoFruta = mapFruta.get(kFruta)!;

        if (!grupoFruta.areas.has(areaNome)) {
          grupoFruta.areas.set(areaNome, {
            areaNome,
            linhas: [],
            totaisPorUnidade: new Map<string, number>(),
          });
        }

        const grupoArea = grupoFruta.areas.get(areaNome)!;
        const statusKey = c.statusPedido || 'DEFAULT';
        grupoArea.linhas.push({
          pedido: c.pedido,
          cliente: c.cliente,
          dataColheitaRaw: c.dataColheita ? new Date(c.dataColheita).getTime() : 0,
          dataColheita: c.dataColheita ? formatDateBRSemTimezone(c.dataColheita) : '-',
          quantidade: formatNumber(c.quantidade || 0),
          unidade: c.unidade,
          valorUnitarioCompra: '',
          statusKey: statusKey in statusPedidoTexts ? statusKey : 'DEFAULT',
          statusPedido: (c.statusPedido && statusPedidoTexts[c.statusPedido]) ? statusPedidoTexts[c.statusPedido] : (c.statusPedido || '-'),
        });
        grupoArea.totaisPorUnidade.set(c.unidade, (grupoArea.totaisPorUnidade.get(c.unidade) || 0) + (Number(c.quantidade) || 0));
        grupoFruta.totaisPorUnidade.set(c.unidade, (grupoFruta.totaisPorUnidade.get(c.unidade) || 0) + (Number(c.quantidade) || 0));
      });

      return Array.from(mapFruta.values())
        .sort((a, b) => (a.cultura + a.fruta).localeCompare(b.cultura + b.fruta))
        .map((g) => ({
          cultura: g.cultura,
          fruta: g.fruta,
          areas: Array.from(g.areas.values())
            .sort((a, b) => a.areaNome.localeCompare(b.areaNome))
            .map((area) => ({
              areaNome: area.areaNome,
              linhas: area.linhas
                .sort((a, b) => (Number(b.dataColheitaRaw) || 0) - (Number(a.dataColheitaRaw) || 0))
                .map(({ dataColheitaRaw, ...rest }) => rest),
              totaisPorUnidade: Array.from(area.totaisPorUnidade.entries()).map(([unidade, quantidade]) => ({
                unidade,
                quantidade: formatNumber(quantidade),
              })),
            })),
          totaisPorUnidade: Array.from(g.totaisPorUnidade.entries()).map(([unidade, quantidade]) => ({
            unidade,
            quantidade: formatNumber(quantidade),
          })),
        }));
    };

    const gruposPendentes = agruparPorFrutaEArea(colheitas);

    const dadosEmpresa = await this.configService.findDadosEmpresa();
    const logoBase64 = await this.carregarLogoBase64();

    const dadosTemplate = {
      empresa: dadosEmpresa,
      logoPath: logoBase64,
      dataGeracaoFormatada: new Date().toLocaleDateString('pt-BR'),
      tituloDocumento: 'Relatório de Colheitas Pendentes de Precificação',
      fornecedor: {
        id: fornecedor.id,
        nome: capitalizeName(fornecedor.nome || 'Fornecedor'),
      },
      aplicarFiltros,
      filtros: aplicarFiltros
        ? {
            busca: body?.filtroBusca?.trim() || null,
            dataInicio: body?.dataInicio || null,
            dataFim: body?.dataFim || null,
          }
        : null,
      areas: areasNoPdf,
      periodo,
      estatisticasGerais,
      resumo: resumoLinhas,
      tabelas: { pendentes: gruposPendentes },
    };

    const buffer = await this.pdfService.gerarPdf('fornecedor-colheitas-pendentes', dadosTemplate);

    const nomeFornecedorArquivo = capitalizeNameShort(fornecedor.nome || 'fornecedor');
    const nomeArquivo = this.gerarNomeArquivo({
      tipo: 'fornecedor-colheitas-pendentes',
      identificador: String(fornecedorIdNum),
      cliente: nomeFornecedorArquivo,
    });

    const contentDisposition = `attachment; filename="${nomeArquivo}"; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition,
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  /**
   * Prepara os dados dos pedidos do cliente para o template Handlebars
   * @template pedidos-cliente.hbs
   * @description Formata dados do cliente, pedidos, frutas e quantidades para renderização no PDF
   * Prioriza quantidadePrecificada/unidadePrecificada, com fallback para quantidadeReal/unidadeMedida1
   */
  private prepararDadosTemplatePedidosCliente(
    cliente: any,
    pedidos: any[],
    dadosEmpresa: any,
    logoBase64: string | null,
  ): any {
    console.log('[PDF] 📋 Preparando dados dos pedidos do cliente:', {
      clienteId: cliente?.id,
      clienteNome: cliente?.nome,
      totalPedidos: pedidos?.length || 0,
    });

    // Formatar dados do cliente
    const clienteFormatado = {
      nome: capitalizeName(cliente.nome || ''),
      razaoSocial: cliente.razaoSocial ? capitalizeName(cliente.razaoSocial) : null,
      cnpj: cliente.cnpj ? formatCNPJ(cliente.cnpj) : null,
      cpf: cliente.cpf ? formatCPF(cliente.cpf) : null,
      telefone1: cliente.telefone1 ? formatTelefone(cliente.telefone1) : null,
      email1: cliente.email1 || null,
      logradouro: cliente.logradouro ? capitalizeName(cliente.logradouro) : null,
      numero: cliente.numero || null,
      complemento: cliente.complemento ? capitalizeName(cliente.complemento) : null,
      bairro: cliente.bairro ? capitalizeName(cliente.bairro) : null,
      cidade: cliente.cidade ? capitalizeName(cliente.cidade) : null,
      estado: cliente.estado || null,
      cep: cliente.cep || null,
    };

    // Formatar número do pedido (extrair última parte)
    const formatarNumeroPedido = (numeroPedido: string): string => {
      if (!numeroPedido) return '';
      const partes = numeroPedido.split('-');
      return partes.length > 0 ? partes[partes.length - 1] : numeroPedido;
    };

    // Ordenar pedidos por data de colheita (mais antigo primeiro)
    // Usa dataColheita se tiver, senão dataPrevistaColheita
    // Pedidos sem nenhuma das duas ficam no final
    const pedidosOrdenados = [...pedidos].sort((a: any, b: any) => {
      // Obter data de referência para cada pedido (dataColheita > dataPrevistaColheita)
      const dataA = a.dataColheita || a.dataPrevistaColheita;
      const dataB = b.dataColheita || b.dataPrevistaColheita;
      
      const temDataA = !!dataA;
      const temDataB = !!dataB;
      
      // Se ambos têm data, ordenar por data (mais antigo primeiro)
      if (temDataA && temDataB) {
        return new Date(dataA).getTime() - new Date(dataB).getTime();
      }
      
      // Se só A tem data, A vem antes
      if (temDataA && !temDataB) return -1;
      
      // Se só B tem data, B vem antes
      if (!temDataA && temDataB) return 1;
      
      // Se nenhum tem data, manter ordem original
      return 0;
    });

    // Normalizar unidade
    const normalizarUnidade = (valor?: string | null) =>
      valor ? valor.toString().trim().toUpperCase() : null;

    // Função auxiliar para calcular cor baseada no prazo (mesma lógica do hook useCoresPorTempo)
    const calcularCorPorDias = (dias: number, prazoCliente: number | null): string => {
      // Se não houver prazo específico do cliente, usar comportamento padrão
      if (!prazoCliente || prazoCliente <= 0) {
        if (dias <= 7) {
          return '#52c41a'; // Verde
        } else if (dias <= 15) {
          return '#faad14'; // Amarelo
        } else if (dias <= 30) {
          return '#fa8c16'; // Laranja
        } else {
          return '#ff4d4f'; // Vermelho
        }
      } else {
        // Calcular faixas proporcionais baseadas no prazo do cliente
        // Proporções do padrão: 7/30 = 0.233, 15/30 = 0.5, 30/30 = 1.0
        const limiteVerde = Math.round(prazoCliente * (7 / 30));
        const limiteAmarelo = Math.round(prazoCliente * (15 / 30));
        const limiteLaranja = prazoCliente; // 100% do prazo

        if (dias <= limiteVerde) {
          return '#52c41a'; // Verde
        } else if (dias <= limiteAmarelo) {
          return '#faad14'; // Amarelo
        } else if (dias <= limiteLaranja) {
          return '#fa8c16'; // Laranja
        } else {
          return '#ff4d4f'; // Vermelho
        }
      }
    };

    // Função auxiliar para calcular dias desde uma data
    const calcularDias = (pedido: any, prazoCliente: number | null): { 
      dias: number | null; 
      texto: string | null; 
      cor: string | null;
      vencido: boolean;
      mostrar: boolean 
    } => {
      // Só calcular para status específicos
      const statusValidos = ['PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL'];
      if (!statusValidos.includes(pedido.status)) {
        return { dias: null, texto: null, cor: null, vencido: false, mostrar: false };
      }

      // Determinar data de referência
      // Prioridade: último pagamento > dataColheita > dataPrevistaColheita
      let dataReferencia: Date | null = null;

      // Se houver pagamentos, usar a data do último pagamento
      if (pedido.pagamentosPedidos && pedido.pagamentosPedidos.length > 0) {
        const pagamentosOrdenados = [...pedido.pagamentosPedidos].sort(
          (a: any, b: any) => new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime()
        );
        dataReferencia = new Date(pagamentosOrdenados[0].dataPagamento);
      } else if (pedido.dataColheita) {
        // Se tiver dataColheita, usar ela
        dataReferencia = new Date(pedido.dataColheita);
      } else if (pedido.dataPrevistaColheita) {
        // Caso contrário, usar dataPrevistaColheita
        dataReferencia = new Date(pedido.dataPrevistaColheita);
      }

      if (!dataReferencia) {
        return { dias: null, texto: null, cor: null, vencido: false, mostrar: false };
      }

      // Calcular diferença em dias (mesma lógica do frontend com moment().diff())
      // O moment().diff() calcula dias completos arredondando para baixo usando a data/hora exata
      // Não normalizar para meia-noite - usar a data/hora exata como o moment faz
      const hoje = new Date();
      const dataRef = new Date(dataReferencia);
      
      // Calcular diferença em milissegundos e converter para dias
      // Math.floor garante que arredonda para baixo (mesma lógica do moment().diff())
      // O moment().diff() com 'days' retorna a diferença em dias completos, arredondando para baixo
      const diferencaMs = hoje.getTime() - dataRef.getTime();
      const dias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

      // Calcular cor baseada no prazo do cliente
      const cor = calcularCorPorDias(dias, prazoCliente);

      // Verificar se está vencido (dias > prazo do cliente)
      const prazoPadrao = prazoCliente && prazoCliente > 0 ? prazoCliente : 30;
      const vencido = dias > prazoPadrao;

      return {
        dias,
        texto: `${dias} dia${dias !== 1 ? 's' : ''}`,
        cor,
        vencido,
        mostrar: true,
      };
    };

    // Obter prazo do cliente (campo 'dias')
    const prazoCliente = cliente.dias && cliente.dias > 0 ? cliente.dias : null;

    // Formatar pedidos
    const pedidosFormatados = pedidosOrdenados.map((pedido: any) => {
      const numeroPedidoFormatado = formatarNumeroPedido(pedido.numeroPedido || '');

      // Calcular dias com cor e status de vencido
      const { dias, texto: diasTexto, cor: diasCor, vencido, mostrar: mostrarDias } = calcularDias(pedido, prazoCliente);

      // Formatar frutas do pedido
      const frutasPedidosFormatadas = (pedido.frutasPedidos || []).map((frutaPedido: any) => {
        // Prioridade: quantidadePrecificada > quantidadeReal
        const unidadePrecificada = normalizarUnidade(frutaPedido.unidadePrecificada);
        const quantidadePrecificada = frutaPedido.quantidadePrecificada;
        const temPrecificacao =
          quantidadePrecificada !== null &&
          quantidadePrecificada !== undefined &&
          Number(quantidadePrecificada) > 0;

        let quantidadeFormatada: string | null = null;
        let unidadeFormatada: string | null = null;

        if (temPrecificacao && unidadePrecificada) {
          // Usar unidadePrecificada e quantidadePrecificada
          quantidadeFormatada = formatNumber(quantidadePrecificada);
          unidadeFormatada = unidadePrecificada;
        } else {
          // Usar unidadeMedida1 e quantidadeReal
          const unidade1 = normalizarUnidade(frutaPedido.unidadeMedida1);
          const quantidadeReal = frutaPedido.quantidadeReal;
          if (unidade1 && quantidadeReal !== null && quantidadeReal !== undefined && Number(quantidadeReal) > 0) {
            quantidadeFormatada = formatNumber(quantidadeReal);
            unidadeFormatada = unidade1;
          }
        }

        return {
          fruta: {
            nome: capitalizeName(frutaPedido.fruta?.nome || ''),
            cultura: frutaPedido.fruta?.cultura
              ? {
                  descricao: capitalizeName(frutaPedido.fruta.cultura.descricao || ''),
                }
              : null,
          },
          quantidadeFormatada,
          unidadeFormatada,
        };
      });

      // Determinar data de colheita para exibição (dataColheita se tiver, senão dataPrevistaColheita)
      const temDataColheita = !!pedido.dataColheita;
      const dataColheitaExibicao = pedido.dataColheita || pedido.dataPrevistaColheita;
      const dataColheitaFormatada = dataColheitaExibicao ? formatDateBR(dataColheitaExibicao) : null;

      // Extrair vales (referenciaExterna) dos pagamentos do pedido
      // Se houver múltiplos vales, concatenar separados por vírgula
      let valesFormatados: string = '-';
      if (pedido.pagamentosPedidos && pedido.pagamentosPedidos.length > 0) {
        const vales = pedido.pagamentosPedidos
          .map((pagamento: any) => pagamento.referenciaExterna)
          .filter((vale: any) => vale && vale.trim() !== '');

        if (vales.length > 0) {
          valesFormatados = vales.join(', ');
        }
      }

      // Calcular valor recebido do pedido
      const valorRecebido = pedido.valorRecebido || 0;
      const valorRecebidoFormatado = valorRecebido > 0 ? formatCurrencyBR(valorRecebido) : null;

      // Verificar se o valor recebido é igual ao valor final (pedido totalmente pago)
      // Arredondar ambos para 2 casas decimais antes de comparar
      const valorFinalArredondado = Number((pedido.valorFinal || 0).toFixed(2));
      const valorRecebidoArredondado = Number(valorRecebido.toFixed(2));
      const valorPagoTotal = valorRecebidoArredondado >= valorFinalArredondado;

      // Status simplificado: Aberto (todos exceto PEDIDO_FINALIZADO) ou Finalizado
      const statusSimplificado = pedido.status === 'PEDIDO_FINALIZADO' ? 'Finalizado' : 'Aberto';

      return {
        id: pedido.id,
        numeroPedido: pedido.numeroPedido,
        numeroPedidoFormatado,
        numeroNf: pedido.numeroNf || null,
        indNumeroNf: pedido.indNumeroNf || null,
        dataPedido: pedido.dataPedido,
        dataPedidoFormatada: formatDateBR(pedido.dataPedido),
        dataColheita: pedido.dataColheita,
        dataColheitaFormatada,
        dataPrevistaColheita: pedido.dataPrevistaColheita,
        dataPrevistaColheitaFormatada: pedido.dataPrevistaColheita ? formatDateBR(pedido.dataPrevistaColheita) : null,
        usaDataPrevista: !temDataColheita && !!pedido.dataPrevistaColheita, // Flag para indicar que está usando data prevista
        valorFinal: pedido.valorFinal || 0,
        valorFinalFormatado: pedido.valorFinal && pedido.valorFinal > 0 ? formatCurrencyBR(pedido.valorFinal) : null,
        valorRecebido,
        valorRecebidoFormatado,
        valorPagoTotal, // Indica se o valor recebido é >= valor final
        statusSimplificado,
        clienteIndustria: cliente.industria || false,
        frutasPedidos: frutasPedidosFormatadas,
        dias: mostrarDias ? dias : null,
        diasTexto: mostrarDias ? diasTexto : null,
        diasCor: mostrarDias ? diasCor : null,
        diasVencido: mostrarDias ? vencido : false,
        mostrarDias,
        valesFormatados, // Campo Vale para exibição no PDF
      };
    });

    // Calcular total (usar pedidos originais, não ordenados)
    const valorTotal = pedidos.reduce((total, pedido) => total + (pedido.valorFinal || 0), 0);
    const valorRecebidoTotal = pedidos.reduce((total, pedido) => total + (pedido.valorRecebido || 0), 0);
    const valorTotalFormatado = formatCurrencyBR(valorTotal);
    const valorRecebidoTotalFormatado = formatCurrencyBR(valorRecebidoTotal);

    return {
      cliente: {
        ...clienteFormatado,
        industria: cliente.industria || false,
      },
      pedidos: pedidosFormatados,
      valorTotalFormatado,
      valorRecebidoTotalFormatado,
      empresa: dadosEmpresa,
      logoPath: logoBase64,
      dataGeracaoFormatada: formatDateBR(new Date()),
      anoAtual: new Date().getFullYear(),
      titulo: 'Pedidos do Cliente',
      subtitulo: clienteFormatado.nome,
    };
  }

  /**
   * Gera PDF de recibo individual de funcionário
   * @template recibo-funcionario.hbs
   * @description Gera PDF de recibo de pagamento individual para um funcionário, suportando 3 cenários: PIX próprio, PIX terceiro e pagamento em espécie
   * @endpoint GET /api/pdf/recibo-funcionario/:lancamentoId
   * @usage LancamentosTable.js - botão PDF quando statusPagamento === PAGO
   */
  @Get('recibo-funcionario/:lancamentoId')
  @ApiOperation({ summary: 'Gerar PDF de recibo individual de funcionário' })
  @ApiParam({ name: 'lancamentoId', description: 'ID do lançamento (FuncionarioPagamento)' })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: {
      'application/pdf': {},
    },
  })
  @ApiResponse({ status: 404, description: 'Lançamento não encontrado' })
  @ApiResponse({ status: 400, description: 'Lançamento não está pago' })
  async downloadReciboFuncionarioPdf(
    @Param('lancamentoId') lancamentoId: string,
    @Res() res: Response,
  ) {
    console.log('[PDF Controller] Iniciando geração de recibo para lançamento ID:', lancamentoId);

    // 1. Buscar lançamento completo com relacionamentos
    const lancamentoCompleto = await this.prisma.funcionarioPagamento.findUnique({
      where: { id: +lancamentoId },
      include: {
        funcionario: {
          select: {
            nome: true,
            apelido: true,
            cpf: true,
            chavePix: true,
            tipoContrato: true,
            logradouro: true,
            numero: true,
            complemento: true,
            bairro: true,
            cidade: true,
            estado: true,
            cep: true,
          },
        },
        cargo: {
          select: {
            id: true,
            nome: true,
          },
        },
        funcao: {
          select: {
            id: true,
            nome: true,
          },
        },
        folha: {
          select: {
            id: true,
            competenciaMes: true,
            competenciaAno: true,
            periodo: true,
          },
        },
        pagamentoApiItem: {
          select: {
            id: true,
            chavePixEnviada: true,
            responsavelChavePixEnviado: true,
          },
        },
      },
    });

    if (!lancamentoCompleto) {
      throw new NotFoundException('Lançamento não encontrado.');
    }

    // Verificar se está pago
    if (lancamentoCompleto.statusPagamento !== 'PAGO' && !lancamentoCompleto.pagamentoEfetuado) {
      throw new BadRequestException('Apenas lançamentos com status PAGO podem gerar recibo.');
    }

    // 2. Buscar dados da empresa
    const dadosEmpresa = await this.configService.findDadosEmpresa();

    // 3. Carregar logo em base64
    const logoBase64 = await this.carregarLogoBase64();

    // 4. Preparar dados para o template
    let dadosTemplate;
    try {
      dadosTemplate = this.prepararDadosTemplateRecibo(lancamentoCompleto, dadosEmpresa, logoBase64);
    } catch (error) {
      console.error('[PDF Controller] ❌ ERRO ao executar prepararDadosTemplateRecibo:', error);
      throw error;
    }

    // 5. Gerar o PDF
    const buffer = await this.pdfService.gerarPdf('recibo-funcionario', dadosTemplate);

    // 6. Formatar nome do arquivo: recibo-NomeFuncionario-12-2025.pdf
    const nomeFuncionario = capitalizeName(lancamentoCompleto.funcionario?.nome || 'funcionario');
    const competenciaLabel = `${String(lancamentoCompleto.folha.competenciaMes).padStart(2, '0')}-${lancamentoCompleto.folha.competenciaAno}`;
    const nomeArquivo = this.gerarNomeArquivo({
      tipo: 'recibo',
      identificador: `${nomeFuncionario}-${competenciaLabel}`,
    });
    console.log('[PDF Controller] Nome do arquivo final:', nomeArquivo);

    // 7. Configurar Headers para download
    const contentDisposition = `attachment; filename="${nomeArquivo}"; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition,
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Length': buffer.length.toString(),
    });

    console.log('[PDF Controller] Recibo enviado com sucesso!');

    // 8. Enviar o stream
    res.end(buffer);
  }

  /**
   * Prepara os dados do recibo de funcionário para o template Handlebars
   * @template recibo-funcionario.hbs
   * @description Formata dados do funcionário, determina cenário (PIX próprio, PIX terceiro, ESPECIE) e prepara dados bancários
   */
  private prepararDadosTemplateRecibo(
    lancamento: any,
    dadosEmpresa: any,
    logoBase64: string | null,
  ): any {
    const funcionario = lancamento.funcionario;
    const folha = lancamento.folha;
    
    // Formatar CPF do funcionário
    const cpfFormatado = funcionario?.cpf ? formatCPF(funcionario.cpf) : '';
    
    // Determinar cargo/função para descrição do serviço
    const cargoNome = lancamento.cargo?.nome || lancamento.referenciaNomeCargo;
    const funcaoNome = lancamento.funcao?.nome || lancamento.referenciaNomeFuncao;
    const descricaoServico = cargoNome || funcaoNome || 'Atividade Agrícola';
    
    // Formatar endereço do funcionário (se disponível)
    let enderecoCompleto = '';
    if (funcionario) {
      const partesEndereco: string[] = [];
      if (funcionario.logradouro) partesEndereco.push(funcionario.logradouro);
      if (funcionario.numero) partesEndereco.push(funcionario.numero);
      if (funcionario.complemento) partesEndereco.push(funcionario.complemento);
      if (funcionario.bairro) partesEndereco.push(funcionario.bairro);
      if (funcionario.cidade) partesEndereco.push(funcionario.cidade);
      if (funcionario.estado) partesEndereco.push(funcionario.estado);
      enderecoCompleto = partesEndereco.join(', ');
    }
    
    // Formatar competência
    const meses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const competenciaTexto = `${meses[folha.competenciaMes - 1]} de ${folha.competenciaAno}`;
    
    // Formatar data de pagamento
    const dataPagamentoFormatada = lancamento.dataPagamento 
      ? formatDateBR(lancamento.dataPagamento)
      : formatDateBR(new Date());
    
    // Converter valor para extenso
    // Prisma Decimal precisa ser convertido para número
    const valorLiquido = lancamento.valorLiquido 
      ? (typeof lancamento.valorLiquido === 'object' && 'toNumber' in lancamento.valorLiquido
          ? lancamento.valorLiquido.toNumber()
          : Number(lancamento.valorLiquido))
      : 0;
    console.log('[PDF Controller] Valor líquido para extenso:', valorLiquido, 'tipo:', typeof valorLiquido);
    const valorPorExtenso = numeroParaExtenso(valorLiquido);
    
    // Determinar cenário e preparar dados
    const pixTerceiro = lancamento.pixTerceiro === true;
    const meioPagamento = lancamento.meioPagamento;
    const isEspecie = meioPagamento === 'ESPECIE';
    const isPix = meioPagamento === 'PIX' || meioPagamento === 'PIX_API';
    
    // Preparar dados bancários (quando PIX)
    let dadosBancarios: any = null;
    if (isPix) {
      if (pixTerceiro) {
        // PIX Terceiro: usar dados do terceiro
        const chavePix = lancamento.chavePixEnviada || lancamento.pagamentoApiItem?.chavePixEnviada || '';
        const beneficiario = lancamento.responsavelChavePixEnviado || lancamento.pagamentoApiItem?.responsavelChavePixEnviado || '';
        dadosBancarios = {
          chave_pix: chavePix,
          beneficiario: beneficiario,
        };
      } else {
        // PIX Próprio: usar dados do funcionário
        const chavePix = funcionario?.chavePix || '';
        const beneficiario = funcionario?.nome || '';
        dadosBancarios = {
          chave_pix: chavePix,
          beneficiario: beneficiario,
        };
      }
    }
    
    // Preparar dados do terceiro (apenas quando pixTerceiro == true)
    let dadosTerceiro: any = null;
    if (pixTerceiro) {
      const nomeTerceiro = lancamento.responsavelChavePixEnviado || lancamento.pagamentoApiItem?.responsavelChavePixEnviado || '';
      dadosTerceiro = {
        nome: nomeTerceiro,
        cpf: null, // CPF do terceiro não está disponível no lançamento
        cpf_formatado: null,
      };
    }
    
    // Validar dados da empresa
    if (!dadosEmpresa) {
      throw new Error('Dados da empresa não encontrados. Configure os dados da empresa no sistema.');
    }
    
    // Formatar endereço da empresa (conforme schema: logradouro, bairro, cidade, estado, cep)
    const partesEnderecoEmpresa: string[] = [];
    if (dadosEmpresa.logradouro) partesEnderecoEmpresa.push(dadosEmpresa.logradouro);
    if (dadosEmpresa.bairro) partesEnderecoEmpresa.push(dadosEmpresa.bairro);
    if (dadosEmpresa.cidade) partesEnderecoEmpresa.push(dadosEmpresa.cidade);
    if (dadosEmpresa.estado) partesEnderecoEmpresa.push(dadosEmpresa.estado);
    if (dadosEmpresa.cep) partesEnderecoEmpresa.push(`CEP ${dadosEmpresa.cep}`);
    const enderecoEmpresaCompleto = partesEnderecoEmpresa.join(', ');
    
    // Formatar CNPJ da empresa antes de criar os recibos
    const cnpjFormatado = dadosEmpresa.cnpj ? formatCNPJ(dadosEmpresa.cnpj) : '';
    
    // Preparar dados da empresa para o template
    const dadosEmpresaTemplate = {
      razao_social: dadosEmpresa.razao_social || '',
      nome_fantasia: dadosEmpresa.nome_fantasia || '',
      cnpj: cnpjFormatado,
      proprietario: dadosEmpresa.proprietario || null,
      telefone: dadosEmpresa.telefone || '',
      logradouro: dadosEmpresa.logradouro || '',
      bairro: dadosEmpresa.bairro || '',
      cidade: dadosEmpresa.cidade || '',
      estado: dadosEmpresa.estado || '',
      cep: dadosEmpresa.cep || '',
      endereco_completo: enderecoEmpresaCompleto,
    };
    
    // Estrutura para suportar múltiplos recibos (futuro)
    // Por enquanto, array com um único recibo
    const recibos = [{
      funcionario: {
        nome_completo: capitalizeName(funcionario?.nome || ''),
        cpf_formatado: cpfFormatado,
        endereco_completo: enderecoCompleto,
        cargo_funcao: descricaoServico,
      },
      competenciaTexto,
      descricao_servico: descricaoServico,
      pixTerceiro,
      meioPagamento,
      dados_bancarios: dadosBancarios,
      terceiro: dadosTerceiro,
      valor_por_extenso: valorPorExtenso,
      data_pagamento_formatada: dataPagamentoFormatada,
      // Incluir empresa dentro de cada recibo para facilitar acesso no template
      empresa: dadosEmpresaTemplate,
    }];
    
    // Log dos dados da empresa para debug
    console.log('[PDF Controller] Dados da empresa para template:', dadosEmpresaTemplate);
    
    return {
      recibos,
      empresa: dadosEmpresaTemplate, // Também no nível raiz para compatibilidade
      logoPath: logoBase64,
      dataGeracaoFormatada: formatDateBR(new Date()),
    };
  }

  /**
   * Prepara os dados para o template de boleto com QR Code PIX
   */
  private async prepararDadosTemplateBoleto(boleto: any, logoBase64: string | null): Promise<any> {
    console.log('[PDF Boleto] 📋 Preparando dados do boleto:', {
      id: boleto.id,
      nossoNumero: boleto.nossoNumero,
      codigoBarras: boleto.codigoBarras ? `${boleto.codigoBarras.substring(0, 10)}...` : 'NÃO ENCONTRADO',
      codigoBarrasLength: boleto.codigoBarras?.length || 0,
    });

    try {
      // Carregar dados da empresa
      const empresa = await this.configService.findDadosEmpresa();

      const logoPath = logoBase64 ? logoBase64 : null;

      // Preparar dados do boleto
      const dadosBoleto = {
        nossoNumero: boleto.nossoNumero,
        numeroDocumento: boleto.numeroTituloBeneficiario,
        carteira: boleto.convenioCobranca.carteira,
        especie: 'R$',
        quantidade: 1,
        valor: boleto.valorOriginal,
        dataVencimento: boleto.dataVencimento,
        dataDocumento: boleto.dataEmissao,
        dataProcessamento: boleto.dataEmissao, // Data de processamento = data de emissão
        localPagamento: 'Pagável em qualquer banco até o vencimento',
        juros: boleto.convenioCobranca.juros,
        multaAtiva: boleto.convenioCobranca.multaAtiva,
        valorMulta: boleto.convenioCobranca.valorMulta,
      };

      // Formatar CPF/CNPJ do pagador
      let cpfCnpjFormatado: string | null = null;
      let tipoDocumento: 'CPF' | 'CNPJ' | null = null;
      if (boleto.pagadorNumeroInscricao) {
        const numeroLimpo = boleto.pagadorNumeroInscricao.replace(/\D/g, '');
        if (numeroLimpo.length === 11) {
          cpfCnpjFormatado = formatCPF(boleto.pagadorNumeroInscricao);
          tipoDocumento = 'CPF';
        } else if (numeroLimpo.length === 14) {
          cpfCnpjFormatado = formatCNPJ(boleto.pagadorNumeroInscricao);
          tipoDocumento = 'CNPJ';
        } else {
          cpfCnpjFormatado = boleto.pagadorNumeroInscricao;
        }
      }

      // Preparar dados do pagador
      const pagador = {
        nome: boleto.pagadorNome,
        cpfCnpj: cpfCnpjFormatado,
        tipoDocumento: tipoDocumento,
        endereco: boleto.pagadorEndereco,
        bairro: boleto.pagadorBairro,
        cidade: boleto.pagadorCidade,
        uf: boleto.pagadorUf,
        cep: boleto.pagadorCep,
      };

      // Gerar QR Code PIX como imagem base64
      let qrCodePixBase64: string | null = null;
      if (boleto.urlPix) {
        try {
          qrCodePixBase64 = await QRCode.toDataURL(boleto.urlPix, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 1,
          });
        } catch (error) {
          console.error('[PDF Boleto] Erro ao gerar QR Code PIX:', error);
          qrCodePixBase64 = null;
        }
      }

      // Gerar código de barras como imagem base64
      let barcodeBase64: string | null = null;
      const codigoBarras = boleto.codigoBarras;
      if (codigoBarras) {
        try {
          // 1. Configura o DOM Virtual
          const xmlSerializer = new XMLSerializer();
          const document = new DOMImplementation().createDocument(
            'http://www.w3.org/1999/xhtml',
            'html',
            null,
          );
          const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

          // 2. Gera o Barcode (formato ITF para boletos)
          JSBarcode(svgNode, codigoBarras, {
            xmlDocument: document,
            format: 'ITF',
            height: 50,
            width: 1,
            displayValue: false,
            margin: 0,
          });

          // 3. Converte para Base64
          const svgText = xmlSerializer.serializeToString(svgNode);
          barcodeBase64 = svg64(svgText);

          console.log('[PDF Boleto] ✅ Código de barras gerado:', {
            possui: !!codigoBarras,
            tamanho: codigoBarras.length,
            preview: `${codigoBarras.substring(0, 10)}...${codigoBarras.substring(codigoBarras.length - 4)}`,
          });
        } catch (error) {
          console.error('[PDF Boleto] Erro ao gerar código de barras:', error);
          barcodeBase64 = null;
        }
      }

      // Formatar CNPJ da empresa
      const empresaFormatada = empresa ? {
        ...empresa,
        cnpjFormatado: empresa.cnpj ? formatCNPJ(empresa.cnpj) : null,
      } : null;

      return {
        empresa: empresaFormatada,
        conta: {
          agencia: boleto.contaCorrente.agencia,
          codigoBeneficiario: boleto.convenioCobranca.convenio, // Usar o número do convênio como código beneficiário
          carteira: boleto.convenioCobranca.carteira,
        },
        convenio: {
          numero: boleto.convenioCobranca.convenio,
        },
        dadosBoleto: dadosBoleto,
        linhaDigitavel: boleto.linhaDigitavel,
        barcodeBase64: barcodeBase64,
        pagador: pagador,
        qrCodePix: boleto.urlPix || null,
        qrCodePixBase64: qrCodePixBase64,
        valor: boleto.valorOriginal, // Valor no nível raiz para o helper
        valorCobrado: boleto.valorOriginal, // Valor cobrado = valor original (juros/multa só aplicam quando vencido)
        desconto: 0, // Desconto sempre 0,00 no momento da geração
        jurosMulta: 0, // Juros/Multa sempre 0,00 no momento da geração (BB calcula apenas quando vencido e pago)
        dataVencimento: boleto.dataVencimento, // Data no nível raiz para o helper
        dataGeracao: formatDateBR(new Date()),
        logoPath: logoPath,
      };
    } catch (error) {
      console.error('[PDF Service] ❌ ERRO ao executar prepararDadosTemplateBoleto:', error);
      throw error;
    }
  }

  /**
   * Gera PDF de boleto com QR Code PIX
   */
  @Get('boleto/:id')
  @ApiOperation({ summary: 'Gerar PDF do boleto' })
  @ApiParam({ name: 'id', description: 'ID do boleto' })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: {
      'application/pdf': {},
    },
  })
  @ApiResponse({ status: 404, description: 'Boleto não encontrado' })
  async downloadBoletoPdf(
  @Param('id') id: string,
  @Res() res: Response,
  @Req() request?: any,
) {
  console.log('[PDF Boleto] Iniciando geração de PDF para boleto ID:', id);

  try {
      // Buscar boleto completo com relacionamentos
      const boleto = await this.prisma.boleto.findUnique({
        where: { id: parseInt(id) },
        include: {
          contaCorrente: {
            select: {
              agencia: true,
            }
          },
          convenioCobranca: {
            select: {
              convenio: true,
              carteira: true,
              juros: true,
              multaAtiva: true,
              valorMulta: true,
            }
          },
          usuarioCriacao: true,
        }
      });

    if (!boleto) {
      throw new NotFoundException('Boleto não encontrado');
    }

    console.log('[PDF Boleto] Boleto encontrado:', {
      id: boleto.id,
      nossoNumero: boleto.nossoNumero,
      codigoBarras: boleto.codigoBarras ? 'Presente' : 'Ausente',
    });

    // Carregar logo em base64
    const logoBase64 = await this.carregarLogoBase64();

    // Preparar dados para o template
    const dadosTemplate = await this.prepararDadosTemplateBoleto(boleto, logoBase64);

    // Gerar o PDF
    const buffer = await this.pdfService.gerarPdf('boleto', dadosTemplate);

    // Formatar nome do arquivo
    const nomeArquivo = `boleto-${boleto.id}-${boleto.nossoNumero}.pdf`;

    console.log('[PDF Boleto] PDF gerado com sucesso:', nomeArquivo);

    // Enviar como download
    const contentDisposition = `attachment; filename="${nomeArquivo}"; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition,
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Length': buffer.length.toString(),
    });

    res.send(buffer);
  } catch (error) {
    console.error('[PDF Controller] Erro ao gerar PDF do boleto:', error);
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw new InternalServerErrorException('Erro ao gerar PDF do boleto');
  }
}
}

