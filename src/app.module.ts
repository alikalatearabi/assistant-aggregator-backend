import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from './config/logger.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Document, DocumentSchema } from './schemas/document.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Chat, ChatSchema } from './schemas/chat.schema';
import { Dataset, DatasetSchema } from './schemas/dataset.schema';
import { User, UserSchema } from './schemas/user.schema';
import { DocumentController } from './controllers/document.controller';
import { OcrController } from './controllers/ocr.controller';
import { ChatController } from './controllers/chat.controller';
import { DocumentService } from './services/document.service';
import { ChatService } from './services/chat.service';
import { OcrService } from './services/ocr.service';
import { OcrStatusService } from './services/ocr-status.service';
import { DocumentPageService } from './services/document-page.service';
import { OcrTimeoutService } from './services/ocr-timeout.service';
import { ChatMessagesGateway } from './gateways/chat-messages.gateway';
import { ChatMessagesService } from './services/chat-messages.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { DatasetsModule } from './datasets/datasets.module';
import { MinioModule } from './shared/minio/minio.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WinstonModule.forRoot(loggerConfig),
    HttpModule,
    ScheduleModule.forRoot(),
    MinioModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI') || 'mongodb://admin:password123@localhost:27017/assistant_aggregator?authSource=admin',
      }),
      inject: [ConfigService],
    }),
    // Keep legacy schemas registered for backwards compatibility during migration
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Dataset.name, schema: DatasetSchema },
    ]),
    AuthModule,
    UsersModule,
    MessagesModule,
    DatasetsModule,
  ],
  controllers: [
    AppController,
    DocumentController,
    OcrController,
    ChatController],
  providers: [
    AppService,
    DocumentService,
    ChatService,
    OcrService,
    OcrStatusService,
    DocumentPageService,
    OcrTimeoutService,
    ChatMessagesGateway,
    ChatMessagesService,
  ],
})
export class AppModule {}
