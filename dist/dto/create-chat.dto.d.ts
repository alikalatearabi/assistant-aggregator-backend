import { Types } from 'mongoose';
export declare class CreateChatDto {
    readonly session: string;
    readonly user: string | Types.ObjectId;
    readonly messageHistory?: string[] | Types.ObjectId[];
}
