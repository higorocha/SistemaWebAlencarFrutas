"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const dotenv = require("dotenv");
process.env.TZ = 'America/Sao_Paulo';
dotenv.config();
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3002';
    console.log('🔧 CORS_ORIGIN from env:', corsOrigin);
    const allowedOrigins = corsOrigin === '*' ? true : corsOrigin.split(',').map(origin => origin.trim());
    console.log('🔧 CORS Config:', allowedOrigins);
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('AlencarFrutas API')
        .setDescription('API do sistema de gestão AlencarFrutas')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT || 5002;
    await app.listen(port);
    console.log(`🚀 Servidor NestJS rodando na porta ${port}`);
    console.log(`📱 Frontend: http://localhost:3002`);
    console.log(`🔧 Backend: http://localhost:${port}`);
    console.log(`📚 Documentação: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map