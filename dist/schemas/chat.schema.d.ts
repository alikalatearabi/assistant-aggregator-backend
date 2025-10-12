import { Document as MongoDocument, Types } from 'mongoose';
import { User } from './user.schema';
import { Message } from './message.schema';
export type ChatDocument = Chat & MongoDocument;
export declare class Chat {
    _id: Types.ObjectId;
    user: Types.ObjectId | User;
    conversationHistory: Types.ObjectId[] | Message[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const ChatSchema: import("mongoose").Schema<Chat, import("mongoose").Model<Chat, any, any, any, MongoDocument<unknown, any, Chat, any, {}> & Chat & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Chat, MongoDocument<unknown, {}, import("mongoose").FlatRecord<Chat>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Chat> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
