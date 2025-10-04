import { Types } from 'mongoose';
export declare class UpdateChatDto {
    readonly session?: string;
    readonly user?: string | Types.ObjectId;
    readonly messageHistory?: string[] | Types.ObjectId[];
}
