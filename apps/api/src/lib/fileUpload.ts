import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { BadRequestError } from './errors.js';

/**
 * Validates and saves a base64 encoded file string.
 * Enforces size limits, allows only specific mime types,
 * verifies file magic bytes/signatures, and saves to a randomized UUID filename.
 * 
 * Satisfies Security Checklist Part A #20 (No file upload validation).
 */
export function saveBase64File(
  base64String: string,
  allowedMimeTypes: string[],
  maxSizeBytes: number,
  uploadSubdir = 'logos'
): string {
  // 1. Extract MIME type and raw base64 data
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new BadRequestError('Invalid file format. Must be a base64 encoded data URI (e.g. data:image/png;base64,...)');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  
  if (!mimeType || !base64Data) {
    throw new BadRequestError('Failed to parse file mime-type or data');
  }

  const buffer = Buffer.from(base64Data, 'base64');

  // 2. Enforce size limit
  if (buffer.length > maxSizeBytes) {
    const sizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    throw new BadRequestError(`File size exceeds the limit of ${sizeMb}MB`);
  }

  // 3. Verify MIME type is in the allowed list
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new BadRequestError(`MIME type '${mimeType}' is not allowed`);
  }

  // 4. Verify actual file signature / magic bytes (do not trust Content-Type header alone)
  let isValidSignature = false;
  
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    // JPEG starts with FF D8 FF
    isValidSignature = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  } else if (mimeType === 'image/png') {
    // PNG starts with 89 50 4E 47
    isValidSignature = buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  } else if (mimeType === 'image/webp') {
    // WebP starts with RIFF (bytes 0-3) and WEBP (bytes 8-11)
    if (buffer.length >= 12) {
      const riff = buffer.toString('ascii', 0, 4);
      const webp = buffer.toString('ascii', 8, 12);
      isValidSignature = riff === 'RIFF' && webp === 'WEBP';
    }
  } else if (mimeType === 'application/pdf') {
    // PDF starts with %PDF
    if (buffer.length >= 4) {
      isValidSignature = buffer.toString('ascii', 0, 4) === '%PDF';
    }
  }

  if (!isValidSignature) {
    throw new BadRequestError('File signature validation failed. The file contents do not match its declared type.');
  }

  // 5. Generate a randomized filename (Defense against path traversal and metadata leaks)
  const ext = mimeType.split('/')[1] || 'bin';
  const randomizedName = `${crypto.randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'uploads', uploadSubdir);

  // Ensure upload directory exists
  fs.mkdirSync(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, randomizedName);
  fs.writeFileSync(filePath, buffer);

  // Return the relative URL path
  return `/uploads/${uploadSubdir}/${randomizedName}`;
}
