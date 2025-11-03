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
const dataset_schema_1 = require("../schemas/dataset.schema");
const ocr_service_1 = require("./ocr.service");
const ocr_status_service_1 = require("./ocr-status.service");
const document_page_service_1 = require("./document-page.service");
const rag_service_1 = require("../shared/rag/rag.service");
let DocumentService = DocumentService_1 = class DocumentService {
    documentModel;
    datasetModel;
    ocrService;
    ocrStatusService;
    documentPageService;
    logger = new common_1.Logger(DocumentService_1.name);
    constructor(documentModel, datasetModel, ocrService, ocrStatusService, documentPageService) {
        this.documentModel = documentModel;
        this.datasetModel = datasetModel;
        this.ocrService = ocrService;
        this.ocrStatusService = ocrStatusService;
        this.documentPageService = documentPageService;
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
            .populate('dataset')
            .exec();
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async enrichRetrieverResourcesWithDatasets(resources) {
        if (!resources || resources.length === 0) {
            return resources;
        }
        const documentIds = [...new Set(resources
                .map(r => r.document_id)
                .filter(id => id && mongoose_2.Types.ObjectId.isValid(id)))];
        if (documentIds.length === 0) {
            return resources;
        }
        const documents = await this.documentModel
            .find({ _id: { $in: documentIds.map(id => new mongoose_2.Types.ObjectId(id)) } })
            .populate('dataset')
            .exec();
        const documentDatasetMap = new Map();
        documents.forEach(doc => {
            if (doc.dataset) {
                const dataset = typeof doc.dataset === 'object' && doc.dataset !== null
                    ? doc.dataset
                    : null;
                if (dataset && dataset.dataset_name) {
                    documentDatasetMap.set(doc._id.toString(), {
                        dataset_id: dataset.dataset_id || dataset._id?.toString(),
                        dataset_name: dataset.dataset_name
                    });
                }
            }
        });
        return resources.map(resource => {
            if (!resource.dataset_name && resource.document_id) {
                const datasetInfo = documentDatasetMap.get(resource.document_id);
                if (datasetInfo) {
                    return {
                        ...resource,
                        dataset_name: datasetInfo.dataset_name,
                        dataset_id: datasetInfo.dataset_id || resource.dataset_id
                    };
                }
            }
            return resource;
        });
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
        (0, rag_service_1.sendRagDataToExternalApi)({
            raw_text: rawText,
            metadata: {
                document_id: original.metadata?.document_id || '',
                page_id: original.metadata?.page_id || '',
                user_id: original.metadata?.user_id?.toString() || '',
                title: original.metadata?.title || '',
                approved_date: original.metadata?.approved_date || '',
                effective_date: original.metadata?.effective_date || '',
                owner: original.metadata?.owner || '',
                username: original.metadata?.username || '',
                access_level: original.metadata?.access_level || '',
            }
        });
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
        return this.ocrStatusService.markOcrProcessing(documentId);
    }
    async markOcrFailed(documentId, error) {
        return this.ocrStatusService.markOcrFailed(documentId, error);
    }
    async findDocumentsByOcrStatus(status) {
        return this.ocrStatusService.findDocumentsByOcrStatus(status);
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
        return this.documentPageService.findPagesByOriginalDocument(originalDocumentId);
    }
    async findOriginalDocuments() {
        return this.documentPageService.findOriginalDocuments();
    }
    async findOriginalsWithPageCounts(opts = {}) {
        return this.documentPageService.findOriginalsWithPageCounts(opts);
    }
    async reportOcrError(errorData) {
        return this.ocrStatusService.reportOcrError(errorData);
    }
    async resetOcrData(id) {
        return this.ocrStatusService.resetOcrData(id);
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = DocumentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(document_schema_1.Document.name)),
    __param(1, (0, mongoose_1.InjectModel)(dataset_schema_1.Dataset.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        ocr_service_1.OcrService,
        ocr_status_service_1.OcrStatusService,
        document_page_service_1.DocumentPageService])
], DocumentService);
//# sourceMappingURL=document.service.js.map