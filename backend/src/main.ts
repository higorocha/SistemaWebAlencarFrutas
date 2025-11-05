import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as os from 'os';

// Configurar fuso horário ANTES de tudo
process.env.TZ = 'America/Sao_Paulo';

// Carregar variáveis de ambiente
dotenv.config();

// Função para detectar automaticamente o IP da rede local
function getLocalNetworkIP(): string {
  const interfaces = os.networkInterfaces();
  
  // Priorizar interfaces ativas (WiFi, Ethernet)
  const priorityInterfaces = ['Wi-Fi', 'Ethernet', 'en0', 'eth0'];
  
  for (const interfaceName of priorityInterfaces) {
    const networkInterface = interfaces[interfaceName];
    if (networkInterface) {
      for (const alias of networkInterface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          console.log(`🌐 IP detectado automaticamente: ${alias.address} (interface: ${interfaceName})`);
          return alias.address;
        }
      }
    }
  }
  
  // Fallback: buscar qualquer interface IPv4 não-interna
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    if (networkInterface) {
      for (const alias of networkInterface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          console.log(`🌐 IP detectado automaticamente: ${alias.address} (interface: ${interfaceName})`);
          return alias.address;
        }
      }
    }
  }
  
  // Fallback final: localhost
  console.log('⚠️  Não foi possível detectar IP da rede, usando localhost');
  return 'localhost';
}

async function bootstrap() {
  // Detectar IP da rede local automaticamente
  const localIP = getLocalNetworkIP();
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error'] // Apenas erros críticos
  });
  
  // Configurar validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // ============================================
  // CONFIGURAÇÃO CORS - SEGURA
  // ============================================

  const environment = process.env.NODE_ENV || 'development';
  const isDevelopment = environment === 'development';

  // Lista de origens permitidas por ambiente
  const allowedOrigins = {
    production: [
      'https://alencarfrutas.com.br',           // Frontend produção
      'https://www.alencarfrutas.com.br',       // Frontend produção com www
    ],

    development: [
      'http://localhost:3002',                   // Frontend local
      'http://localhost:19000',                  // Expo Metro
      'http://localhost:19001',                  // Expo Metro (porta alternativa)
      `http://${localIP}:3002`,                 // Frontend na rede local
      'https://reissuable-oda-conscionably.ngrok-free.dev', // Ngrok para testes
    ],
  };

  // Selecionar origens baseado no ambiente
  const origins = allowedOrigins[environment] || allowedOrigins.development;

  // ⚠️ SEGURANÇA CRÍTICA: Bloquear wildcard em produção
  const corsOriginEnv = process.env.CORS_ORIGIN;
  if (corsOriginEnv === '*' && !isDevelopment) {
    console.error('');
    console.error('🚨🚨🚨 ALERTA DE SEGURANÇA CRÍTICA 🚨🚨🚨');
    console.error('🚨 CORS wildcard (*) detectado em PRODUÇÃO!');
    console.error('🚨 Isso permite que QUALQUER site acesse sua API!');
    console.error('🚨 Usando lista branca segura para prevenir ataques.');
    console.error('🚨 Corrija a variável CORS_ORIGIN no Render.com!');
    console.error('');
  }

  // Adicionar origens extras do .env (apenas se não for wildcard)
  if (corsOriginEnv && corsOriginEnv !== '*') {
    const envOrigins = corsOriginEnv.split(',').map(origin => origin.trim());
    origins.push(...envOrigins);
  }

  // Remover duplicatas
  const uniqueOrigins = [...new Set(origins)];

  console.log('');
  console.log(`🌐 [CORS] Ambiente: ${environment}`);
  console.log(`🌐 [CORS] Total de origens permitidas: ${uniqueOrigins.length}`);
  if (isDevelopment) {
    console.log(`🌐 [CORS] Lista de origens:`);
    uniqueOrigins.forEach(origin => console.log(`   - ${origin}`));
  } else {
    console.log(`🌐 [CORS] Modo produção: Lista de origens restrita`);
  }
  console.log('');

  // Configurar CORS com validação segura
  app.enableCors({
    origin: (origin, callback) => {
      // 1. Permitir requisições sem origin (apps mobile nativos, Postman, curl, adb reverse)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Verificar se origin está na lista branca
      if (uniqueOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // 3. Bloquear e logar tentativa não autorizada
        console.warn('');
        console.warn(`❌ [CORS BLOQUEADO] Tentativa de acesso não autorizada`);
        console.warn(`❌ Origem: ${origin}`);
        console.warn(`❌ Timestamp: ${new Date().toISOString()}`);

        if (isDevelopment) {
          console.warn(`💡 [DICA] Para permitir esta origem em desenvolvimento:`);
          console.warn(`   Adicione '${origin}' ao array allowedOrigins.development`);
          console.warn(`   Localização: backend/src/main.ts (linha ~70)`);
        } else {
          console.warn(`⚠️  [PRODUÇÃO] Possível tentativa de ataque!`);
        }
        console.warn('');

        callback(new Error(`CORS: Origem '${origin}' não autorizada`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],
  });
  
  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('AlencarFrutas API')
    .setDescription('API do sistema de gestão AlencarFrutas')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = process.env.PORT || 5002;
  const host = process.env.HOST || '0.0.0.0'; // Permitir conexões de qualquer IP da rede
  await app.listen(port, host);
  
  console.log(`🚀 Servidor NestJS rodando na porta ${port}`);
  console.log(`📱 Frontend Local: http://localhost:3002`);
  console.log(`📱 Frontend Rede: http://${localIP}:3002`);
  console.log(`🔧 Backend Local: http://localhost:${port}`);
  console.log(`🔧 Backend Rede: http://${localIP}:${port}`);
  console.log(`📚 Documentação: http://${localIP}:${port}/api`);
}
bootstrap();
