import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

function randomFilename(originalname: string): string {
  const ext = path.extname(originalname);
  return `${crypto.randomBytes(16).toString('hex')}${ext}`;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Verifies a file's actual bytes match its claimed type, since the client-supplied
 * mimetype/extension can be spoofed. Only checks the magic number at the start of
 * the file — cheap, and enough to reject e.g. an HTML/SVG payload disguised as a PNG.
 */
function matchesMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const sig = (...bytes: number[]) => bytes.every((b, i) => buffer[i] === b);
  switch (mimetype) {
    case 'image/png':
      return sig(0x89, 0x50, 0x4e, 0x47);
    case 'image/jpeg':
      return sig(0xff, 0xd8, 0xff);
    case 'image/gif':
      return sig(0x47, 0x49, 0x46, 0x38);
    case 'image/webp':
      return sig(0x52, 0x49, 0x46, 0x46) && buffer.slice(8, 12).toString('ascii') === 'WEBP';
    case 'application/pdf':
      return sig(0x25, 0x50, 0x44, 0x46);
    case 'application/msword':
      return sig(0xd0, 0xcf, 0x11, 0xe0);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      // .docx is a zip archive under the hood
      return sig(0x50, 0x4b, 0x03, 0x04);
    default:
      return false;
  }
}

function verifyUploadedFileOrThrow(file: Express.Multer.File) {
  const buffer = fs.readFileSync(file.path);
  if (!matchesMagicBytes(buffer, file.mimetype)) {
    fs.unlinkSync(file.path);
    throw new BadRequestException('File content does not match its claimed type');
  }
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => cb(null, randomFilename(file.originalname)),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!IMAGE_TYPES.includes(file.mimetype)) {
          cb(new BadRequestException('Only JPG, PNG, WEBP, or GIF images are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    verifyUploadedFileOrThrow(file);
    return { url: `/uploads/${file.filename}` };
  }

  @Post('document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => cb(null, randomFilename(file.originalname)),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!DOCUMENT_TYPES.includes(file.mimetype)) {
          cb(new BadRequestException('Only PDF or Word documents are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    verifyUploadedFileOrThrow(file);
    return { url: `/uploads/${file.filename}` };
  }
}
