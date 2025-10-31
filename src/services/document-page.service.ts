import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document, DocumentDocument } from '../schemas/document.schema';

@Injectable()
export class DocumentPageService {
  private readonly logger = new Logger(DocumentPageService.name);

  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
  ) {}

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

    const match: any = {
      $or: [
        { isPageDocument: { $ne: true } },
        { isPageDocument: { $exists: false } },
      ],
    };

    const total = await this.documentModel.countDocuments(match as any);
    const totalPages = Math.ceil(total / limit);

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

    const populated = await this.documentModel.populate(aggResults, { path: 'metadata.user_id', select: 'firstname lastname email' });

    return {
      documents: populated as Document[],
      total,
      page,
      limit,
      totalPages,
    };
  }
}

