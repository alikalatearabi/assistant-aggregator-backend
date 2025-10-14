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
var DocumentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const document_schema_1 = require("../schemas/document.schema");
const ocr_service_1 = require("./ocr.service");
const minio_service_1 = require("./minio.service");
let DocumentService = DocumentService_1 = class DocumentService {
    documentModel;
    ocrService;
    minioService;
    logger = new common_1.Logger(DocumentService_1.name);
    constructor(documentModel, ocrService, minioService) {
        this.documentModel = documentModel;
        this.ocrService = ocrService;
        this.minioService = minioService;
    }
    async createDocument(createDocumentDto) {
        const createdDocument = new this.documentModel({
            ...createDocumentDto,
        });
        const savedDocument = await createdDocument.save();
        this.logger.log(`Document created successfully: ${savedDocument._id}, sending to OCR service`);
        try {
            await this.ocrService.sendDocumentForOcrAsync({
                documentId: savedDocument._id.toString(),
                minioUrl: savedDocument.fileUrl,
            });
            this.logger.log(`Document ${savedDocument._id} sent to OCR service successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to send document ${savedDocument._id} to OCR service:`, error);
        }
        return savedDocument;
    }
    async findAllDocuments(query = {}) {
        const { extension, metadataUserId, filename, dateFrom, dateTo, page = 1, limit = 10, } = query;
        const filter = {};
        if (extension) {
            filter.extension = { $regex: extension, $options: 'i' };
        }
        if (metadataUserId) {
            filter['metadata.user_id'] = metadataUserId;
        }
        if (filename) {
            filter.filename = { $regex: filename, $options: 'i' };
        }
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) {
                filter.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                filter.createdAt.$lte = new Date(dateTo);
            }
        }
        const skip = (page - 1) * limit;
        const total = await this.documentModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        if (filter['metadata.user_id'] && mongoose_2.Types.ObjectId.isValid(filter['metadata.user_id'])) {
            filter['metadata.user_id'] = new mongoose_2.Types.ObjectId(filter['metadata.user_id']);
        }
        const documents = await this.documentModel
            .find(filter)
            .populate('metadata.user_id')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        return {
            documents,
            total,
            page,
            limit,
            totalPages,
        };
    }
    async findDocumentById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const document = await this.documentModel
            .findById(id)
            .populate('metadata.user_id')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async findDocumentsByUploader(uploaderId) {
        if (!mongoose_2.Types.ObjectId.isValid(uploaderId)) {
            throw new common_1.BadRequestException('Invalid uploader ID');
        }
        return this.documentModel
            .find({ 'metadata.user_id': new mongoose_2.Types.ObjectId(uploaderId) })
            .populate('metadata.user_id')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findDocumentsByExtension(extension) {
        return this.documentModel
            .find({ extension: { $regex: extension, $options: 'i' } })
            .sort({ createdAt: -1 })
            .exec();
    }
    async updateDocument(id, updateDocumentDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const updateData = { ...updateDocumentDto };
        const document = await this.documentModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .populate('metadata.user_id')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async deleteDocument(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const document = await this.documentModel
            .findByIdAndDelete(id)
            .populate('metadata.user_id')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async updateDocumentMetadata(id, metadata) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const castedMetadata = { ...metadata };
        if (castedMetadata && castedMetadata.user_id && mongoose_2.Types.ObjectId.isValid(castedMetadata.user_id)) {
            castedMetadata.user_id = new mongoose_2.Types.ObjectId(castedMetadata.user_id);
        }
        const document = await this.documentModel
            .findByIdAndUpdate(id, { $set: { metadata: castedMetadata } }, { new: true })
            .populate('metadata.user_id')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async updateRawTextFileId(id, rawTextFileId) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const document = await this.documentModel
            .findByIdAndUpdate(id, { rawTextFileId }, { new: true })
            .populate('metadata.user_id')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async submitOcrResult(documentId, extractedText, page) {
        if (!mongoose_2.Types.ObjectId.isValid(documentId)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const existingDocument = await this.documentModel.findById(documentId).exec();
        if (!existingDocument) {
            throw new common_1.NotFoundException('Document not found');
        }
        const updateData = {
            raw_text: extractedText,
            ocrStatus: 'completed',
            metadata: {
                ...(existingDocument.metadata || {}),
                ocr: {
                    ...((existingDocument.metadata && existingDocument.metadata.ocr) || {}),
                    processedAt: new Date().toISOString(),
                    textLength: extractedText.length,
                    processingCompletedBy: 'ocr-service',
                    ...(page ? { page } : {}),
                }
            }
        };
        const document = await this.documentModel
            .findByIdAndUpdate(documentId, { $set: updateData }, { new: true })
            .populate('metadata.user_id')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found after update');
        }
        return document;
    }
    async markOcrProcessing(documentId) {
        if (!mongoose_2.Types.ObjectId.isValid(documentId)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const document = await this.documentModel
            .findByIdAndUpdate(documentId, {
            ocrStatus: 'processing',
            'metadata.ocr.processingStartedAt': new Date().toISOString()
        }, { new: true })
            .populate('metadata.user_id')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async reportOcrError(params) {
        const { documentId, page, status, message } = params;
        if (!mongoose_2.Types.ObjectId.isValid(documentId)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const update = {
            ocrStatus: status,
            'metadata.ocr.error': message,
            'metadata.ocr.failedAt': new Date().toISOString(),
        };
        if (page) {
            update['metadata.ocr.page'] = page;
        }
        const document = await this.documentModel
            .findByIdAndUpdate(documentId, { $set: update }, { new: true })
            .populate('metadata.user_id')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async findDocumentsByOcrStatus(status) {
        const validStatuses = ['pending', 'processing', 'completed', 'failed'];
        if (!validStatuses.includes(status)) {
            throw new common_1.BadRequestException('Invalid OCR status. Must be one of: pending, processing, completed, failed');
        }
        return this.documentModel
            .find({ ocrStatus: status })
            .populate('metadata.user_id')
            .sort({ createdAt: -1 })
            .exec();
    }
    async searchDocuments(searchTerm) {
        const searchRegex = { $regex: searchTerm, $options: 'i' };
        return this.documentModel
            .find({
            $or: [
                { filename: searchRegex },
                { extension: searchRegex },
                { 'metadata.title': searchRegex },
                { 'metadata.owner': searchRegex },
                { 'metadata.username': searchRegex },
            ]
        })
            .populate('metadata.user_id')
            .sort({ createdAt: -1 })
            .exec();
    }
    async getDocumentStats() {
        const totalDocuments = await this.documentModel.countDocuments();
        const documentsByExtension = await this.documentModel.aggregate([
            { $group: { _id: '$extension', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const documentsByUploader = await this.documentModel.aggregate([
            { $group: { _id: '$metadata.user_id', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentDocuments = await this.documentModel.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        return {
            totalDocuments,
            documentsByExtension,
            documentsByUploader,
            recentDocuments,
        };
    }
    async getPresignedUrlForDocument(id, expires) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const doc = await this.documentModel.findById(id).exec();
        if (!doc) {
            throw new common_1.NotFoundException('Document not found');
        }
        try {
            const url = new URL(doc.fileUrl);
            const pathParts = url.pathname.replace(/^\//, '').split('/');
            const bucket = pathParts.shift();
            const objectName = pathParts.join('/');
            if (!bucket || !objectName) {
                throw new Error('Invalid MinIO fileUrl format');
            }
            const signed = await this.minioService.getPresignedUrl(bucket, objectName, expires ?? 900);
            return { url: signed };
        }
        catch (e) {
            throw new common_1.BadRequestException(`Failed to create presigned URL: ${e.message}`);
        }
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = DocumentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(document_schema_1.Document.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        ocr_service_1.OcrService,
        minio_service_1.MinioService])
], DocumentService);
//# sourceMappingURL=document.service.js.map