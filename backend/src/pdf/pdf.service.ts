import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs/promises';
import * as hbs from 'handlebars';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly templatesPath = path.join(process.cwd(), 'src', 'pdf', 'templates');
  private readonly partialsPath = path.join(this.templatesPath, 'partials');
  private partialsRegistered = false;

  /**
   * Registra os partials do Handlebars (cabeçalho e rodapé reutilizáveis)
   */
  private async registrarPartials() {
    if (this.partialsRegistered) return;

    try {
      const headerPath = path.join(this.partialsPath, 'header.hbs');
      const footerPath = path.join(this.partialsPath, 'footer.hbs');

      const headerTemplate = await fs.readFile(headerPath, 'utf-8');
      const footerTemplate = await fs.readFile(footerPath, 'utf-8');

      hbs.registerPartial('header', headerTemplate);
      hbs.registerPartial('footer', footerTemplate);

      this.partialsRegistered = true;
      this.logger.debug('Partials do Handlebars registrados com sucesso');
    } catch (error: any) {
      this.logger.warn(`Erro ao registrar partials: ${error.message}. Continuando sem partials.`);
    }
  }

  /**
   * Gera um PDF a partir de um template Handlebars
   * @param templateName Nome do template sem extensão (ex: 'relatorio-pedidos')
   * @param data Dados a serem injetados no template
   * @returns Buffer do PDF gerado
   */
  async gerarPdf(templateName: string, data: any): Promise<Buffer> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      // 0. Registrar partials (cabeçalho e rodapé reutilizáveis)
      await this.registrarPartials();

      // 1. Compilar o Template HTML
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
        // Se falhar e for erro de Chrome não encontrado, dar instruções
        if (chromeError.message?.includes('Could not find Chrome') || chromeError.message?.includes('chrome')) {
          this.logger.error('Chrome não encontrado. Para produção, execute: npm run puppeteer:install');
          throw new Error(
            'Chrome não encontrado. Em produção (Render.com), certifique-se de que o Build Command inclui: npm run puppeteer:install'
          );
        }
        throw chromeError;
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

      // Aguardar um pouco para garantir renderização completa
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. Gerar o PDF
      this.logger.debug('Gerando PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
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

