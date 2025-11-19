#!/usr/bin/env node
/**
 * Script para garantir que o Chrome do Puppeteer está instalado
 * Útil para produção (Render.com) onde o Chrome precisa ser instalado explicitamente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

async function ensureChrome() {
  try {
    // Tentar encontrar Chrome instalado em diferentes locais
    const possiblePaths = [
      path.join(process.env.HOME || '', '.cache', 'puppeteer'),
      path.join(process.env.USERPROFILE || '', '.cache', 'puppeteer'),
      path.join('/opt/render/.cache', 'puppeteer'),
      path.join(process.cwd(), 'node_modules', '.cache', 'puppeteer'),
    ];

    let chromeFound = false;
    for (const cachePath of possiblePaths) {
      if (fs.existsSync(cachePath)) {
        // Verificar se há um executável chrome dentro
        try {
          const files = fs.readdirSync(cachePath, { recursive: true });
          const hasChrome = files.some((file: string) => 
            typeof file === 'string' && file.includes('chrome') && !file.includes('.zip')
          );
          if (hasChrome) {
            chromeFound = true;
            console.log(`✅ Chrome do Puppeteer encontrado em: ${cachePath}`);
            break;
          }
        } catch (e) {
          // Continuar procurando
        }
      }
    }

    if (chromeFound) {
      return;
    }

    // Se não encontrou, instalar Chrome
    console.log('🔧 Chrome não encontrado. Instalando Chrome para Puppeteer...');
    execSync('npx puppeteer browsers install chrome', { 
      stdio: 'inherit',
      env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: 'false' }
    });
    console.log('✅ Chrome instalado com sucesso');
  } catch (error: any) {
    console.warn('⚠️  Aviso: Não foi possível instalar Chrome:', error.message);
    console.warn('   O Puppeteer tentará usar o Chrome do sistema ou baixar automaticamente na primeira execução');
    // Não falhar o build se não conseguir instalar
    process.exit(0);
  }
}

ensureChrome();

