import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { DatasetsService } from './datasets.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';

@ApiTags('datasets')
@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dataset' })
  @ApiResponse({
    status: 201,
    description: 'Dataset created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        dataset_id: { type: 'string', example: 'dataset_001' },
        dataset_name: { type: 'string', example: 'Training Documents' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Dataset with this dataset_id already exists' })
  create(@Body() createDatasetDto: CreateDatasetDto) {
    return this.datasetsService.create(createDatasetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all datasets' })
  @ApiResponse({
    status: 200,
    description: 'List of all datasets',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          dataset_id: { type: 'string', example: 'dataset_001' },
          dataset_name: { type: 'string', example: 'Training Documents' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  findAll() {
    return this.datasetsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a dataset by ID' })
  @ApiParam({ name: 'id', description: 'Dataset MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Dataset found',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        dataset_id: { type: 'string', example: 'dataset_001' },
        dataset_name: { type: 'string', example: 'Training Documents' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid dataset ID' })
  @ApiResponse({ status: 404, description: 'Dataset not found' })
  findOne(@Param('id') id: string) {
    return this.datasetsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dataset' })
  @ApiParam({ name: 'id', description: 'Dataset MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Dataset updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        dataset_id: { type: 'string', example: 'dataset_001' },
        dataset_name: { type: 'string', example: 'Updated Training Documents' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Dataset not found' })
  @ApiResponse({ status: 409, description: 'Dataset with this dataset_id already exists' })
  update(@Param('id') id: string, @Body() updateDatasetDto: UpdateDatasetDto) {
    return this.datasetsService.update(id, updateDatasetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a dataset' })
  @ApiParam({ name: 'id', description: 'Dataset MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Dataset deleted successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        dataset_id: { type: 'string', example: 'dataset_001' },
        dataset_name: { type: 'string', example: 'Training Documents' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid dataset ID' })
  @ApiResponse({ status: 404, description: 'Dataset not found' })
  remove(@Param('id') id: string) {
    return this.datasetsService.remove(id);
  }
}

