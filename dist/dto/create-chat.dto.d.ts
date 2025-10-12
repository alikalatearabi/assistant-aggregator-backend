import { Types } from 'mongoose';
export declare class CreateChatDto {
    readonly user: string | Types.ObjectId;
    readonly conversationHistory?: string[] | Types.ObjectId[];
}
