import { Types } from 'mongoose';
export declare class SubmitOcrResultDto {
    readonly documentId: string | Types.ObjectId;
    readonly raw_text: string;
    readonly page?: number;
}
