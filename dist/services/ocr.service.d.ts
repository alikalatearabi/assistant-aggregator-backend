import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Model } from 'mongoose';
import { DocumentDocument } from '../schemas/document.schema';
export interface OcrRequest {
    documentId: string;
    minioUrl: string;
}
export interface OcrResponse {
    success: boolean;
    message: string;
    requestId?: string;
    accessToken?: string;
    refreshToken?: string;
}
export declare class OcrService {
    private readonly configService;
    private readonly httpService;
    private readonly documentModel;
    private readonly logger;
    constructor(configService: ConfigService, httpService: HttpService, documentModel: Model<DocumentDocument>);
    sendDocumentForOcr(ocrRequest: OcrRequest): Promise<OcrResponse>;
    sendDocumentForOcrAsync(ocrRequest: OcrRequest): Promise<void>;
}
