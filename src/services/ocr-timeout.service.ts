import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document, DocumentDocument } from '../schemas/document.schema';
import { OcrStatusService } from './ocr-status.service';

@Injectable()
export class OcrTimeoutService {
  private readonly logger = new Logger(OcrTimeoutService.name);

  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private readonly ocrStatusService: OcrStatusService,
  ) {}

  // Run every minute to check for stale processing documents
  @Cron(CronExpression.EVERY_MINUTE)
  async checkStaleProcessingDocuments() {
    this.logger.debug('Running OCR timeout check...');
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    try {
      // Find documents in 'processing' status that are original documents (not page documents)
      const processingDocs = await this.documentModel
        .find({
          ocrStatus: 'processing',
          $or: [
            { isPageDocument: { $ne: true } },
            { isPageDocument: { $exists: false } },
          ],
        })
        .exec();

      if (processingDocs.length === 0) {
        this.logger.debug('No processing documents found for timeout check');
        return;
      }

      this.logger.debug(`Found ${processingDocs.length} processing documents to check`);

      let completedCount = 0;

      for (const doc of processingDocs) {
        try {
          // Find the most recent page update for this document
          const latestPage = await this.documentModel
            .findOne({
              originalDocumentId: doc._id,
              isPageDocument: true,
            })
            .sort({ updatedAt: -1 })
            .exec();

          if (!latestPage) {
            // No pages yet, skip this document
            continue;
          }

          // Check if latest page update was >5 minutes ago
          const lastUpdateTime = new Date(latestPage.updatedAt);
          if (lastUpdateTime < fiveMinutesAgo) {
            // Check if at least one page is completed
            const hasCompletedPage = await this.documentModel.exists({
              originalDocumentId: doc._id,
              isPageDocument: true,
              ocrStatus: 'completed',
            });

            if (hasCompletedPage) {
              // Mark original as completed
              await this.ocrStatusService.markOcrCompleted(doc._id.toString());
              completedCount++;
              
              this.logger.log(
                `Marked document ${doc._id} as completed (5min timeout - has completed pages)`,
              );
            }
          }
        } catch (error) {
          this.logger.error(
            `Error processing document ${doc._id} in timeout check: ${error?.message || error}`,
          );
        }
      }

      if (completedCount > 0) {
        this.logger.log(
          `OCR timeout check completed. Marked ${completedCount} document(s) as completed`,
        );
      } else {
        this.logger.debug('OCR timeout check completed. No documents needed completion');
      }
    } catch (error) {
      this.logger.error(`Error in OCR timeout check: ${error?.message || error}`);
    }
  }
}

