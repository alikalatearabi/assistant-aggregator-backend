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
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const user_schema_1 = require("./schemas/user.schema");
const document_schema_1 = require("./schemas/document.schema");
const document_controller_1 = require("./controllers/document.controller");
const document_service_1 = require("./services/document.service");
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
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    uri: configService.get('MONGODB_URI') || 'mongodb://admin:password123@localhost:27017/assistant_aggregator?authSource=admin',
                }),
                inject: [config_1.ConfigService],
            }),
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: document_schema_1.Document.name, schema: document_schema_1.DocumentSchema },
            ]),
        ],
        controllers: [app_controller_1.AppController, app_controller_1.UserController, document_controller_1.DocumentController],
        providers: [app_service_1.AppService, document_service_1.DocumentService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map