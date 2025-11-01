import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document, DocumentDocument } from '../schemas/document.schema';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentQueryDto } from '../dto/document-query.dto';
import { OcrService } from './ocr.service';
import { OcrStatusService } from './ocr-status.service';
import { DocumentPageService } from './document-page.service';
import { sendRagDataToExternalApi } from './rag.service';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private readonly ocrService: OcrService,
    private readonly ocrStatusService: OcrStatusService,
    private readonly documentPageService: DocumentPageService,
  ) { }

  async createDocument(createDocumentDto: CreateDocumentDto): Promise<Document> {
    if (createDocumentDto.metadata?.user_id && !Types.ObjectId.isValid(createDocumentDto.metadata.user_id.toString())) {
      throw new BadRequestException('Invalid user ID in metadata');
    }
    const createdDocument = new this.documentModel(createDocumentDto); const savedDocument = await createdDocument.save();
    this.logger.log(`Document created successfully: ${savedDocument._id}, sending to OCR service`);
    try {
      await this.ocrService.sendDocumentForOcrAsync({
        documentId: savedDocument._id.toString(),
        minioUrl: savedDocument.fileUrl,
      });
      this.logger.log(`Document ${savedDocument._id} sent to OCR service successfully`);
    } catch (error) {
      this.logger.error(`Failed to send document ${savedDocument._id} to OCR service:`, error);
    }
    
    return savedDocument;
  }

  async findAllDocuments(query: DocumentQueryDto = {}): Promise<{
    documents: Document[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      extension,
      metadataUserId,
      filename,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};
    
    if (extension) {
      filter.extension = { $regex: extension, $options: 'i' };
    }
    
    if (metadataUserId && Types.ObjectId.isValid(metadataUserId)) {
      filter['metadata.user_id'] = new Types.ObjectId(metadataUserId);
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

  async findDocumentById(id: string): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel
      .findById(id)
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  async findDocumentsByUploader(uploaderId: string): Promise<Document[]> {
    if (!Types.ObjectId.isValid(uploaderId)) {
      throw new BadRequestException('Invalid uploader ID');
    }

    return this.documentModel
      .find({ fileUploader: new Types.ObjectId(uploaderId) })
      .populate('metadata.user_id', 'firstname lastname email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findDocumentsByExtension(extension: string): Promise<Document[]> {
    return this.documentModel
      .find({ extension: { $regex: extension, $options: 'i' } })
      .populate('metadata.user_id', 'firstname lastname email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    if (updateDocumentDto.metadata?.user_id && !Types.ObjectId.isValid(updateDocumentDto.metadata.user_id.toString())) {
      throw new BadRequestException('Invalid user ID in metadata');
    }

    const document = await this.documentModel
      .findByIdAndUpdate(id, updateDocumentDto, { new: true })
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  async deleteDocument(id: string): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel
      .findByIdAndDelete(id)
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  async updateDocumentMetadata(id: string, metadata: Record<string, any>): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        id,
        { $set: { metadata } },
        { new: true }
      )
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  async updateRawTextFileId(id: string, rawTextFileId: string): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        id,
        { rawTextFileId },
        { new: true }
      )
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  async createPageDocument(
    originalDocumentId: string,
    pageNumber: number,
    rawText: string,
    opts: { processedBy?: string } = {},
  ): Promise<Document | null> {
    if (!Types.ObjectId.isValid(originalDocumentId)) {
      this.logger.warn(`createPageDocument: invalid originalDocumentId ${originalDocumentId}`);
      return null;
    }

    const originalIdObj = new Types.ObjectId(originalDocumentId);
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
    sendRagDataToExternalApi({
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
        .findByIdAndUpdate(
          originalIdObj,
          {
            $set: {
              ocrStatus: 'processing',
              'metadata.ocr.processingStartedAt': original.metadata?.ocr?.processingStartedAt ?? processedAt,
              updatedAt: processedAt,
            },
          },
          { new: true },
        )
        .exec();
    } catch (err) {
      this.logger.warn(
        `createPageDocument: failed to mark original ${originalDocumentId} as processing: ${err?.message || err}`,
      );
    }

    return pageDoc as Document;
  }

  async submitOcrResult(documentId: string, extractedText: string, page?: number): Promise<Document> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const existingDocument = await this.documentModel.findById(documentId).exec();
    if (!existingDocument) {
      throw new NotFoundException('Document not found');
    }
    if (page && Number.isInteger(page) && page > 0) {
      const pageDocData: any = {
        filename: `${existingDocument.filename}-page-${page}`,
        fileUrl: existingDocument.fileUrl,
        extension: existingDocument.extension,
        isPageDocument: true,
        originalDocumentId: new Types.ObjectId(documentId),
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
        .findOneAndUpdate(
          { originalDocumentId: new Types.ObjectId(documentId), pageNumber: page, isPageDocument: true },
          { $set: pageDocData },
          { upsert: true, new: true }
        )
        .populate('metadata.user_id', 'firstname lastname email')
        .exec();

      const combinedText = [existingDocument.raw_text, extractedText].filter(Boolean).join('\n\n');

      const updatedOriginal = await this.documentModel
        .findByIdAndUpdate(
          documentId,
          {
            $set: {
              raw_text: combinedText,
              ocrStatus: 'processing',
              'metadata.ocr': {
                ...existingDocument.metadata?.ocr,
                processingStartedAt: existingDocument.metadata?.ocr?.processingStartedAt || new Date().toISOString(),
                textLength: (existingDocument.raw_text?.length || 0) + extractedText.length,
              }
            }
          },
          { new: true }
        )
        .populate('metadata.user_id', 'firstname lastname email')
        .exec();
      return updatedOriginal as Document;
    }

    const updateData: any = {
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
      .findByIdAndUpdate(
        documentId,
        { $set: updateData },
        { new: true }
      )
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();

    if (!document) {
      throw new NotFoundException('Document not found after update');
    }

    return document;
  }

  async markOcrProcessing(documentId: string): Promise<Document> {
    return this.ocrStatusService.markOcrProcessing(documentId);
  }

  async markOcrFailed(documentId: string, error: string): Promise<Document> {
    return this.ocrStatusService.markOcrFailed(documentId, error);
  }

  async findDocumentsByOcrStatus(status: string): Promise<Document[]> {
    return this.ocrStatusService.findDocumentsByOcrStatus(status);
  }

  async searchDocuments(searchTerm: string): Promise<Document[]> {
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

  async getDocumentStats(): Promise<{
    totalDocuments: number;
    documentsByExtension: Array<{ _id: string; count: number }>;
    documentsByUploader: Array<{ _id: string; count: number }>;
    recentDocuments: number;
  }> {
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

  async getPresignedUrlForDocument(id: string, exp?: number): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel.findById(id).exec();
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      url: document.fileUrl,
      expiresIn: exp || 3600,
    };
  }

  async findPagesByOriginalDocument(originalDocumentId: string): Promise<Document[]> {
    return this.documentPageService.findPagesByOriginalDocument(originalDocumentId);
  }

  async findOriginalDocuments(): Promise<Document[]> {
    return this.documentPageService.findOriginalDocuments();
  }

  async findOriginalsWithPageCounts(opts: { page?: number; limit?: number } = {}): Promise<{
    documents: Document[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.documentPageService.findOriginalsWithPageCounts(opts);
  }

  async reportOcrError(errorData: { documentId: string; error: string; page?: number; status?: string }): Promise<Document> {
    return this.ocrStatusService.reportOcrError(errorData);
  }

  async resetOcrData(id: string): Promise<Document> {
    return this.ocrStatusService.resetOcrData(id);
  }
}
