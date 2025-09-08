// src/events/dto/incoming-event.dto.ts
import { IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EventMetadata {
  @IsString()
  event_id: string;

  @IsString()
  event_type: string;

  @IsString()
  @IsOptional()
  event_version?: string;

  @IsString()
  created_at: string;

  @IsString()
  source: string;

  @IsString()
  tenant_id: string;
}

export class IncomingEventDto {
  @ValidateNested()
  @Type(() => EventMetadata)
  metadata: EventMetadata;

  @IsObject()
  data: Record<string, any>;
}