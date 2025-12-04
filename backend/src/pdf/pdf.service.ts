import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs/promises';
import * as hbs from 'handlebars';
import * as path from 'path';
import { execSync } from 'child_process';

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
      await page.setContent(htmlContent, {
        waitUntil: 'load',
        timeout: 30000 
      });

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

      // Aguardar renderização completa (incluindo gráficos Chart.js se houver)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Se houver gráfico, aguardar um pouco mais para garantir renderização
      const hasChart = htmlContent.includes('graficoHistorico');
      if (hasChart) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 4. Gerar o PDF com footer customizado usando displayHeaderFooter
      this.logger.debug('Gerando PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
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
        `,
        margin: {
          top: '20px',
          bottom: '80px', // Espaço para o footer
          left: '16px',   // Margem lateral
          right: '16px',  // Margem lateral
        },
        timeout: 30000,
      });

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

