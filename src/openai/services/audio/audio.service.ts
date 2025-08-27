import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';
import { ConfigkeyService } from 'src/parameters/services/configkey/configkey.service';

@Injectable()
export class AudioService {
  constructor(private _configkeyService: ConfigkeyService) {}

  async speechToText(file: Express.Multer.File) {
    const openai = new OpenAI({
      apiKey: await this._configkeyService.getKeyOpenAI(),
    });
    const tempFilePath = path.join(
      os.tmpdir(),
      `${Date.now()}-${file.originalname}`,
    );
    fs.writeFileSync(tempFilePath, file.buffer);
    const stream = fs.createReadStream(tempFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: stream,
      model: 'whisper-1',
    });
    return await transcription;
  }
}
