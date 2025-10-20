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
let DocumentService = DocumentService_1 = class DocumentService {
    documentModel;
    ocrService;
    logger = new common_1.Logger(DocumentService_1.name);
    constructor(documentModel, ocrService) {
        this.documentModel = documentModel;
        this.ocrService = ocrService;
    }
    async createDocument(createDocumentDto) {
        if (createDocumentDto.metadata?.user_id && !mongoose_2.Types.ObjectId.isValid(createDocumentDto.metadata.user_id.toString())) {
            throw new common_1.BadRequestException('Invalid user ID in metadata');
        }
        const createdDocument = new this.documentModel(createDocumentDto);
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
        if (metadataUserId && mongoose_2.Types.ObjectId.isValid(metadataUserId)) {
            filter['metadata.user_id'] = new mongoose_2.Types.ObjectId(metadataUserId);
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
        const documents = await this.documentModel
            .find(filter)
            .populate('metadata.user_id', 'firstname lastname email')
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
            .populate('metadata.user_id', 'firstname lastname email')
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
            .find({ fileUploader: new mongoose_2.Types.ObjectId(uploaderId) })
            .populate('metadata.user_id', 'firstname lastname email')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findDocumentsByExtension(extension) {
        return this.documentModel
            .find({ extension: { $regex: extension, $options: 'i' } })
            .populate('metadata.user_id', 'firstname lastname email')
            .sort({ createdAt: -1 })
            .exec();
    }
    async updateDocument(id, updateDocumentDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        if (updateDocumentDto.metadata?.user_id && !mongoose_2.Types.ObjectId.isValid(updateDocumentDto.metadata.user_id.toString())) {
            throw new common_1.BadRequestException('Invalid user ID in metadata');
        }
        const document = await this.documentModel
            .findByIdAndUpdate(id, updateDocumentDto, { new: true })
            .populate('metadata.user_id', 'firstname lastname email')
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
            .populate('metadata.user_id', 'firstname lastname email')
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
        const document = await this.documentModel
            .findByIdAndUpdate(id, { $set: { metadata } }, { new: true })
            .populate('metadata.user_id', 'firstname lastname email')
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
            .populate('metadata.user_id', 'firstname lastname email')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async createPageDocument(originalDocumentId, pageNumber, rawText, opts = {}) {
        if (!mongoose_2.Types.ObjectId.isValid(originalDocumentId)) {
            this.logger.warn(`createPageDocument: invalid originalDocumentId ${originalDocumentId}`);
            return null;
        }
        const originalIdObj = new mongoose_2.Types.ObjectId(originalDocumentId);
        const original = await this.documentModel.findById(originalIdObj).exec();
        if (!original) {
            this.logger.warn(`createPageDocument: original document not found ${originalDocumentId}`);
            return null;
        }
        const processedAt = new Date().toISOString();
        const pageFilter = {
            originalDocumentId: originalIdObj,
            pageNumber,
            isPageDocument: true,
        };
        const pageUpdate = {
            $set: {
                originalDocumentId: originalIdObj,
                pageNumber,
                isPageDocument: true,
                filename: original.filename,
                fileUrl: original.fileUrl,
                extension: original.extension,
                raw_text: rawText,
                ocrStatus: 'completed',
                updatedAt: processedAt,
                'metadata.ocr.processedAt': processedAt,
                'metadata.ocr.textLength': rawText?.length ?? 0,
                'metadata.ocr.processingCompletedBy': opts.processedBy ?? 'ocr-service',
            },
            $setOnInsert: {
                createdAt: processedAt,
            },
        };
        const pageDoc = await this.documentModel
            .findOneAndUpdate(pageFilter, pageUpdate, { upsert: true, new: true, setDefaultsOnInsert: true })
            .populate('metadata.user_id', 'firstname lastname email')
            .exec();
        try {
            await this.documentModel
                .findByIdAndUpdate(originalIdObj, {
                $set: {
                    ocrStatus: 'processing',
                    'metadata.ocr.processingStartedAt': original.metadata?.ocr?.processingStartedAt ?? processedAt,
                    updatedAt: processedAt,
                },
            }, { new: true })
                .exec();
        }
        catch (err) {
            this.logger.warn(`createPageDocument: failed to mark original ${originalDocumentId} as processing: ${err?.message || err}`);
        }
        return pageDoc;
    }
    async submitOcrResult(documentId, extractedText, page) {
        if (!mongoose_2.Types.ObjectId.isValid(documentId)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const existingDocument = await this.documentModel.findById(documentId).exec();
        if (!existingDocument) {
            throw new common_1.NotFoundException('Document not found');
        }
        if (page && Number.isInteger(page) && page > 0) {
            const pageDocData = {
                filename: `${existingDocument.filename}-page-${page}`,
                fileUrl: existingDocument.fileUrl,
                extension: existingDocument.extension,
                isPageDocument: true,
                originalDocumentId: new mongoose_2.Types.ObjectId(documentId),
                pageNumber: page,
                raw_text: extractedText,
                ocrStatus: 'completed',
                metadata: {
                    ...existingDocument.metadata,
                    ocr: {
                        processedAt: new Date().toISOString(),
                        textLength: extractedText.length,
                        processingCompletedBy: 'ocr-service',
                    }
                }
            };
            const pageDocument = await this.documentModel
                .findOneAndUpdate({ originalDocumentId: new mongoose_2.Types.ObjectId(documentId), pageNumber: page, isPageDocument: true }, { $set: pageDocData }, { upsert: true, new: true })
                .populate('metadata.user_id', 'firstname lastname email')
                .exec();
            const combinedText = [existingDocument.raw_text, extractedText].filter(Boolean).join('\n\n');
            const updatedOriginal = await this.documentModel
                .findByIdAndUpdate(documentId, {
                $set: {
                    raw_text: combinedText,
                    ocrStatus: 'processing',
                    'metadata.ocr': {
                        ...existingDocument.metadata?.ocr,
                        processingStartedAt: existingDocument.metadata?.ocr?.processingStartedAt || new Date().toISOString(),
                        textLength: (existingDocument.raw_text?.length || 0) + extractedText.length,
                    }
                }
            }, { new: true })
                .populate('metadata.user_id', 'firstname lastname email')
                .exec();
            return updatedOriginal;
        }
        const updateData = {
            raw_text: extractedText,
            ocrStatus: 'completed',
            'metadata.ocr': {
                ...existingDocument.metadata?.ocr,
                processedAt: new Date().toISOString(),
                textLength: extractedText.length,
                processingCompletedBy: 'ocr-service',
            },
        };
        const document = await this.documentModel
            .findByIdAndUpdate(documentId, { $set: updateData }, { new: true })
            .populate('metadata.user_id', 'firstname lastname email')
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
            'ocrMetadata.processingStartedAt': new Date().toISOString()
        }, { new: true })
            .populate('metadata.user_id', 'firstname lastname email')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async markOcrFailed(documentId, error) {
        if (!mongoose_2.Types.ObjectId.isValid(documentId)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const document = await this.documentModel
            .findByIdAndUpdate(documentId, {
            ocrStatus: 'failed',
            $set: {
                'ocrMetadata.error': error,
                'ocrMetadata.failedAt': new Date().toISOString(),
                'metadata.ocr.error': error,
                'metadata.ocr.failedAt': new Date().toISOString(),
            }
        }, { new: true })
            .populate('metadata.user_id', 'firstname lastname email')
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
            .populate('metadata.user_id', 'firstname lastname email')
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
                { 'metadata.tags': searchRegex },
                { 'metadata.description': searchRegex },
            ]
        })
            .populate('metadata.user_id', 'firstname lastname email')
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
            { $group: { _id: '$fileUploader', count: { $sum: 1 } } },
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
    async getPresignedUrlForDocument(id, exp) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const document = await this.documentModel.findById(id).exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return {
            url: document.fileUrl,
            expiresIn: exp || 3600,
        };
    }
    async findPagesByOriginalDocument(originalDocumentId) {
        if (!mongoose_2.Types.ObjectId.isValid(originalDocumentId)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        return this.documentModel
            .find({
            originalDocumentId: new mongoose_2.Types.ObjectId(originalDocumentId),
            isPageDocument: true
        })
            .populate('metadata.user_id', 'firstname lastname email')
            .sort({ pageNumber: 1 })
            .exec();
    }
    async findOriginalDocuments() {
        return this.documentModel
            .find({
            $or: [
                { isPageDocument: { $ne: true } },
                { isPageDocument: { $exists: false } }
            ]
        })
            .populate('metadata.user_id', 'firstname lastname email')
            .sort({ createdAt: -1 })
            .exec();
    }
    async reportOcrError(errorData) {
        if (!mongoose_2.Types.ObjectId.isValid(errorData.documentId)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        const document = await this.documentModel
            .findByIdAndUpdate(errorData.documentId, {
            ocrStatus: errorData.status || 'failed',
            'metadata.ocr.error': errorData.error,
            'metadata.ocr.failedAt': new Date().toISOString(),
            ...(errorData.page && { 'metadata.ocr.failedPage': errorData.page }),
        }, { new: true })
            .populate('metadata.user_id', 'firstname lastname email')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async resetOcrData(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid document ID');
        }
        await this.documentModel.deleteMany({
            originalDocumentId: new mongoose_2.Types.ObjectId(id),
            isPageDocument: true
        });
        const document = await this.documentModel
            .findByIdAndUpdate(id, {
            $unset: {
                raw_text: 1,
                'metadata.ocr': 1
            },
            ocrStatus: 'pending'
        }, { new: true })
            .populate('metadata.user_id', 'firstname lastname email')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = DocumentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(document_schema_1.Document.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        ocr_service_1.OcrService])
], DocumentService);
//# sourceMappingURL=document.service.js.map