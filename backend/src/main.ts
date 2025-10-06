import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Configurar fuso horário ANTES de tudo
process.env.TZ = 'America/Sao_Paulo';

// Carregar variáveis de ambiente
dotenv.config();

async function bootstrap() {
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
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3002,http://192.168.1.145:3002';
  console.log('🔧 CORS_ORIGIN from env:', corsOrigin);
  
  const allowedOrigins = corsOrigin === '*' ? true : corsOrigin.split(',').map(origin => origin.trim());
  console.log('🔧 CORS Config:', allowedOrigins);
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
  console.log(`📱 Frontend Rede: http://192.168.1.145:3002`);
  console.log(`🔧 Backend Local: http://localhost:${port}`);
  console.log(`🔧 Backend Rede: http://192.168.1.145:${port}`);
  console.log(`📚 Documentação: http://192.168.1.145:${port}/api`);
}
bootstrap();
