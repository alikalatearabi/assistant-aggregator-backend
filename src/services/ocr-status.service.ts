import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document, DocumentDocument } from '../schemas/document.schema';

@Injectable()
export class OcrStatusService {
  private readonly logger = new Logger(OcrStatusService.name);

  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
  ) {}

  async markOcrProcessing(documentId: string): Promise<Document> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        documentId,
        { 
          $set: {
            ocrStatus: 'processing',
            'metadata.ocr.processingStartedAt': new Date().toISOString()
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

  async markOcrFailed(documentId: string, error: string): Promise<Document> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        documentId,
        { 
          $set: {
            ocrStatus: 'failed',
            'metadata.ocr.error': error,
            'metadata.ocr.failedAt': new Date().toISOString()
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

  async reportOcrError(errorData: { documentId: string; error: string; page?: number; status?: string }): Promise<Document> {
    if (!Types.ObjectId.isValid(errorData.documentId)) {
      throw new BadRequestException('Invalid document ID');
    }

    const updateData: any = {
      $set: {
        ocrStatus: errorData.status || 'failed',
        'metadata.ocr.error': errorData.error,
        'metadata.ocr.failedAt': new Date().toISOString(),
      }
    };
    
    if (errorData.page) {
      updateData.$set['metadata.ocr.failedPage'] = errorData.page;
    }

    const document = await this.documentModel
      .findByIdAndUpdate(
        errorData.documentId,
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
          $set: {
            ocrStatus: 'pending'
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
}

