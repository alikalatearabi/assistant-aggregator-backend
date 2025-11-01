import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DatasetDocument = Dataset & Document;

@Schema({ timestamps: true })
export class Dataset {
  @Prop({ required: true, unique: true })
  dataset_id: string;

  @Prop({ required: true })
  dataset_name: string;
}

export const DatasetSchema = SchemaFactory.createForClass(Dataset);

// Add index for better performance
DatasetSchema.index({ dataset_id: 1 });
DatasetSchema.index({ dataset_name: 1 });

