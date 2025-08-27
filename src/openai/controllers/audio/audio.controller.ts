import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AudioService } from '../../../openai/services/audio/audio.service';

@Controller('openai/audio')
export class AudioController {
  constructor(private _audioService: AudioService) {}

  @Post('speech-to-text')
  @UseInterceptors(FileInterceptor('file'))
  async speechToText(@UploadedFile() file: Express.Multer.File) {
    return await this._audioService.speechToText(file);
  }
}
