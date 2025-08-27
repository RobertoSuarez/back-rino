import { Body, Controller, Post } from '@nestjs/common';
import { GenerateImageService } from '../../../openai/services/generate-image/generate-image.service';

@Controller('openai/images')
export class ImagesController {
  constructor(private readonly _generateImageService: GenerateImageService) {}

  @Post()
  async generateImage(@Body() payload: any) {
    const url = await this._generateImageService.generateImageWithDalle3(
      payload.prompt,
    );
    return {
      url,
    };
  }
}
