import { RetrieverResourceDto } from './create-message.dto';
export declare class UpdateMessageDto {
    readonly category?: string;
    readonly text?: string;
    readonly date?: string;
    readonly score?: number;
    readonly retrieverResources?: RetrieverResourceDto[];
}
