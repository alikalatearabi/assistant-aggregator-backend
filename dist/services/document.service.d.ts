import { Model } from 'mongoose';
import { Document, DocumentDocument } from '../schemas/document.schema';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentQueryDto } from '../dto/document-query.dto';
import { OcrService } from './ocr.service';
import { MinioService } from './minio.service';
export declare class DocumentService {
    private documentModel;
    private readonly ocrService;
    private readonly minioService;
    private readonly logger;
    constructor(documentModel: Model<DocumentDocument>, ocrService: OcrService, minioService: MinioService);
    createDocument(createDocumentDto: CreateDocumentDto): Promise<Document>;
    findAllDocuments(query?: DocumentQueryDto): Promise<{
        documents: Document[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findDocumentById(id: string): Promise<Document>;
    findDocumentsByUploader(uploaderId: string): Promise<Document[]>;
    findDocumentsByExtension(extension: string): Promise<Document[]>;
    updateDocument(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document>;
    deleteDocument(id: string): Promise<Document>;
    updateDocumentMetadata(id: string, metadata: Record<string, any>): Promise<Document>;
    updateRawTextFileId(id: string, rawTextFileId: string): Promise<Document>;
    submitOcrResult(documentId: string, extractedText: string, page?: number): Promise<Document>;
    markOcrProcessing(documentId: string): Promise<Document>;
    reportOcrError(params: {
        documentId: string;
        page?: number;
        status: string;
        message: string;
    }): Promise<Document>;
    findDocumentsByOcrStatus(status: string): Promise<Document[]>;
    searchDocuments(searchTerm: string): Promise<Document[]>;
    getDocumentStats(): Promise<{
        totalDocuments: number;
        documentsByExtension: Array<{
            _id: string;
            count: number;
        }>;
        documentsByUploader: Array<{
            _id: string;
            count: number;
        }>;
        recentDocuments: number;
    }>;
    getPresignedUrlForDocument(id: string, expires?: number): Promise<{
        url: string;
    }>;
}
