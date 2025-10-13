import { DocumentService } from '../services/document.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { SubmitOcrResultDto } from '../dto/submit-ocr-result.dto';
import { DocumentQueryDto } from '../dto/document-query.dto';
import { DocumentMetadataDto } from '../dto/document-metadata.dto';
import { Document } from '../schemas/document.schema';
import { ReportOcrErrorDto } from '../dto/report-ocr-error.dto';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    createDocument(createDocumentDto: CreateDocumentDto): Promise<Document>;
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
    submitOcrResult(submitOcrResultDto: SubmitOcrResultDto): Promise<Document>;
    markOcrProcessing(id: string): Promise<Document>;
    markOcrFailed(id: string, error: string): Promise<Document>;
    reportOcrError(body: ReportOcrErrorDto): Promise<Document>;
    getDocumentsByOcrStatus(status: string): Promise<Document[]>;
}
