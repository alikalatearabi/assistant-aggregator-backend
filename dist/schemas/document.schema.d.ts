import { Document as MongoDocument, Types } from 'mongoose';
import { User } from './user.schema';
export type DocumentDocument = Document & MongoDocument;
export declare class Document {
    _id: Types.ObjectId;
    filename: string;
    fileUrl: string;
    extension: string;
    fileUploader: Types.ObjectId | User;
    rawTextFileId: string;
    extractedText: string;
    ocrConfidence: number;
    ocrStatus: string;
    ocrMetadata: Record<string, any>;
    metadata: Record<string, any>;
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
