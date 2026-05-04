import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

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

  // Paginate through all objects — ListObjectsV2 caps a single page at 1000.
  const all: { Key?: string }[] = [];
  let token: string | undefined;
  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: b,
        Prefix: "thumbnails/",
        ContinuationToken: token,
      }),
    );
    if (response.Contents) all.push(...response.Contents);
    token = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (token);

  return all
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

export async function getPhotoStream(
  key: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
  const s3 = getS3Client();
  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket(), Key: key }),
    );
    if (!response.Body) return null;
    return {
      body: response.Body.transformToWebStream(),
      contentType: response.ContentType ?? "application/octet-stream",
    };
  } catch (err) {
    // Only swallow real "not found" errors. Connection / permission / config
    // errors propagate so callers can log them and return 500 instead of 404.
    if (err instanceof Error && err.name === "NoSuchKey") return null;
    throw err;
  }
}
