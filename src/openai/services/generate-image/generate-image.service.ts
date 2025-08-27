import { Injectable } from '@nestjs/common';
// import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuid } from 'uuid';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { ConfigkeyService } from 'src/parameters/services/configkey/configkey.service';

@Injectable()
export class GenerateImageService {
  constructor(
    private _configService: ConfigService,
    private _configkeyService: ConfigkeyService,
  ) {}

  async generateImageWithDalle3(prompt: string) {
    const openai = new OpenAI({
      apiKey: await this._configkeyService.getKeyOpenAI(),
    });
    // Generamos la imagen.
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    });
    
    // Comentamos todo el código relacionado con Cloudinary
    /*
    const config = {
      cloud_name: this._configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this._configService.get('CLOUDINARY_API_KEY'),
      api_secret: this._configService.get('CLOUDINARY_API_SECRET'),
    };
    cloudinary.config(config);

    const publicId = 'dalle3' + uuid();
    const timestamp = Math.floor(Date.now() / 1000);
    const apiSecret = this._configService.get('CLOUDINARY_API_SECRET');

    // Genera la cadena de la firma
    const signature = cloudinary.utils.api_sign_request(
      { public_id: publicId, timestamp: timestamp },
      apiSecret,
    );

    // Subimos la imagen a cloudinary.
    const uploadResult = await cloudinary.uploader.upload(
      response.data[0].url,
      {
        public_id: publicId,
        timestamp: timestamp,
        signature: signature,
        api_key: this._configService.get('CLOUDINARY_API_KEY'),
      },
    );
    */

    // Devolvemos directamente la URL de la imagen generada por OpenAI
    return response.data[0].url;
  }

  async uploadImage(file: Express.Multer.File) {
    const tempFilePath = path.join(
      os.tmpdir(),
      `${Date.now()}-${file.originalname}`,
    );
    fs.writeFileSync(tempFilePath, file.buffer);

    // Comentamos todo el código relacionado con Cloudinary
    /*
    const config = {
      cloud_name: this._configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this._configService.get('CLOUDINARY_API_KEY'),
      api_secret: this._configService.get('CLOUDINARY_API_SECRET'),
    };
    cloudinary.config(config);

    const publicId = 'image' + uuid();
    const timestamp = Math.floor(Date.now() / 1000);
    const apiSecret = this._configService.get('CLOUDINARY_API_SECRET');

    // Genera la cadena de la firma
    const signature = cloudinary.utils.api_sign_request(
      { public_id: publicId, timestamp: timestamp },
      apiSecret,
    );

    // Subimos la imagen a cloudinary.
    const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
      public_id: publicId,
      timestamp: timestamp,
      signature: signature,
      api_key: this._configService.get('CLOUDINARY_API_KEY'),
    });
    return uploadResult.url;
    */
    
    // En lugar de subir a Cloudinary, simplemente devolvemos una URL local temporal
    // Esto es solo un ejemplo, en producción necesitarías implementar un servicio de almacenamiento alternativo
    return `file://${tempFilePath}`;
  }
}
