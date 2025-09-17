import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { extname, join } from 'path';
import { v4 } from 'uuid';

@Injectable()
export class GoogleService {
  storage;
  constructor() {
    this.storage = new Storage({
      projectId: 'knn3-401001',
      keyFilename: join(process.cwd(), 'cloud.json'),
    });
  }

  async upload(conversation: string) {
    const key = `typography/share/${v4()}.txt`;
    await this.storage.bucket('knn3-online').file(key).save(conversation);
    return `https://storage.googleapis.com/knn3-online/${key}`;
  }

  async uploadFile(file: Express.Multer.File) {
    const key = `${v4()}${extname(file.originalname)}`;
    await this.storage.bucket('knn3-online').file(key).save(file.buffer);
    return `https://storage.googleapis.com/knn3-online/${key}`;
  }

  async uploadImage(buffer, key) {
    await this.storage.bucket('knn3-online').file(key).save(buffer);
    return `https://storage.googleapis.com/knn3-online/${key}`;
  }
}
