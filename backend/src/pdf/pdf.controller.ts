import { Controller, Get, Param, Res, UseGuards, Req, Query, Body, Post, NotFoundException, BadRequestException } from '@nestjs/common';
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
    private readonly folhaPagamentoService: FolhaPagamentoService,
    private readonly contaCorrenteService: ContaCorrenteService,
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
    const dataInicialFormatada = formatDateBR(folha.dataInicial);
    const dataFinalFormatada = formatDateBR(folha.dataFinal);
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
      
      // Formatar datas
      const dataInicialFormatada = formatDateBR(folha.dataInicial);
      const dataFinalFormatada = formatDateBR(folha.dataFinal);
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
      const descontosExtrasFormatado = lancamento.descontosExtras
        ? formatCurrencyBR(Number(lancamento.descontosExtras))
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

      return {
        itemNumero: index + 1,
        funcionario: {
          nome: capitalizeName(funcionario?.nome || ''),
          cpf: funcionario?.cpf ? formatCPF(funcionario.cpf) : null,
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
        descontosExtrasFormatado,
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
        totalDescontos: 0,
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
    const totalDescontos = lancamentos.reduce((sum, l) => sum + Number(l.descontosExtras || 0), 0);
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
      totalDescontos,
      totalAdiantamento,
      quantidadeFuncionarios,
      quantidadeComValores,
      quantidadePendentes,
      quantidadePagos,
      // Formatados
      totalHorasExtrasFormatado: `${formatNumber(totalHorasExtras)}h`,
      totalValorHorasExtrasFormatado: formatCurrencyBR(totalValorHorasExtras),
      totalAjudaCustoFormatado: formatCurrencyBR(totalAjudaCusto),
      totalDescontosFormatado: formatCurrencyBR(totalDescontos),
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

    // Normalizar unidade
    const normalizarUnidade = (valor?: string | null) =>
      valor ? valor.toString().trim().toUpperCase() : null;

    // Formatar pedidos
    const pedidosFormatados = pedidos.map((pedido: any) => {
      const numeroPedidoFormatado = formatarNumeroPedido(pedido.numeroPedido || '');

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

      return {
        id: pedido.id,
        numeroPedido: pedido.numeroPedido,
        numeroPedidoFormatado,
        numeroNf: pedido.numeroNf || null,
        indNumeroNf: pedido.indNumeroNf || null,
        dataPedido: pedido.dataPedido,
        dataPedidoFormatada: formatDateBR(pedido.dataPedido),
        dataColheita: pedido.dataColheita,
        dataColheitaFormatada: pedido.dataColheita ? formatDateBR(pedido.dataColheita) : null,
        valorFinal: pedido.valorFinal || 0,
        valorFinalFormatado: pedido.valorFinal && pedido.valorFinal > 0 ? formatCurrencyBR(pedido.valorFinal) : null,
        clienteIndustria: cliente.industria || false,
        frutasPedidos: frutasPedidosFormatadas,
      };
    });

    // Calcular total
    const valorTotal = pedidos.reduce((total, pedido) => total + (pedido.valorFinal || 0), 0);
    const valorTotalFormatado = formatCurrencyBR(valorTotal);

    return {
      cliente: {
        ...clienteFormatado,
        industria: cliente.industria || false,
      },
      pedidos: pedidosFormatados,
      valorTotalFormatado,
      empresa: dadosEmpresa,
      logoPath: logoBase64,
      dataGeracaoFormatada: formatDateBR(new Date()),
      anoAtual: new Date().getFullYear(),
      titulo: 'Pedidos do Cliente',
      subtitulo: clienteFormatado.nome,
    };
  }
}

