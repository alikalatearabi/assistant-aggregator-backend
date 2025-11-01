"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const http_exception_filter_1 = require("./common/http-exception.filter");
const nest_winston_1 = require("nest-winston");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useLogger(app.get(nest_winston_1.WINSTON_MODULE_NEST_PROVIDER));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Assistant Aggregator API')
        .setDescription('API documentation for the Assistant Aggregator Backend application')
        .setVersion('1.0')
        .addTag('users', 'User management operations')
        .addTag('documents', 'Document management operations')
        .addTag('chats', 'Chat session management operations')
        .addTag('Authentication', 'Auth endpoints: register, login, profile')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    app.enableCors();
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
    console.log(`Application is running on: http://0.0.0.0:${process.env.PORT ?? 3000}`);
    console.log(`Swagger documentation available at: http://0.0.0.0:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map