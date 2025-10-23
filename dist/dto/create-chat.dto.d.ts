import { Types } from 'mongoose';
export declare class CreateChatDto {
    readonly user: string | Types.ObjectId;
    readonly title?: string;
    readonly conversationHistory?: string[] | Types.ObjectId[];
}
