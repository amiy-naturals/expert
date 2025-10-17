const VALID_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const VALID_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_DIMENSION = 2048;
const COMPRESSED_QUALITY = 0.8;

export interface ImageValidationError {
  code: 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'COMPRESSION_FAILED';
  message: string;
}

export interface ImageCompressionResult {
  blob: Blob;
  width: number;
  height: number;
  sizeKB: number;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function isValidImageFormat(file: File): boolean {
  const extension = getFileExtension(file.name);
  return VALID_IMAGE_FORMATS.includes(file.type) && VALID_IMAGE_EXTENSIONS.includes(extension);
}

function isFileSizeValid(file: File): boolean {
  return file.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024;
}

export async function validateImage(file: File): Promise<void> {
  if (!isValidImageFormat(file)) {
    throw {
      code: 'INVALID_FORMAT',
      message: `Invalid image format. Only JPG, JPEG, PNG, and WebP are allowed. (You uploaded: ${getFileExtension(file.name)})`,
    } as ImageValidationError;
  }

  if (!isFileSizeValid(file)) {
    throw {
      code: 'FILE_TOO_LARGE',
      message: `Image file is too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`,
    } as ImageValidationError;
  }
}

export async function compressImage(file: File): Promise<ImageCompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > height) {
          if (width > MAX_IMAGE_DIMENSION) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          }
        } else {
          if (height > MAX_IMAGE_DIMENSION) {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject({
            code: 'COMPRESSION_FAILED',
            message: 'Failed to compress image',
          } as ImageValidationError);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject({
                code: 'COMPRESSION_FAILED',
                message: 'Failed to compress image',
              } as ImageValidationError);
              return;
            }

            resolve({
              blob,
              width,
              height,
              sizeKB: Math.round(blob.size / 1024),
            });
          },
          'image/jpeg',
          COMPRESSED_QUALITY
        );
      };

      img.onerror = () => {
        reject({
          code: 'COMPRESSION_FAILED',
          message: 'Failed to load image',
        } as ImageValidationError);
      };

      const dataUrl = event.target?.result as string;
      img.src = dataUrl;
    };

    reader.onerror = () => {
      reject({
        code: 'COMPRESSION_FAILED',
        message: 'Failed to read file',
      } as ImageValidationError);
    };

    reader.readAsDataURL(file);
  });
}

export const VALID_LICENSE_FORMATS = ['application/pdf'];
export const VALID_LICENSE_EXTENSIONS = ['pdf'];
export const MAX_LICENSE_SIZE_MB = 20;

function isValidLicenseFormat(file: File): boolean {
  const extension = getFileExtension(file.name);
  return (file.type === 'application/pdf' || file.type === '') && VALID_LICENSE_EXTENSIONS.includes(extension);
}

function isLicenseFileSizeValid(file: File): boolean {
  return file.size <= MAX_LICENSE_SIZE_MB * 1024 * 1024;
}

export async function validateLicense(file: File): Promise<void> {
  if (!isValidLicenseFormat(file)) {
    throw new Error(`Invalid license format. Only PDF files are allowed.`);
  }

  if (!isLicenseFileSizeValid(file)) {
    throw new Error(`License file is too large. Maximum size is ${MAX_LICENSE_SIZE_MB}MB.`);
  }
}
