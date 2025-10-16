import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document, DocumentDocument } from '../schemas/document.schema';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentQueryDto } from '../dto/document-query.dto';
import { OcrService } from './ocr.service';
import { MinioService } from './minio.service';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private readonly ocrService: OcrService,
    private readonly minioService: MinioService,
  ) {}

  async createDocument(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const createdDocument = new this.documentModel({
      ...createDocumentDto,
    });
    
    const savedDocument = await createdDocument.save();
    
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

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await this.documentModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Convert metadataUserId to ObjectId if provided to ensure proper matching
    if (filter['metadata.user_id'] && Types.ObjectId.isValid(filter['metadata.user_id'])) {
      filter['metadata.user_id'] = new Types.ObjectId(filter['metadata.user_id']);
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

  async findDocumentById(id: string): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel
  .findById(id)
      .populate('metadata.user_id')
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
      .find({ 'metadata.user_id': new Types.ObjectId(uploaderId) })
      .populate('metadata.user_id')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findDocumentsByExtension(extension: string): Promise<Document[]> {
    return this.documentModel
      .find({ extension: { $regex: extension, $options: 'i' } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const updateData = { ...updateDocumentDto };

    const document = await this.documentModel
  .findByIdAndUpdate(id, updateData, { new: true })
      .populate('metadata.user_id')
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
      .populate('metadata.user_id')
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

    // If user_id provided as string, cast to ObjectId for consistency
    const castedMetadata = { ...metadata } as any;
    if (castedMetadata && castedMetadata.user_id && Types.ObjectId.isValid(castedMetadata.user_id)) {
      castedMetadata.user_id = new Types.ObjectId(castedMetadata.user_id);
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        id,
        { $set: { metadata: castedMetadata } },
        { new: true }
      )
      .populate('metadata.user_id')
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
      .populate('metadata.user_id')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  async submitOcrResult(documentId: string, extractedText: string, page?: number): Promise<Document> {
    this.logger.log(`DocumentService - Processing OCR result for document: ${documentId}, page: ${page || 1}`);
    this.logger.debug(`DocumentService - OCR parameters:`, {
      documentId,
      textLength: extractedText?.length || 0,
      page,
      hasPage: page !== undefined,
      pageType: typeof page,
    });

    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    // First check if original document exists
    const originalDocument = await this.documentModel.findById(documentId).exec();
    if (!originalDocument) {
      throw new NotFoundException('Original document not found');
    }

    const currentPage = page || 1;

    // Check if a page document already exists for this document+page combination
    const existingPageDocument = await this.documentModel.findOne({
      originalDocumentId: documentId,
      pageNumber: currentPage,
      isPageDocument: true
    }).exec();

    if (existingPageDocument) {
      // Update existing page document
      this.logger.log(`DocumentService - Updating existing page document for page ${currentPage}`);
      
      const updatedDocument = await this.documentModel
        .findByIdAndUpdate(
          existingPageDocument._id,
          {
            $set: {
              raw_text: extractedText,
              ocrStatus: 'completed',
              'metadata.ocr.processedAt': new Date().toISOString(),
              'metadata.ocr.textLength': extractedText.length,
              'metadata.ocr.processingCompletedBy': 'ocr-service',
              'metadata.ocr.pageNumber': currentPage,
            }
          },
          { new: true }
        )
        .populate('metadata.user_id')
        .exec();

      this.logger.log(`DocumentService - Updated page document: ${updatedDocument?._id} for page ${currentPage}`);
      return updatedDocument!;
    } else {
      // Create new page document
      this.logger.log(`DocumentService - Creating new page document for page ${currentPage}`);

      const pageDocument = new this.documentModel({
        filename: `${originalDocument.filename}_page_${currentPage}`,
        fileUrl: originalDocument.fileUrl,
        extension: originalDocument.extension,
        dataset: originalDocument.dataset,
        originalDocumentId: new Types.ObjectId(documentId),
        pageNumber: currentPage,
        isPageDocument: true,
        raw_text: extractedText,
        ocrStatus: 'completed',
        metadata: {
          ...(originalDocument.metadata || {}),
          ocr: {
            processedAt: new Date().toISOString(),
            textLength: extractedText.length,
            processingCompletedBy: 'ocr-service',
            pageNumber: currentPage,
          }
        }
      });

      const savedPageDocument = await pageDocument.save();
      
      this.logger.log(`DocumentService - Created new page document: ${savedPageDocument._id} for page ${currentPage}`);
      this.logger.debug(`DocumentService - Page document details:`, {
        id: savedPageDocument._id,
        filename: savedPageDocument.filename,
        originalDocumentId: savedPageDocument.originalDocumentId,
        pageNumber: savedPageDocument.pageNumber,
        textLength: savedPageDocument.raw_text?.length,
      });

      return savedPageDocument;
    }
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
          raw_text: '', // Clear any existing text when starting fresh
          'metadata.ocr.processingStartedAt': new Date().toISOString(),
          'metadata.ocr.processedPages': [], // Reset pages tracking
        },
        { new: true }
      )
      .populate('metadata.user_id')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    this.logger.log(`DocumentService - Marked document ${documentId} as processing and cleared existing OCR data`);
    
    return document;
  }

  async resetOcrData(documentId: string): Promise<Document> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        documentId,
        { 
          ocrStatus: 'pending',
          raw_text: '',
          $unset: { 'metadata.ocr': 1 } // Remove entire OCR metadata
        },
        { new: true }
      )
      .populate('metadata.user_id')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    this.logger.log(`DocumentService - Reset OCR data for document ${documentId}`);
    
    return document;
  }

  

  async reportOcrError(params: { documentId: string; page?: number; status: string; message: string }): Promise<Document> {
    const { documentId, page, status, message } = params;
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const update: any = {
      ocrStatus: status,
      'metadata.ocr.error': message,
      'metadata.ocr.failedAt': new Date().toISOString(),
    };
    if (page) {
      update['metadata.ocr.page'] = page;
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        documentId,
        { $set: update },
        { new: true }
      )
      .populate('metadata.user_id')
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
      .populate('metadata.user_id')
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
          { 'metadata.title': searchRegex },
          { 'metadata.owner': searchRegex },
          { 'metadata.username': searchRegex },
        ]
      })
      .populate('metadata.user_id')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPagesByOriginalDocument(originalDocumentId: string): Promise<Document[]> {
    if (!Types.ObjectId.isValid(originalDocumentId)) {
      throw new BadRequestException('Invalid original document ID');
    }

    return this.documentModel
      .find({
        originalDocumentId: new Types.ObjectId(originalDocumentId),
        isPageDocument: true
      })
      .populate('metadata.user_id')
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
      .populate('metadata.user_id')
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

  async getPresignedUrlForDocument(id: string, expires?: number): Promise<{ url: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const doc = await this.documentModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    // Expecting fileUrl like http://host:port/bucket/path/to/object.ext
    try {
      const url = new URL(doc.fileUrl);
      // url.pathname starts with /bucket/object...
      const pathParts = url.pathname.replace(/^\//, '').split('/');
      const bucket = pathParts.shift() as string;
      const objectName = pathParts.join('/');
      if (!bucket || !objectName) {
        throw new Error('Invalid MinIO fileUrl format');
      }
      const signed = await this.minioService.getPresignedUrl(bucket, objectName, expires ?? 900);
      return { url: signed };
    } catch (e: any) {
      throw new BadRequestException(`Failed to create presigned URL: ${e.message}`);
    }
  }
}
