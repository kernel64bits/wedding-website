/**
 * Seed MinIO with sample wedding photos for local development.
 *
 * Usage: node scripts/seed-photos.mjs
 *
 * Requires MinIO to be running (docker compose up minio).
 * Uses S3_* env vars from .env (loaded manually below).
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

// Load .env manually (no dotenv dependency)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  console.log("No .env file found, using existing env vars");
}

const endpoint = process.env.S3_ENDPOINT ?? "http://localhost:9000";
const bucket = process.env.S3_BUCKET ?? "wedding-photos";
const region = process.env.S3_REGION ?? "us-east-1";

const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "minioadmin",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "minioadmin",
  },
});

// Sample photos from Pexels (free, no auth required)
const SAMPLE_PHOTOS = [
  {
    name: "wedding-bouquet.jpg",
    url: "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&w=800",
    urlOriginal: "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&w=2000",
  },
  {
    name: "wedding-rings.jpg",
    url: "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&w=800",
    urlOriginal: "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&w=2000",
  },
  {
    name: "wedding-venue.jpg",
    url: "https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&w=800",
    urlOriginal: "https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&w=2000",
  },
  {
    name: "wedding-cake.jpg",
    url: "https://images.pexels.com/photos/1721934/pexels-photo-1721934.jpeg?auto=compress&w=800",
    urlOriginal: "https://images.pexels.com/photos/1721934/pexels-photo-1721934.jpeg?auto=compress&w=2000",
  },
  {
    name: "wedding-couple.jpg",
    url: "https://images.pexels.com/photos/1043902/pexels-photo-1043902.jpeg?auto=compress&w=800",
    urlOriginal: "https://images.pexels.com/photos/1043902/pexels-photo-1043902.jpeg?auto=compress&w=2000",
  },
  {
    name: "wedding-decoration.jpg",
    url: "https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&w=800",
    urlOriginal: "https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&w=2000",
  },
];

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Bucket "${bucket}" already exists`);
  } catch {
    console.log(`Creating bucket "${bucket}"...`);
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }

  // Allow public read on thumbnails/*
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadThumbnails",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/thumbnails/*`],
      },
    ],
  };
  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify(policy),
    })
  );
  console.log("Bucket policy set (public read on thumbnails/*)");
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadPhoto(photo) {
  console.log(`  Downloading ${photo.name}...`);
  const [thumbnail, original] = await Promise.all([
    downloadBuffer(photo.url),
    downloadBuffer(photo.urlOriginal),
  ]);

  await Promise.all([
    s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `thumbnails/${photo.name}`,
        Body: thumbnail,
        ContentType: "image/jpeg",
      })
    ),
    s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `originals/${photo.name}`,
        Body: original,
        ContentType: "image/jpeg",
      })
    ),
  ]);

  console.log(`  Uploaded thumbnails/${photo.name} and originals/${photo.name}`);
}

async function main() {
  console.log(`Seeding photos to MinIO at ${endpoint}...\n`);

  await ensureBucket();

  console.log(`\nUploading ${SAMPLE_PHOTOS.length} sample photos...`);
  for (const photo of SAMPLE_PHOTOS) {
    await uploadPhoto(photo);
  }

  console.log(`\nDone! ${SAMPLE_PHOTOS.length} photos seeded.`);
  console.log(`View at: ${endpoint}/${bucket}/`);
  console.log(`MinIO Console: http://localhost:9001`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
