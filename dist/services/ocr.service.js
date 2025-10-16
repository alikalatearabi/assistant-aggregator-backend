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
        const baseUrl = this.configService.get('OCR_API_URL_BASE') || 'http://78.39.182.65:8005';
        const authUrl = `${baseUrl}/authorize`;
        const filesUrl = `${baseUrl}/files`;
        try {
            this.logger.log(`Sending document for OCR processing: ${ocrRequest.documentId}`);
            const username = this.configService.get('OCR_USERNAME') || 'user1';
            const password = this.configService.get('OCR_PASSWORD') || 'pass1';
            const authPayload = {
                user_id: username,
                password,
            };
            this.logger.debug(`OCR Auth Request payload:`, { user_id: username, password: '[REDACTED]' });
            const authResponse = await (0, rxjs_1.firstValueFrom)(this.httpService.post(authUrl, authPayload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            }));
            const accessToken = authResponse.data?.access_token || authResponse.data?.accessToken;
            const refreshToken = authResponse.data?.refresh_token || authResponse.data?.refreshToken;
            if (!accessToken) {
                throw new Error('OCR authorization failed: access_token not present in response');
            }
            const requestPayload = {
                job_id: ocrRequest.documentId,
                url: ocrRequest.minioUrl,
            };
            this.logger.debug(`OCR Files Request payload:`, requestPayload);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(filesUrl, requestPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                timeout: 10000,
            }));
            this.logger.log(`OCR Files Response for document ${ocrRequest.documentId}:`, {
                status: response.status,
                data: response.data,
            });
            return {
                success: true,
                message: 'Document sent for OCR processing successfully',
                requestId: response.data?.requestId || response.data?.id,
                accessToken,
                refreshToken,
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