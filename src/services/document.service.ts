import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document, DocumentDocument } from '../schemas/document.schema';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentQueryDto } from '../dto/document-query.dto';
import { OcrService } from './ocr.service';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private readonly ocrService: OcrService,
  ) {}

  async createDocument(createDocumentDto: CreateDocumentDto): Promise<Document> {
    // Validate user ID in metadata if provided
    if (createDocumentDto.metadata?.user_id && !Types.ObjectId.isValid(createDocumentDto.metadata.user_id.toString())) {
      throw new BadRequestException('Invalid user ID in metadata');
    }

    const createdDocument = new this.documentModel(createDocumentDto);    const savedDocument = await createdDocument.save();
    
    // Send document to OCR service asynchronously (fire and forget)
    this.logger.log(`Document created successfully: ${savedDocument._id}, sending to OCR service`);
    
    try {
      await this.ocrService.sendDocumentForOcrAsync({
        documentId: savedDocument._id.toString(),
        minioUrl: savedDocument.fileUrl,
      });
      
      this.logger.log(`Document ${savedDocument._id} sent to OCR service successfully`);
    } catch (error) {
      // Log error but don't fail document creation
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

    // Build filter object
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

    // Calculate pagination
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

    // Validate user ID in metadata if provided
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

  /**
   * Create or update a page document for an original document.
   * This will NOT append the page text to the original.raw_text.
   * It will set the original's ocrStatus to 'processing' (best-effort) and
   * return the page document.
   */
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

    const pageDoc = await this.documentModel
      .findOneAndUpdate(pageFilter, pageUpdate, { upsert: true, new: true, setDefaultsOnInsert: true })
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();

    // Best-effort: mark original as processing but DO NOT change original.raw_text
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

    // First check if document exists
    const existingDocument = await this.documentModel.findById(documentId).exec();
    if (!existingDocument) {
      throw new NotFoundException('Document not found');
    }
    // If this payload is for a specific page, create/update a page document and
    // append the page text to the original document. Keep the original marked
    // as 'processing' while pages are being submitted.
    if (page && Number.isInteger(page) && page > 0) {
      // Upsert a page document for this page
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

      // Append the page text to the original document's raw_text (preserve existing)
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

    // No page provided: treat this as a full-document OCR result (complete)
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
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        documentId,
        { 
          ocrStatus: 'processing',
          'ocrMetadata.processingStartedAt': new Date().toISOString()
        },
        { new: true }
      )
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  async markOcrFailed(documentId: string, error: string): Promise<Document> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        documentId,
        { 
          ocrStatus: 'failed',
          $set: {
            'ocrMetadata.error': error,
            'ocrMetadata.failedAt': new Date().toISOString(),
            'metadata.ocr.error': error,
            'metadata.ocr.failedAt': new Date().toISOString(),
          }
        },
        { new: true }
      )
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  async findDocumentsByOcrStatus(status: string): Promise<Document[]> {
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid OCR status. Must be one of: pending, processing, completed, failed');
    }

    return this.documentModel
      .find({ ocrStatus: status })
      .populate('metadata.user_id', 'firstname lastname email')
      .sort({ createdAt: -1 })
      .exec();
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
    if (!Types.ObjectId.isValid(originalDocumentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    return this.documentModel
      .find({ 
        originalDocumentId: new Types.ObjectId(originalDocumentId),
        isPageDocument: true 
      })
      .populate('metadata.user_id', 'firstname lastname email')
      .sort({ pageNumber: 1 })
      .exec();
  }

  async findOriginalDocuments(): Promise<Document[]> {
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

  /**
   * Return original documents (not page documents) along with a count of their pages.
   * Supports simple pagination via page & limit.
   */
  async findOriginalsWithPageCounts(opts: { page?: number; limit?: number } = {}): Promise<{
    documents: Document[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = opts.page && opts.page > 0 ? Math.floor(opts.page) : 1;
    const limit = opts.limit && opts.limit > 0 ? Math.floor(opts.limit) : 50;
    const skip = (page - 1) * limit;

    // Match originals (not page documents)
    const match: any = {
      $or: [
        { isPageDocument: { $ne: true } },
        { isPageDocument: { $exists: false } },
      ],
    };

    // Total count of original documents for pagination
    const total = await this.documentModel.countDocuments(match as any);
    const totalPages = Math.ceil(total / limit);

    // Aggregation: lookup pages and compute pageCount
    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: this.documentModel.collection.name,
          localField: '_id',
          foreignField: 'originalDocumentId',
          as: 'pages',
        },
      },
      {
        $addFields: {
          pageCount: { $size: { $ifNull: ['$pages', []] } },
        },
      },
      { $project: { pages: 0 } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const aggResults = await this.documentModel.aggregate(pipeline).exec();

    // Populate metadata.user_id on aggregation results
    const populated = await this.documentModel.populate(aggResults, { path: 'metadata.user_id', select: 'firstname lastname email' });

    return {
      documents: populated as Document[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async reportOcrError(errorData: { documentId: string; error: string; page?: number; status?: string }): Promise<Document> {
    if (!Types.ObjectId.isValid(errorData.documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        errorData.documentId,
        { 
          ocrStatus: errorData.status || 'failed',
          'metadata.ocr.error': errorData.error,
          'metadata.ocr.failedAt': new Date().toISOString(),
          ...(errorData.page && { 'metadata.ocr.failedPage': errorData.page }),
        },
        { new: true }
      )
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  async resetOcrData(id: string): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    // Delete any page documents if this is an original document
    await this.documentModel.deleteMany({ 
      originalDocumentId: new Types.ObjectId(id),
      isPageDocument: true 
    });

    const document = await this.documentModel
      .findByIdAndUpdate(
        id,
        { 
          $unset: { 
            raw_text: 1,
            'metadata.ocr': 1 
          },
          ocrStatus: 'pending'
        },
        { new: true }
      )
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }
}
