export class CreateTemplateDto {
  id?: string; // Optional, can be auto-generated
  name: string;
  type: string;
  subject: string;
  body: string;
  language: string;
  isActive: boolean;
  tenantId: string;
}