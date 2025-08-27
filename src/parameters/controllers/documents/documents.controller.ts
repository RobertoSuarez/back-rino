import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { DocumentDto } from '../../../parameters/dtos/document.dto';
import { DocumentsService } from '../../../parameters/services/documents/documents.service';

@ApiTags('Documentos')
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get('terms-and-conditions')
  @ApiOperation({ summary: 'Recupera el documento de términos y condiciones' })
  getTermsAndConditions() {
    return plainToClass(
      DocumentDto,
      this.documentsService.getTermsAndConditions(),
    );
  }

  @Get('privacy-policies')
  @ApiOperation({ summary: 'Recupera el documento de políticas de privacidad' })
  getPrivacyPolicies() {
    return plainToClass(
      DocumentDto,
      this.documentsService.getPrivacyPolicies(),
    );
  }
}
