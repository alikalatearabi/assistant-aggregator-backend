import { DocumentMetadataDto } from './document-metadata.dto';
export declare class UpdateDocumentDto {
    readonly filename?: string;
    readonly fileUrl?: string;
    readonly extension?: string;
    readonly rawTextFileId?: string;
    readonly metadata?: DocumentMetadataDto;
}
