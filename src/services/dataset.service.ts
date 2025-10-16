import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dataset, DatasetDocument } from '../schemas/dataset.schema';
import { CreateDatasetDto } from '../dto/create-dataset.dto';
import { UpdateDatasetDto } from '../dto/update-dataset.dto';

@Injectable()
export class DatasetService {
  constructor(
    @InjectModel(Dataset.name) private datasetModel: Model<DatasetDocument>,
  ) {}

  async create(createDatasetDto: CreateDatasetDto): Promise<Dataset> {
    try {
      const createdDataset = new this.datasetModel(createDatasetDto);
      return await createdDataset.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Dataset with this dataset_id already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Dataset[]> {
    return this.datasetModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Dataset> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid dataset ID');
    }

    const dataset = await this.datasetModel.findById(id).exec();
    if (!dataset) {
      throw new NotFoundException('Dataset not found');
    }
    
    return dataset;
  }

  async update(id: string, updateDatasetDto: UpdateDatasetDto): Promise<Dataset> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid dataset ID');
    }

    try {
      const dataset = await this.datasetModel
        .findByIdAndUpdate(id, updateDatasetDto, { new: true })
        .exec();
      
      if (!dataset) {
        throw new NotFoundException('Dataset not found');
      }
      
      return dataset;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Dataset with this dataset_id already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Dataset> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid dataset ID');
    }

    const dataset = await this.datasetModel.findByIdAndDelete(id).exec();
    if (!dataset) {
      throw new NotFoundException('Dataset not found');
    }
    
    return dataset;
  }
}