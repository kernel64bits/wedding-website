import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Singleton S3 client (same pattern as lib/prisma.ts)
const globalForS3 = globalThis as unknown as { __s3?: S3Client };

function getS3Client(): S3Client {
  if (!globalForS3.__s3) {
    globalForS3.__s3 = new S3Client({
      region: process.env.S3_REGION ?? "us-east-1",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true, // Required for MinIO
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return globalForS3.__s3;
}

const bucket = () => process.env.S3_BUCKET ?? "wedding-photos";

export interface Photo {
  key: string; // e.g. "thumbnails/photo-001.jpg"
  originalKey: string; // e.g. "originals/photo-001.jpg"
  thumbnailUrl: string; // public URL for display
}

export async function listPhotos(): Promise<Photo[]> {
  const s3 = getS3Client();
  const b = bucket();
  const baseUrl = process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT;

  const response = await s3.send(
    new ListObjectsV2Command({ Bucket: b, Prefix: "thumbnails/" }),
  );

  return (response.Contents ?? [])
    .filter((obj) => obj.Key && /\.(jpe?g|png|webp)$/i.test(obj.Key))
    .sort((a, b) => (a.Key ?? "").localeCompare(b.Key ?? ""))
    .map((obj) => {
      const filename = obj.Key!.replace("thumbnails/", "");
      return {
        key: obj.Key!,
        originalKey: `originals/${filename}`,
        thumbnailUrl: `${baseUrl}/${b}/thumbnails/${filename}`,
      };
    });
}

export async function getDownloadUrl(originalKey: string): Promise<string> {
  const s3 = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: originalKey,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
}
