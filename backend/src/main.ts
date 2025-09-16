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
  const app = await NestFactory.create(AppModule);
  
  // Configurar validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Configurar CORS para permitir conexão com frontend
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3002';
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
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
  await app.listen(port);
  
  console.log(`🚀 Servidor NestJS rodando na porta ${port}`);
  console.log(`📱 Frontend: http://localhost:3002`);
  console.log(`🔧 Backend: http://localhost:${port}`);
  console.log(`📚 Documentação: http://localhost:${port}/api`);
}
bootstrap();
