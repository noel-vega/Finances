import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const UPLOAD_URL_EXPIRY_SECONDS = 5 * 60;

export interface StorageConfig {
  endpoint: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  // MinIO (and most non-AWS S3-compatible servers) need path-style URLs
  // (http://host/bucket/key) rather than AWS's virtual-hosted-style
  // (http://bucket.host/key)
  forcePathStyle?: boolean;
  // the URL prefix returned to clients and stored in the DB — decoupled
  // from `endpoint` so a CDN can front the bucket later without a schema
  // change or data migration
  publicBaseUrl: string;
}

export function createStorageClient(config: StorageConfig) {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region ?? "us-east-1",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle ?? true,
  });

  return {
    // idempotent create-if-missing + public-read policy, so local dev needs
    // zero manual setup in the MinIO console — call once at startup
    async ensureBucket() {
      const exists = await client
        .send(new HeadBucketCommand({ Bucket: config.bucket }))
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        await client.send(new CreateBucketCommand({ Bucket: config.bucket }));
      }

      await client.send(
        new PutBucketPolicyCommand({
          Bucket: config.bucket,
          Policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: "*",
                Action: "s3:GetObject",
                Resource: `arn:aws:s3:::${config.bucket}/*`,
              },
            ],
          }),
        }),
      );
    },

    async getUploadUrl(key: string, contentType: string) {
      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType,
      });
      return getSignedUrl(client, command, { expiresIn: UPLOAD_URL_EXPIRY_SECONDS });
    },

    getPublicUrl(key: string) {
      return `${config.publicBaseUrl}/${key}`;
    },

    async deleteObject(key: string) {
      await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    },
  };
}
