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
  
  // Configurar CORS para permitir conexão com frontend (local e rede)
  const corsOrigin = process.env.CORS_ORIGIN || `http://localhost:3002,http://${localIP}:3002`;
  console.log('🔧 CORS_ORIGIN from env:', corsOrigin);
  
  const allowedOrigins = corsOrigin === '*' ? true : corsOrigin.split(',').map(origin => origin.trim());
  console.log('🔧 CORS Config:', allowedOrigins);
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
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
