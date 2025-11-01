"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const nest_winston_1 = require("nest-winston");
const logger_config_1 = require("./config/logger.config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const document_schema_1 = require("./schemas/document.schema");
const message_schema_1 = require("./schemas/message.schema");
const chat_schema_1 = require("./schemas/chat.schema");
const dataset_schema_1 = require("./schemas/dataset.schema");
const user_schema_1 = require("./schemas/user.schema");
const document_controller_1 = require("./controllers/document.controller");
const ocr_controller_1 = require("./controllers/ocr.controller");
const chat_controller_1 = require("./controllers/chat.controller");
const document_service_1 = require("./services/document.service");
const chat_service_1 = require("./services/chat.service");
const ocr_service_1 = require("./services/ocr.service");
const ocr_status_service_1 = require("./services/ocr-status.service");
const document_page_service_1 = require("./services/document-page.service");
const ocr_timeout_service_1 = require("./services/ocr-timeout.service");
const chat_messages_gateway_1 = require("./gateways/chat-messages.gateway");
const chat_messages_service_1 = require("./services/chat-messages.service");
const message_service_1 = require("./services/message.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const messages_module_1 = require("./messages/messages.module");
const datasets_module_1 = require("./datasets/datasets.module");
const chats_module_1 = require("./chats/chats.module");
const minio_module_1 = require("./shared/minio/minio.module");
const rate_limit_module_1 = require("./shared/rate-limit/rate-limit.module");
const schedule_1 = require("@nestjs/schedule");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            nest_winston_1.WinstonModule.forRoot(logger_config_1.loggerConfig),
            axios_1.HttpModule,
            schedule_1.ScheduleModule.forRoot(),
            minio_module_1.MinioModule,
            rate_limit_module_1.RateLimitModule,
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    uri: configService.get('MONGO_URI') || 'mongodb://admin:password123@localhost:27017/assistant_aggregator?authSource=admin',
                }),
                inject: [config_1.ConfigService],
            }),
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: document_schema_1.Document.name, schema: document_schema_1.DocumentSchema },
                { name: message_schema_1.Message.name, schema: message_schema_1.MessageSchema },
                { name: chat_schema_1.Chat.name, schema: chat_schema_1.ChatSchema },
                { name: dataset_schema_1.Dataset.name, schema: dataset_schema_1.DatasetSchema },
            ]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            messages_module_1.MessagesModule,
            datasets_module_1.DatasetsModule,
            chats_module_1.ChatsModule,
        ],
        controllers: [
            app_controller_1.AppController,
            document_controller_1.DocumentController,
            ocr_controller_1.OcrController,
            chat_controller_1.ChatController
        ],
        providers: [
            app_service_1.AppService,
            document_service_1.DocumentService,
            chat_service_1.ChatService,
            ocr_service_1.OcrService,
            ocr_status_service_1.OcrStatusService,
            document_page_service_1.DocumentPageService,
            ocr_timeout_service_1.OcrTimeoutService,
            chat_messages_gateway_1.ChatMessagesGateway,
            chat_messages_service_1.ChatMessagesService,
            message_service_1.MessageService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map