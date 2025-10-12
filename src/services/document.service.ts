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
    // Validate file uploader ID
    if (!Types.ObjectId.isValid(createDocumentDto.fileUploader.toString())) {
      throw new BadRequestException('Invalid file uploader ID');
    }

    const createdDocument = new this.documentModel({
      ...createDocumentDto,
      fileUploader: new Types.ObjectId(createDocumentDto.fileUploader.toString()),
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
      fileUploader,
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
    
    if (fileUploader && Types.ObjectId.isValid(fileUploader)) {
      filter.fileUploader = new Types.ObjectId(fileUploader);
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
      .populate('fileUploader', 'firstname lastname email')
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
      .populate('fileUploader', 'firstname lastname email')
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
      .populate('fileUploader', 'firstname lastname email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findDocumentsByExtension(extension: string): Promise<Document[]> {
    return this.documentModel
      .find({ extension: { $regex: extension, $options: 'i' } })
      .populate('fileUploader', 'firstname lastname email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    // Validate file uploader ID if provided
    if (updateDocumentDto.fileUploader && !Types.ObjectId.isValid(updateDocumentDto.fileUploader.toString())) {
      throw new BadRequestException('Invalid file uploader ID');
    }

    const updateData = { ...updateDocumentDto };
    if (updateDocumentDto.fileUploader) {
      updateData.fileUploader = new Types.ObjectId(updateDocumentDto.fileUploader.toString());
    }

    const document = await this.documentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('fileUploader', 'firstname lastname email')
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
      .populate('fileUploader', 'firstname lastname email')
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
      .populate('fileUploader', 'firstname lastname email')
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
      .populate('fileUploader', 'firstname lastname email')
      .exec();
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    return document;
  }

  async submitOcrResult(documentId: string, extractedText: string): Promise<Document> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    // First check if document exists
    const existingDocument = await this.documentModel.findById(documentId).exec();
    if (!existingDocument) {
      throw new NotFoundException('Document not found');
    }

    // Prepare update data with automatic metadata generation
    const updateData: any = {
      extractedText: extractedText,
      ocrStatus: 'completed',
      ocrMetadata: {
        ...existingDocument.ocrMetadata,
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
      .populate('fileUploader', 'firstname lastname email')
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
      .populate('fileUploader', 'firstname lastname email')
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
          'ocrMetadata.error': error,
          'ocrMetadata.failedAt': new Date().toISOString()
        },
        { new: true }
      )
      .populate('fileUploader', 'firstname lastname email')
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
      .populate('fileUploader', 'firstname lastname email')
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
      .populate('fileUploader', 'firstname lastname email')
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
}
