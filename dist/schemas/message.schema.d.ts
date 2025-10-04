import { Document as MongoDocument, Types } from 'mongoose';
export type MessageDocument = Message & MongoDocument;
export declare class Message {
    _id: Types.ObjectId;
    category: string;
    text: string;
    date: Date;
    score: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const MessageSchema: import("mongoose").Schema<Message, import("mongoose").Model<Message, any, any, any, MongoDocument<unknown, any, Message, any, {}> & Message & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, MongoDocument<unknown, {}, import("mongoose").FlatRecord<Message>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Message> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
