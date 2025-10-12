import { Types } from 'mongoose';
export declare class UpdateChatDto {
    readonly user?: string | Types.ObjectId;
    readonly conversationHistory?: string[] | Types.ObjectId[];
}
