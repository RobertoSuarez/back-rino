import { Injectable, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuid } from 'uuid';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as sharp from 'sharp';
import * as streamifier from 'streamifier';
import { ConfigkeyService } from 'src/parameters/services/configkey/configkey.service';

@Injectable()
export class GenerateImageService implements OnModuleInit {
  constructor(
    private _configService: ConfigService,
    private _configkeyService: ConfigkeyService,
  ) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this._configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this._configService.get('CLOUDINARY_API_KEY'),
      api_secret: this._configService.get('CLOUDINARY_API_SECRET'),
    });
  }

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
    
    const imageUrl = response.data[0].url;

    // Subimos la imagen a cloudinary para persistencia.
    try {
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: 'ia-generadas',
        public_id: 'ia-' + uuid(),
      });
      return uploadResult.secure_url;
    } catch (error) {
      console.error('❌ Error al subir imagen de DALL-E a Cloudinary:', error);
      return imageUrl; // Fallback a la URL temporal de OpenAI
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'cursos/portadas',
  ): Promise<string> {
    try {
      // 1. Optimizar imagen con sharp
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      // 2. Subir a Cloudinary usando un stream
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            public_id: `${folder.split('/').pop()}-${Date.now()}-${uuid().substring(0, 8)}`,
            format: 'webp',
          },
          (error, result) => {
            if (error) {
              console.error('❌ Error en el stream de Cloudinary:', error);
              return reject(error);
            }
            console.log(`✅ Imagen subida a Cloudinary en carpeta [${folder}]: ${result.secure_url}`);
            resolve(result.secure_url);
          },
        );

        streamifier.createReadStream(optimizedBuffer).pipe(uploadStream);
      });
    } catch (error) {
      console.error('❌ Error general en uploadImage:', error);
      throw new Error('No se pudo procesar o subir la imagen');
    }
  }
}
