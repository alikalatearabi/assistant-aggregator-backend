import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController, UserController } from './app.controller';
import { AppService } from './app.service';
import { User, UserSchema } from './schemas/user.schema';
import { Document, DocumentSchema } from './schemas/document.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Chat, ChatSchema } from './schemas/chat.schema';
import { DocumentController } from './controllers/document.controller';
import { MessageController } from './controllers/message.controller';
import { ChatController } from './controllers/chat.controller';
import { DocumentService } from './services/document.service';
import { MessageService } from './services/message.service';
import { ChatService } from './services/chat.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://admin:password123@localhost:27017/assistant_aggregator?authSource=admin',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
  ],
  controllers: [AppController, UserController, DocumentController, MessageController, ChatController],
  providers: [AppService, DocumentService, MessageService, ChatService],
})
export class AppModule {}
