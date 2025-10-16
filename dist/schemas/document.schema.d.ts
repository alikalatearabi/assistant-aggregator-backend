import { Document as MongoDocument, Types } from 'mongoose';
import { User } from './user.schema';
import { Dataset } from './dataset.schema';
export type DocumentDocument = Document & MongoDocument;
export declare class DocumentMetadata {
    user_id?: Types.ObjectId | User;
    document_id?: string;
    page_id?: string;
    title?: string;
    approved_date?: string;
    effective_date?: string;
    owner?: string;
    username?: string;
    access_level?: string;
    ocr?: Record<string, any>;
}
export declare class Document {
    _id: Types.ObjectId;
    filename: string;
    fileUrl: string;
    extension: string;
    dataset?: Types.ObjectId | Dataset;
    originalDocumentId?: Types.ObjectId;
    pageNumber?: number;
    isPageDocument?: boolean;
    rawTextFileId: string;
    raw_text: string;
    ocrStatus: string;
    metadata: DocumentMetadata;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DocumentSchema: import("mongoose").Schema<Document, import("mongoose").Model<Document, any, any, any, MongoDocument<unknown, any, Document, any, {}> & Document & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document, MongoDocument<unknown, {}, import("mongoose").FlatRecord<Document>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Document> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
