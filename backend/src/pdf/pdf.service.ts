import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as hbs from 'handlebars';
import * as path from 'path';
import { execSync } from 'child_process';
import { formatCurrency, formatDateBR, formatarLinhaDigitavel } from '../utils/formatters';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly templatesPath = path.join(process.cwd(), 'src', 'pdf', 'templates');
  private readonly partialsPath = path.join(this.templatesPath, 'partials');
  private partialsRegistered = false;
  private chromeInstallAttempted = false; // Evitar múltiplas tentativas de instalação

  /**
   * Registra os partials e helpers do Handlebars
   * Sempre recarrega para evitar cache e garantir que mudanças sejam aplicadas
   */
  private async registrarPartials() {
    try {
      const headerPath = path.join(this.partialsPath, 'header.hbs');
      const footerPath = path.join(this.partialsPath, 'footer.hbs');

      const headerTemplate = await fs.readFile(headerPath, 'utf-8');
      const footerTemplate = await fs.readFile(footerPath, 'utf-8');

      // Sempre re-registra os partials (sem cache) para garantir que mudanças sejam aplicadas
      hbs.unregisterPartial('header');
      hbs.unregisterPartial('footer');
      hbs.registerPartial('header', headerTemplate);
      hbs.registerPartial('footer', footerTemplate);

      // Registrar helper para comparação de igualdade
      hbs.registerHelper('eq', function(a: any, b: any) {
        return a === b;
      });

      // Registrar helper para serializar JSON
      hbs.registerHelper('json', function(context: any) {
        return JSON.stringify(context);
      });

      // Registrar helper para somar números
      hbs.registerHelper('add', function(a: any, b: any) {
        return Number(a) + Number(b);
      });

      // Registrar helper para formatar moeda
      hbs.registerHelper('formatarMoeda', function(value: any) {
        if (value === null || value === undefined) return '0,00';
        const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        return formatCurrency(numValue);
      });

      // Registrar helper para formatar data
      hbs.registerHelper('formatarData', function(date: any) {
        if (!date) return 'Data inválida';
        return formatDateBR(date);
      });

      // Registrar helper para formatar linha digitável
      hbs.registerHelper('formatarLinhaDigitavel', function(linhaDigitavel: any) {
        if (!linhaDigitavel) return '';
        return formatarLinhaDigitavel(linhaDigitavel);
      });

      this.partialsRegistered = true;
      this.logger.debug('Partials e helpers do Handlebars recarregados (sem cache)');
    } catch (error: any) {
      this.logger.warn(`Erro ao registrar partials: ${error.message}. Continuando sem partials.`);
    }
  }

  /**
   * Gera um PDF a partir de um template Handlebars
   * @param templateName Nome do template sem extensão (ex: 'pedido-criado')
   * @param data Dados a serem injetados no template
   * @returns Buffer do PDF gerado
   */
  async gerarPdf(templateName: string, data: any): Promise<Buffer> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      // #region agent log
      const agentLog = (payload: any) => {
        try {
          // Preferência: POST para o ingest server
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          fetch('http://127.0.0.1:7242/ingest/ca500332-3460-463e-ab4a-2b4ce91f4bf5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(() => {});
        } catch {}

        // Fallback: grava em arquivo local (para garantir evidência no ambiente)
        try {
          const logDir = path.join(process.cwd(), '.cursor');
          const logFile = path.join(logDir, 'debug.log');
          if (!fsSync.existsSync(logDir)) fsSync.mkdirSync(logDir, { recursive: true });
          fsSync.appendFileSync(logFile, `${JSON.stringify(payload)}\n`);
        } catch {}

        // Espelho em arquivo "não protegido" (facilita limpar entre runs)
        try {
          const tmpDir = path.join(process.cwd(), 'tmp');
          const tmpFile = path.join(tmpDir, 'pdf-pagination.ndjson');
          if (!fsSync.existsSync(tmpDir)) fsSync.mkdirSync(tmpDir, { recursive: true });
          fsSync.appendFileSync(tmpFile, `${JSON.stringify(payload)}\n`);
        } catch {}
      };
      // #endregion agent log

      // #region agent log
      agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H0',location:'pdf.service.ts:gerarPdf:entry',message:'Entrou em gerarPdf',data:{templateName,hasEmpresa:!!data?.empresa,keysTop:Object.keys(data||{}).slice(0,20)},timestamp:Date.now()});
      // #endregion agent log

      // 0. Extrair dados da empresa para o footer do Puppeteer
      const empresa = data.empresa || {};
      const razaoSocial = empresa.razao_social || empresa.nome_fantasia || 'Alencar Frutas';
      const cnpj = empresa.cnpj || '';
      const dataGeracao = data.dataGeracaoFormatada || new Date().toLocaleDateString('pt-BR');

      // 1. Registrar partials (cabeçalho e rodapé reutilizáveis)
      await this.registrarPartials();

      // 2. Compilar o Template HTML
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      
      this.logger.debug(`Carregando template: ${templatePath}`);
      const htmlTemplate = await fs.readFile(templatePath, 'utf-8');
      
      // Compilar template Handlebars
      const compiledTemplate = hbs.compile(htmlTemplate);
      
      // Injeta os dados no HTML
      const htmlContent = compiledTemplate(data);

      // #region agent log
      agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'pdf.service.ts:gerarPdf:html',message:'HTML compilado',data:{templateName,htmlLen:htmlContent?.length||0,hasResumo:htmlContent?.includes('Resumo Estatístico por Cultura e Fruta')||false,hasPrecificadasTitle:htmlContent?.includes('Colheitas Precificadas')||false,hasNaoPrecificadasTitle:htmlContent?.includes('Colheitas Não Precificadas')||false},timestamp:Date.now()});
      // #endregion agent log

      // 2. Iniciar o Browser (Puppeteer) - Configuração para desenvolvimento e produção
      this.logger.debug('Iniciando Puppeteer...');
      
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--font-render-hinting=none', // Melhor suporte a fontes customizadas
        ],
        timeout: 30000,
      };

      // Se PUPPETEER_EXECUTABLE_PATH estiver definido (útil para produção/Render)
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        this.logger.debug(`Usando Chrome executável customizado: ${launchOptions.executablePath}`);
      }

      try {
        browser = await puppeteer.launch(launchOptions);
      } catch (chromeError: any) {
        // Se falhar e for erro de Chrome não encontrado, tentar instalar automaticamente (apenas uma vez)
        if ((chromeError.message?.includes('Could not find Chrome') || chromeError.message?.includes('chrome')) && !this.chromeInstallAttempted) {
          this.chromeInstallAttempted = true;
          this.logger.warn('Chrome não encontrado. Tentando instalar automaticamente (isso pode levar alguns minutos na primeira vez)...');
          
          try {
            // Tentar instalar Chrome automaticamente
            execSync('npx puppeteer browsers install chrome', {
              stdio: 'inherit', // Mostrar progresso da instalação
              timeout: 300000, // 5 minutos de timeout (instalação pode ser lenta)
              env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: 'false' }
            });
            
            this.logger.log('✅ Chrome instalado com sucesso. Tentando iniciar novamente...');
            
            // Tentar novamente após instalação
            browser = await puppeteer.launch(launchOptions);
            this.logger.log('✅ Puppeteer iniciado com sucesso após instalação do Chrome');
          } catch (installError: any) {
            this.logger.error(`❌ Falha ao instalar Chrome automaticamente: ${installError.message}`);
            throw new Error(
              'Chrome não encontrado e não foi possível instalar automaticamente. Verifique os logs do servidor para mais detalhes.'
            );
          }
        } else if (chromeError.message?.includes('Could not find Chrome') || chromeError.message?.includes('chrome')) {
          // Se já tentou instalar e ainda falhou, dar erro claro
          throw new Error(
            'Chrome não encontrado. A instalação automática já foi tentada. Verifique os logs do servidor.'
          );
        } else {
          throw chromeError;
        }
      }
      page = await browser.newPage();

      // Configurar timeout da página
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);

      // 3. Renderizar o HTML
      this.logger.debug('Renderizando HTML...');
      
      // Configurar encoding UTF-8 explicitamente
      await page.setExtraHTTPHeaders({
        'Content-Type': 'text/html; charset=utf-8'
      });
      
      await page.setContent(htmlContent, {
        waitUntil: 'load',
        timeout: 30000 
      });

      // Emular CSS de print para análise de paginação
      try {
        await page.emulateMediaType('print');
      } catch {}

      // Adicionar CSS para forçar renderização de cores no PDF
      await page.addStyleTag({
        content: `
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        `
      });

      // #region agent log
      if (templateName === 'fornecedor-colheitas') {
        const layout = await page.evaluate(() => {
          const A4H = 1122; // aprox px @96dpi (diagnóstico)
          const pickTitle = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
          const cards = Array.from(document.querySelectorAll('.card')) as HTMLElement[];
          const issues: any[] = [];
          const summaries = cards.slice(0, 80).map((card) => {
            const header = card.querySelector('.card-header') as HTMLElement | null;
            const titleEl = header?.querySelector('.card-title') as HTMLElement | null;
            const body = card.querySelector('.card-body') as HTMLElement | null;
            const title = pickTitle(titleEl) || pickTitle(header);
            const hr = header?.getBoundingClientRect();
            const br = body?.getBoundingClientRect();
            const headerTop = hr ? hr.top + window.scrollY : null;
            const bodyTop = br ? br.top + window.scrollY : null;
            const headerPage = headerTop === null ? null : Math.floor(headerTop / A4H);
            const bodyPage = bodyTop === null ? null : Math.floor(bodyTop / A4H);
            const headerOffset = headerTop === null ? null : Math.round(headerTop - (headerPage! * A4H));
            const bodyOffset = bodyTop === null ? null : Math.round(bodyTop - (bodyPage! * A4H));

            // header "sozinho" no topo (offset pequeno) e body em outra página => espaço em branco grande
            if (headerPage !== null && bodyPage !== null && headerPage !== bodyPage && headerOffset !== null && headerOffset < 220) {
              issues.push({
                title,
                headerPage,
                bodyPage,
                headerOffset,
                bodyOffset,
                headerHeight: hr ? Math.round(hr.height) : null,
              });
            }
            return { title, headerPage, bodyPage, headerOffset, bodyOffset };
          });

          const cardEl = document.querySelector('.card');
          const bodyEl = document.querySelector('.card-body');
          const headerEl = document.querySelector('.card-header');

          const css = {
            card: cardEl ? window.getComputedStyle(cardEl).breakInside : null,
            cardBody: bodyEl ? window.getComputedStyle(bodyEl).breakInside : null,
            cardHeader: headerEl ? window.getComputedStyle(headerEl).breakAfter : null,
          };

          return {
            A4H,
            viewport: { w: window.innerWidth, h: window.innerHeight },
            scrollH: document.documentElement.scrollHeight,
            cardsCount: cards.length,
            css,
            issues: issues.slice(0, 30),
            sample: summaries.slice(0, 20),
          };
        });

        agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'pdf.service.ts:gerarPdf:layout',message:'Diagnóstico layout (print emulado)',data:layout,timestamp:Date.now()});
      }
      // #endregion agent log

      // Aguardar renderização completa (incluindo gráficos Chart.js se houver)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Se houver gráfico (Chart.js), aguardar um pouco mais para garantir renderização
      const hasChart =
        htmlContent.includes('graficoHistorico') ||
        htmlContent.includes('graficoSemanal');
      if (hasChart) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 4. Gerar o PDF com footer customizado usando displayHeaderFooter (exceto para boleto)
      const isBoleto = templateName === 'boleto';
      this.logger.debug('Gerando PDF...');
      
      const pdfOptions: any = {
        format: 'A4',
        printBackground: true,
        timeout: 30000,
      };

      if (!isBoleto) {
        // Apenas para outros PDFs, usar rodapé
        pdfOptions.displayHeaderFooter = true;
        pdfOptions.headerTemplate = '<div></div>';
        pdfOptions.footerTemplate = `
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          </style>
          <div style="width: 100%; padding: 10px 20px; border-top: 2px solid #059669; background-color: #f9fafb; display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
            <div style="flex: 1; text-align: left;">
              <div style="font-weight: bold; color: #059669 !important; font-size: 10px; margin-bottom: 3px; display: block; -webkit-print-color-adjust: exact;">${razaoSocial}</div>
              ${cnpj ? `<div style="font-size: 10px; color: #6b7280 !important; font-weight: normal; display: block; -webkit-print-color-adjust: exact;">${cnpj}</div>` : ''}
            </div>
            <div style="flex: 1; text-align: center; font-size: 10px; color: #6b7280 !important; font-weight: normal; -webkit-print-color-adjust: exact;">
              Sistemas de Informações - AlencarFrutas
            </div>
            <div style="flex: 1; text-align: right;">
              <div style="margin-bottom: 3px; font-size: 10px; color: #6b7280 !important; font-weight: normal; display: block; -webkit-print-color-adjust: exact;">Página <span class="pageNumber" style="color: #6b7280 !important; -webkit-print-color-adjust: exact;"></span> de <span class="totalPages" style="color: #6b7280 !important; -webkit-print-color-adjust: exact;"></span></div>
              <div style="font-size: 10px; color: #6b7280 !important; font-weight: normal; display: block; -webkit-print-color-adjust: exact;">Gerado em: <span style="color: #6b7280 !important; -webkit-print-color-adjust: exact;">${dataGeracao}</span></div>
            </div>
          </div>
        `;
        pdfOptions.margin = {
          top: '20px',
          bottom: '80px', // Espaço para o footer
          left: '16px',   // Margem lateral
          right: '16px',  // Margem lateral
        };
      } else {
        // Para boleto, sem rodapé
        pdfOptions.margin = {
          top: '10mm',
          bottom: '10mm',
          left: '5mm',
          right: '5mm',
        };
      }

      const pdfBuffer = await page.pdf(pdfOptions);

      // #region agent log
      try {
        const pageCount = (Buffer.from(pdfBuffer).toString('binary').match(/\/Type\s*\/Page\b/g) || []).length;
        agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'pdf.service.ts:gerarPdf:pdf',message:'PDF gerado (contagem aprox. de páginas)',data:{templateName,bytes:(pdfBuffer as any)?.length||null,pageCount},timestamp:Date.now()});
      } catch {}
      // #endregion agent log

      this.logger.log(`PDF gerado com sucesso: ${templateName} (${pdfBuffer.length} bytes)`);

      // Converter Uint8Array para Buffer
      return Buffer.from(pdfBuffer);
    } catch (error: any) {
      this.logger.error(`Erro ao gerar PDF: ${error.message}`, error.stack);
      
      // Mensagem de erro mais descritiva
      let errorMessage = `Falha ao gerar PDF: ${error.message}`;
      
      if (error.message?.includes('ECONNRESET') || error.message?.includes('Connection')) {
        errorMessage = 'Erro de conexão ao gerar PDF. Tente novamente.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Timeout ao gerar PDF. O processo está demorando mais que o esperado.';
      } else if (error.message?.includes('Browser closed')) {
        errorMessage = 'O navegador foi fechado durante a geração do PDF.';
      }
      
      throw new Error(errorMessage);
    } finally {
      // Garantir que o browser seja fechado mesmo em caso de erro
      try {
        if (page) {
          await page.close().catch(() => {});
        }
        if (browser) {
          await browser.close().catch(() => {});
        }
      } catch (closeError: any) {
        this.logger.warn(`Erro ao fechar browser: ${closeError.message}`);
      }
    }
  }
}

