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
}

