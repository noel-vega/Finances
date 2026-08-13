import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from 'logging';
import { createStorageClient } from 'storage';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  private readonly client = createStorageClient({
    endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    bucket: process.env.MINIO_BUCKET ?? 'shop-product-images',
    publicBaseUrl:
      process.env.MINIO_PUBLIC_BASE_URL ?? 'http://localhost:9000/shop-product-images',
  });

  // local dev needs zero manual MinIO console setup — same zero-friction
  // bar as Mailpit needing no setup to receive mail
  async onModuleInit() {
    try {
      await this.client.ensureBucket();
    } catch (err) {
      this.logger.warn(
        `Failed to ensure storage bucket exists: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  getUploadUrl(key: string, contentType: string) {
    return this.client.getUploadUrl(key, contentType);
  }

  getPublicUrl(key: string) {
    return this.client.getPublicUrl(key);
  }

  // best-effort — the DB row is the source of truth for what's "deleted";
  // a lingering object in the bucket after a failed delete isn't visible to
  // any user-facing flow
  async deleteObject(key: string) {
    try {
      await this.client.deleteObject(key);
    } catch (err) {
      this.logger.warn(
        `Failed to delete storage object ${key}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
