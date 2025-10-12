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
var OcrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let OcrService = OcrService_1 = class OcrService {
    configService;
    httpService;
    logger = new common_1.Logger(OcrService_1.name);
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
    }
    async sendDocumentForOcr(ocrRequest) {
        const ocrApiUrl = this.configService.get('OCR_API_URL') || 'https://api.example.com/ocr/process';
        try {
            this.logger.log(`Sending document for OCR processing: ${ocrRequest.documentId}`);
            const requestPayload = {
                document_id: ocrRequest.documentId,
                file_url: ocrRequest.minioUrl,
            };
            this.logger.debug(`OCR API Request payload:`, requestPayload);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(ocrApiUrl, requestPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.configService.get('OCR_API_KEY') || 'mock-api-key'}`,
                },
                timeout: 10000,
            }));
            this.logger.log(`OCR API Response for document ${ocrRequest.documentId}:`, {
                status: response.status,
                data: response.data,
            });
            return {
                success: true,
                message: 'Document sent for OCR processing successfully',
                requestId: response.data?.requestId || response.data?.id,
            };
        }
        catch (error) {
            this.logger.error(`Failed to send document for OCR processing: ${ocrRequest.documentId}`, {
                error: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status,
            });
            return {
                success: false,
                message: `Failed to send document for OCR: ${error.message}`,
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
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], OcrService);
//# sourceMappingURL=ocr.service.js.map