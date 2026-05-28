import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';

export function createDiskStorage(subdir: string) {
  return diskStorage({
    destination: (req, file, cb) => {
      const dir = join(process.cwd(), 'uploads', subdir);
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${randomBytes(16).toString('hex')}${ext}`);
    },
  });
}

export const imageFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
    return cb(
      new BadRequestException('Apenas ficheiros de imagem são permitidos (jpeg, png, webp, gif)'),
      false,
    );
  }
  cb(null, true);
};

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
