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

  async createDocument(createDocumentDto: CreateDocumentDto): Promise<DocumentDocument> {
    return this.create(createDocumentDto);
  }

  async create(createDocumentDto: CreateDocumentDto): Promise<DocumentDocument> {
    // Validate ObjectId format for metadata.user_id if provided
    if (createDocumentDto.metadata?.user_id && !Types.ObjectId.isValid(createDocumentDto.metadata.user_id.toString())) {
      throw new BadRequestException('Invalid user_id ObjectId format');
    }

    const documentData = {
      ...createDocumentDto,
      // Ensure metadata.user_id is properly converted to ObjectId if provided
      metadata: createDocumentDto.metadata ? {
        ...createDocumentDto.metadata,
        user_id: createDocumentDto.metadata.user_id ? new Types.ObjectId(createDocumentDto.metadata.user_id.toString()) : undefined
      } : {}
    };
    
    const document = new this.documentModel(documentData);
    return await document.save();
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
      .find({ 'metadata.user_id': new Types.ObjectId(uploaderId) })
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

    const updateData: any = { ...updateDocumentDto };
    if (updateDocumentDto.metadata?.user_id) {
      updateData.metadata = {
        ...updateDocumentDto.metadata,
        user_id: new Types.ObjectId(updateDocumentDto.metadata.user_id)
      };
    }

    const document = await this.documentModel
      .findByIdAndUpdate(id, updateData, { new: true })
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

  async submitOcrResult(documentId: string, extractedText: string, page?: number): Promise<Document> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    // First check if document exists
    const existingDocument = await this.documentModel.findById(documentId).exec();
    if (!existingDocument) {
      throw new NotFoundException('Document not found');
    }

    if (page !== undefined) {
      // Create a separate page document
      const pageDocumentData = {
        filename: `${existingDocument.filename}_page_${page}`,
        fileUrl: existingDocument.fileUrl, // Same file URL, different page content
        extension: existingDocument.extension,
        dataset: existingDocument.dataset,
        originalDocumentId: new Types.ObjectId(documentId),
        pageNumber: page,
        isPageDocument: true,
        raw_text: extractedText,
        ocrStatus: 'completed',
        metadata: {
          ...existingDocument.metadata,
          ocr: {
            processedAt: new Date().toISOString(),
            textLength: extractedText.length,
            processingCompletedBy: 'ocr-service',
            pageNumber: page,
          },
        },
      };

      const pageDocument = new this.documentModel(pageDocumentData);
      return await pageDocument.save();
    } else {
      // Update the original document (legacy behavior)
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

      // Update the document
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
          'metadata.ocr.processingStartedAt': new Date().toISOString()
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
          'metadata.ocr.error': error,
          'metadata.ocr.failedAt': new Date().toISOString()
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

  async getPresignedUrlForDocument(id: string, expires?: number): Promise<{ url: string }> {
    // This method should generate a pre-signed URL for document access
    // For now, return the direct file URL (implement MinIO pre-signed URL logic later)
    const document = await this.findDocumentById(id);
    return { url: document.fileUrl };
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
          { isPageDocument: false },
          { isPageDocument: { $exists: false } }
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

  async reportOcrError(errorData: {
    documentId: string;
    page?: number;
    status: string;
    message: string;
  }): Promise<Document> {
    if (!Types.ObjectId.isValid(errorData.documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    // Clear any existing OCR metadata and set new error state
    const updateData: any = {
      ocrStatus: 'failed',
      'metadata.ocr': {
        error: errorData.message,
        failedAt: new Date().toISOString(),
      },
    };

    // Only add page information if it's explicitly provided and meaningful
    if (errorData.page !== undefined && errorData.page > 0) {
      updateData['metadata.ocr'].failedPage = errorData.page;
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        errorData.documentId,
        { $set: updateData },
        { new: true }
      )
      .populate('metadata.user_id', 'firstname lastname email')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  async resetOcrData(documentId: string): Promise<Document> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const updateData: any = {
      ocrStatus: 'pending',
      raw_text: '',
      $unset: {
        'metadata.ocr': ''
      }
    };

    const document = await this.documentModel
      .findByIdAndUpdate(
        documentId,
        updateData,
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
