import { Types } from 'mongoose';
export declare class CreateDocumentDto {
    readonly filename: string;
    readonly fileUrl: string;
    readonly extension: string;
    readonly fileUploader: string | Types.ObjectId;
    readonly rawTextFileId?: string;
    readonly metadata?: Record<string, any>;
}
