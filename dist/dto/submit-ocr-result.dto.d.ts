import { Types } from 'mongoose';
export declare class SubmitOcrResultDto {
    readonly documentId: string | Types.ObjectId;
    readonly extractedText: string;
}
