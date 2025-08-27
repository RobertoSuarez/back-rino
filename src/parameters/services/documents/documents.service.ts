import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from '../../../database/entities/document.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private documentRepo: Repository<Document>,
  ) {}

  getTermsAndConditions() {
    return this.documentRepo.findOneBy({
      typeDocument: 'terms-and-conditions',
    });
  }

  getPrivacyPolicies() {
    return this.documentRepo.findOneBy({
      typeDocument: 'privacy-policies',
    });
  }
}
