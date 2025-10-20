"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OcrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const FormData = require("form-data");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const document_schema_1 = require("../schemas/document.schema");
let OcrService = OcrService_1 = class OcrService {
    configService;
    httpService;
    documentModel;
    logger = new common_1.Logger(OcrService_1.name);
    constructor(configService, httpService, documentModel) {
        this.configService = configService;
        this.httpService = httpService;
        this.documentModel = documentModel;
    }
    async sendDocumentForOcr(ocrRequest) {
        const baseUrl = this.configService.get('OCR_API_URL_BASE') || 'http://78.39.182.65:8000';
        const authUrl = `${baseUrl}/authorize`;
        const filesUrl = `${baseUrl}/files`;
        try {
            this.logger.log(`Sending document for OCR processing: ${ocrRequest.documentId}`);
            try {
                if (mongoose_2.Types.ObjectId.isValid(ocrRequest.documentId)) {
                    const updated = await this.documentModel.findByIdAndUpdate(ocrRequest.documentId, {
                        $set: {
                            ocrStatus: 'processing',
                            'ocrMetadata.processingStartedAt': new Date().toISOString(),
                            'metadata.ocr.processingStartedAt': new Date().toISOString(),
                        }
                    }, { new: true }).exec();
                    if (updated) {
                        this.logger.log(`Document ${ocrRequest.documentId} marked as OCR processing (started)`);
                        console.log(`🟡 Document ${ocrRequest.documentId} marked as OCR processing`);
                    }
                    else {
                        this.logger.warn(`Mark processing: no document found with id ${ocrRequest.documentId}`);
                        console.log(`⚠️  Could not find document ${ocrRequest.documentId} to mark as processing`);
                    }
                }
            }
            catch (markErr) {
                this.logger.warn(`Failed to mark document ${ocrRequest.documentId} as processing: ${markErr?.message || markErr}`);
            }
            const username = this.configService.get('OCR_USERNAME') || 'user1';
            const password = this.configService.get('OCR_PASSWORD') || 'pass1';
            const authPayload = new URLSearchParams();
            authPayload.append('username', username);
            authPayload.append('password', password);
            this.logger.debug(`OCR Auth Request payload:`, { username, password: '[REDACTED]' });
            const authResponse = await (0, rxjs_1.firstValueFrom)(this.httpService.post(authUrl, authPayload.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }));
            const accessToken = authResponse.data?.access_token || authResponse.data?.accessToken;
            const refreshToken = authResponse.data?.refresh_token || authResponse.data?.refreshToken;
            if (!accessToken) {
                throw new Error('OCR authorization failed: access_token not present in response');
            }
            const formData = new FormData();
            formData.append('job_id', ocrRequest.documentId);
            formData.append('url', ocrRequest.minioUrl);
            this.logger.debug(`OCR Files Request payload:`, {
                job_id: ocrRequest.documentId,
                url: ocrRequest.minioUrl,
            });
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(filesUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${accessToken}`,
                },
            }));
            this.logger.log(`OCR Files Response for document ${ocrRequest.documentId}:`, {
                status: response.status,
                data: response.data,
            });
            console.log(`🟢 OCR processing started successfully for document ${ocrRequest.documentId}`);
            console.log(`   Response status: ${response.status}`);
            console.log(`   Request ID: ${response.data?.requestId || response.data?.id || 'N/A'}`);
            return {
                success: true,
                message: 'Document sent for OCR processing successfully',
                requestId: response.data?.requestId || response.data?.id,
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            const statusCode = error?.response?.status;
            const responseBody = error?.response?.data || error?.response;
            const errMsg = error?.message || String(error);
            const storedError = statusCode
                ? `HTTP ${statusCode}: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`
                : errMsg;
            console.log(`🔴 OCR ERROR for document ${ocrRequest.documentId}:`);
            console.log(`   Status Code: ${statusCode || 'N/A'}`);
            console.log(`   Error Message: ${errMsg}`);
            console.log(`   Response Body:`, responseBody);
            console.log(`   Stored Error: ${storedError}`);
            console.log(`   Timestamp: ${new Date().toISOString()}`);
            this.logger.error(`Failed to send document for OCR processing: ${ocrRequest.documentId}`, {
                error: errMsg,
                stack: error?.stack,
                response: responseBody,
                status: statusCode,
            });
            try {
                if (mongoose_2.Types.ObjectId.isValid(ocrRequest.documentId)) {
                    const updated = await this.documentModel.findByIdAndUpdate(ocrRequest.documentId, {
                        $set: {
                            ocrStatus: 'failed',
                            'ocrMetadata.error': storedError,
                            'ocrMetadata.httpStatus': statusCode,
                            'ocrMetadata.response': responseBody,
                            'ocrMetadata.failedAt': new Date().toISOString(),
                            'metadata.ocr.error': storedError,
                            'metadata.ocr.httpStatus': statusCode,
                            'metadata.ocr.response': responseBody,
                            'metadata.ocr.failedAt': new Date().toISOString(),
                        }
                    }, { new: true }).exec();
                    if (updated) {
                        this.logger.log(`Document ${ocrRequest.documentId} marked as OCR failed`);
                        console.log(`✅ Document ${ocrRequest.documentId} successfully marked as OCR failed in database`);
                    }
                    else {
                        this.logger.warn(`Mark failed: no document found with id ${ocrRequest.documentId}`);
                        console.log(`⚠️  Could not find document ${ocrRequest.documentId} to mark as OCR failed`);
                    }
                }
                else {
                    this.logger.warn(`Cannot mark OCR failed: invalid document id ${ocrRequest.documentId}`);
                }
            }
            catch (dbErr) {
                this.logger.error(`Failed to mark document ${ocrRequest.documentId} as OCR failed: ${dbErr?.message || dbErr}`);
            }
            return {
                success: false,
                message: `Failed to send document for OCR: ${errMsg}`,
            };
        }
    }
    async sendDocumentForOcrAsync(ocrRequest) {
        setImmediate(async () => {
            try {
                await this.sendDocumentForOcr(ocrRequest);
            }
            catch (error) {
                this.logger.error(`Async OCR processing failed for document ${ocrRequest.documentId}:`, error);
            }
        });
    }
};
exports.OcrService = OcrService;
exports.OcrService = OcrService = OcrService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(document_schema_1.Document.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        mongoose_2.Model])
], OcrService);
//# sourceMappingURL=ocr.service.js.map