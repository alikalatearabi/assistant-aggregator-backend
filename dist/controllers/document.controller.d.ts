import { DocumentService } from '../services/document.service';
import { MinioService } from '../services/minio.service';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentQueryDto } from '../dto/document-query.dto';
import { DocumentMetadataDto } from '../dto/document-metadata.dto';
import { Document } from '../schemas/document.schema';
export declare class DocumentController {
    private readonly documentService;
    private readonly minioService;
    private readonly logger;
    constructor(documentService: DocumentService, minioService: MinioService);
    createDocument(file: any, body: any): Promise<Document>;
    findAllDocuments(query: DocumentQueryDto): Promise<{
        documents: Document[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
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
    searchDocuments(searchTerm: string): Promise<Document[]>;
    findDocumentsByUploader(uploaderId: string): Promise<Document[]>;
    findDocumentsByExtension(extension: string): Promise<Document[]>;
    findDocumentById(id: string): Promise<Document>;
    updateDocument(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document>;
    updateDocumentMetadata(id: string, metadata: DocumentMetadataDto): Promise<Document>;
    updateRawTextFileId(id: string, rawTextFileId: string): Promise<Document>;
    deleteDocument(id: string): Promise<Document>;
    getPresignedUrl(id: string, expires?: string): Promise<{
        url: string;
    }>;
    ensurePublicBucket(): Promise<{
        message: string;
    }>;
}
