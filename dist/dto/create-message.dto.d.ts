import { RetrieverResource } from '../schemas/message.schema';
export declare class RetrieverResourceDto implements RetrieverResource {
    position: number;
    dataset_id: string;
    dataset_name: string;
    document_id: string;
    document_name: string;
    segment_id: string;
    score: number;
    content: string;
}
export declare class CreateMessageDto {
    readonly category: string;
    readonly text: string;
    readonly date: string;
    readonly score: number;
    readonly retrieverResources?: RetrieverResourceDto[];
}
