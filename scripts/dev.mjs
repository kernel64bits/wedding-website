#!/usr/bin/env node

/**
 * Dev CLI for manual testing.
 *
 * Usage (inside Docker):
 *   docker compose exec app node scripts/dev.mjs <command> [options]
 *
 * Commands:
 *   help                          List available commands
 *   reset                         Wipe everything and regenerate test data
 *   guest:create --name "Name"    Create an invitation with a primary attendee
 *   guest:list                    List all invitations with login URLs
 *   guest:delete --token <token>  Delete an invitation (cascade)
 *   photos:seed                   Seed sample photos to MinIO
 *   photos:clear                  Remove all photos from MinIO
 *   settings:lock-rsvp            Toggle RSVP lock on/off
 *   admin:reset-password --password <pw>  Reset admin password
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

// ─── Load .env manually (no dotenv dependency) ──────────────────────
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
  // No .env file — use existing env vars (Docker sets them)
}

// ─── Clients ─────────────────────────────────────────────────────────
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const s3Endpoint = process.env.S3_ENDPOINT ?? "http://localhost:9000";
const s3Bucket = process.env.S3_BUCKET ?? "wedding-photos";

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: s3Endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "minioadmin",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "minioadmin",
  },
});

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

// ─── Argument parsing ────────────────────────────────────────────────
function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= process.argv.length) return null;
  return process.argv[idx + 1];
}

// ─── Commands ────────────────────────────────────────────────────────

async function cmdHelp() {
  console.log(`
Dev CLI — manual testing helper

Usage: node scripts/dev.mjs <command> [options]

Commands:
  help                              Show this help
  reset                             Wipe DB + MinIO, regenerate all test data
  guest:create --name "Full Name"   Create invitation + primary attendee
  guest:list                        List all invitations with login URLs
  guest:delete --token <token>      Delete an invitation (cascade)
  photos:seed                       Seed sample photos to MinIO
  photos:clear                      Remove all photos from MinIO bucket
  settings:lock-rsvp                Toggle RSVP lock on/off
  admin:reset-password --password <pw>  Reset admin password
`.trim());
}

// ─── guest:create ────────────────────────────────────────────────────
async function cmdGuestCreate() {
  const name = getArg("name");
  if (!name) {
    console.error("Usage: guest:create --name \"Full Name\"");
    process.exit(1);
  }
  const token = randomBytes(16).toString("hex");
  await prisma.invitation.create({
    data: {
      token,
      groupLabel: name,
      attendees: {
        create: { name, isPrimary: true },
      },
    },
  });
  console.log(`✓ Created invitation`);
  console.log(`  Name:  ${name}`);
  console.log(`  Token: ${token}`);
  console.log(`  Login: ${baseUrl}/api/login?token=${token}`);
}

// ─── guest:list ──────────────────────────────────────────────────────
async function cmdGuestList() {
  const invitations = await prisma.invitation.findMany({
    include: { attendees: true },
    orderBy: { createdAt: "asc" },
  });
  if (invitations.length === 0) {
    console.log("No invitations found.");
    return;
  }
  console.log(`\n${"Group".padEnd(25)} ${"Token".padEnd(35)} ${"RSVP".padEnd(12)} ${"Attendees".padEnd(10)} Login URL`);
  console.log("─".repeat(140));
  for (const inv of invitations) {
    const url = `${baseUrl}/api/login?token=${inv.token}`;
    console.log(
      `${inv.groupLabel.padEnd(25)} ${inv.token.padEnd(35)} ${inv.rsvpStatus.padEnd(12)} ${String(inv.attendees.length).padEnd(10)} ${url}`
    );
  }
  console.log(`\nTotal: ${invitations.length} invitation(s), ${invitations.reduce((s, i) => s + i.attendees.length, 0)} attendee(s)`);
}

// ─── guest:delete ────────────────────────────────────────────────────
async function cmdGuestDelete() {
  const token = getArg("token");
  if (!token) {
    console.error("Usage: guest:delete --token <token>");
    process.exit(1);
  }
  const inv = await prisma.invitation.findUnique({ where: { token } });
  if (!inv) {
    console.error(`No invitation found with token: ${token}`);
    process.exit(1);
  }
  await prisma.invitation.delete({ where: { token } });
  console.log(`✓ Deleted invitation "${inv.groupLabel}" (token: ${token})`);
}

// ─── photos:seed ─────────────────────────────────────────────────────
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
    await s3.send(new HeadBucketCommand({ Bucket: s3Bucket }));
  } catch {
    console.log(`  Creating bucket "${s3Bucket}"...`);
    await s3.send(new CreateBucketCommand({ Bucket: s3Bucket }));
  }
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadThumbnails",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${s3Bucket}/thumbnails/*`],
      },
    ],
  };
  await s3.send(
    new PutBucketPolicyCommand({ Bucket: s3Bucket, Policy: JSON.stringify(policy) })
  );
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function cmdPhotosSeed() {
  console.log("Seeding photos to MinIO...");
  await ensureBucket();
  for (const photo of SAMPLE_PHOTOS) {
    process.stdout.write(`  ${photo.name}...`);
    const [thumbnail, original] = await Promise.all([
      downloadBuffer(photo.url),
      downloadBuffer(photo.urlOriginal),
    ]);
    await Promise.all([
      s3.send(new PutObjectCommand({ Bucket: s3Bucket, Key: `thumbnails/${photo.name}`, Body: thumbnail, ContentType: "image/jpeg" })),
      s3.send(new PutObjectCommand({ Bucket: s3Bucket, Key: `originals/${photo.name}`, Body: original, ContentType: "image/jpeg" })),
    ]);
    console.log(" ✓");
  }
  console.log(`✓ ${SAMPLE_PHOTOS.length} photos seeded`);
}

// ─── photos:clear ────────────────────────────────────────────────────
async function clearBucket() {
  let deleted = 0;
  let token;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: s3Bucket, ContinuationToken: token })
    );
    const objects = (res.Contents ?? []).map((o) => ({ Key: o.Key }));
    if (objects.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({ Bucket: s3Bucket, Delete: { Objects: objects } })
      );
      deleted += objects.length;
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return deleted;
}

async function cmdPhotosClear() {
  const deleted = await clearBucket();
  console.log(`✓ Cleared ${deleted} object(s) from bucket "${s3Bucket}"`);
}

// ─── settings:lock-rsvp ──────────────────────────────────────────────
async function cmdSettingsLockRsvp() {
  const settings = await prisma.settings.findFirst();
  if (!settings) {
    await prisma.settings.create({ data: { rsvpLocked: true } });
    console.log("✓ Created settings — rsvpLocked: true");
    return;
  }
  const newValue = !settings.rsvpLocked;
  await prisma.settings.update({
    where: { id: settings.id },
    data: { rsvpLocked: newValue },
  });
  console.log(`✓ rsvpLocked toggled: ${settings.rsvpLocked} → ${newValue}`);
}

// ─── admin:reset-password ────────────────────────────────────────────
async function cmdAdminResetPassword() {
  const password = getArg("password");
  if (!password) {
    console.error("Usage: admin:reset-password --password <new-password>");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  const admin = await prisma.admin.findFirst();
  if (!admin) {
    console.error("No admin account found. Run 'reset' first.");
    process.exit(1);
  }
  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: hash },
  });
  console.log(`✓ Admin password updated for "${admin.username}"`);
}

// ─── reset ───────────────────────────────────────────────────────────

const SEED_GUESTS = [
  {
    token: "token-martin", groupLabel: "Famille Martin",
    rsvpStatus: "confirmed", tableNumber: 2,
    attendees: [
      { name: "Pierre Martin", isPrimary: true, attending: true, dietaryRestrictions: null },
      { name: "Claire Martin", isPrimary: false, attending: true, dietaryRestrictions: "végétarien" },
    ],
  },
  {
    token: "token-dubois", groupLabel: "Famille Dubois",
    rsvpStatus: "confirmed", tableNumber: 3,
    attendees: [
      { name: "Jean Dubois", isPrimary: true, attending: true, dietaryRestrictions: null },
      { name: "Marie Dubois", isPrimary: false, attending: true, dietaryRestrictions: null },
      { name: "Lucas Dubois", isPrimary: false, attending: true, dietaryRestrictions: "sans gluten" },
    ],
  },
  {
    token: "token-bernard", groupLabel: "Sophie Bernard",
    rsvpStatus: "confirmed", tableNumber: 2,
    attendees: [
      { name: "Sophie Bernard", isPrimary: true, attending: true, dietaryRestrictions: null },
      { name: "Invité Bernard", isPrimary: false, isPlusOne: true, attending: true, dietaryRestrictions: null },
    ],
  },
  {
    token: "token-leroy", groupLabel: "Thomas Leroy",
    rsvpStatus: "declined", tableNumber: null,
    attendees: [
      { name: "Thomas Leroy", isPrimary: true, attending: false, dietaryRestrictions: null },
    ],
  },
  {
    token: "token-petit", groupLabel: "Famille Petit",
    rsvpStatus: "pending", tableNumber: null,
    attendees: [
      { name: "Henri Petit", isPrimary: true, attending: null, dietaryRestrictions: null },
      { name: "Anne Petit", isPrimary: false, attending: null, dietaryRestrictions: null },
    ],
  },
  {
    token: "token-simon", groupLabel: "Camille Simon",
    rsvpStatus: "confirmed", tableNumber: 4,
    attendees: [
      { name: "Camille Simon", isPrimary: true, attending: true, dietaryRestrictions: "vegan" },
    ],
  },
  {
    token: "token-moreau", groupLabel: "Famille Moreau",
    rsvpStatus: "pending", tableNumber: null,
    attendees: [
      { name: "Paul Moreau", isPrimary: true, attending: null, dietaryRestrictions: null },
      { name: "Isabelle Moreau", isPrimary: false, attending: null, dietaryRestrictions: null },
    ],
  },
  {
    token: "token-garcia", groupLabel: "Marc Garcia",
    rsvpStatus: "declined", tableNumber: null,
    attendees: [
      { name: "Marc Garcia", isPrimary: true, attending: false, dietaryRestrictions: null },
      { name: "Laura Garcia", isPrimary: false, attending: false, dietaryRestrictions: null },
    ],
  },
  {
    token: "token-robert", groupLabel: "Famille Robert",
    rsvpStatus: "confirmed", tableNumber: 5,
    attendees: [
      { name: "François Robert", isPrimary: true, attending: true, dietaryRestrictions: null },
      { name: "Nathalie Robert", isPrimary: false, attending: true, dietaryRestrictions: "sans lactose" },
    ],
  },
];

async function cmdReset() {
  console.log("Resetting everything...\n");

  // 1. Clear database
  console.log("1/4 Clearing database...");
  await prisma.attendee.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.table.deleteMany();
  console.log("  ✓ All tables cleared");

  // 2. Clear MinIO bucket
  console.log("2/4 Clearing photos...");
  try {
    const deleted = await clearBucket();
    console.log(`  ✓ ${deleted} object(s) removed`);
  } catch {
    console.log("  ⚠ Could not clear bucket (MinIO may not be running)");
  }

  // 3. Seed database
  console.log("3/4 Seeding database...");

  // Settings
  await prisma.settings.create({ data: { rsvpLocked: false, seatingEnabled: true } });
  console.log("  ✓ Settings created");

  // Admin
  const adminPassword = "admin1234";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.admin.create({
    data: { username: "admin", passwordHash },
  });
  console.log("  ✓ Admin created");

  // Test invitation
  await prisma.invitation.create({
    data: {
      token: "test-token-123",
      groupLabel: "Famille Test",
      attendees: { create: { name: "Sophie Test", isPrimary: true } },
    },
  });

  // Guest families
  for (const g of SEED_GUESTS) {
    const { attendees, ...invData } = g;
    await prisma.invitation.create({
      data: {
        ...invData,
        attendees: {
          create: attendees.map(({ isPlusOne, ...a }) => ({
            ...a,
            isPlusOne: isPlusOne ?? false,
          })),
        },
      },
    });
  }
  console.log(`  ✓ ${SEED_GUESTS.length + 1} invitation(s) created`);

  // 4. Seed photos
  console.log("4/4 Seeding photos...");
  try {
    await ensureBucket();
    for (const photo of SAMPLE_PHOTOS) {
      process.stdout.write(`  ${photo.name}...`);
      const [thumbnail, original] = await Promise.all([
        downloadBuffer(photo.url),
        downloadBuffer(photo.urlOriginal),
      ]);
      await Promise.all([
        s3.send(new PutObjectCommand({ Bucket: s3Bucket, Key: `thumbnails/${photo.name}`, Body: thumbnail, ContentType: "image/jpeg" })),
        s3.send(new PutObjectCommand({ Bucket: s3Bucket, Key: `originals/${photo.name}`, Body: original, ContentType: "image/jpeg" })),
      ]);
      console.log(" ✓");
    }
    console.log(`  ✓ ${SAMPLE_PHOTOS.length} photos seeded`);
  } catch (err) {
    console.log(`  ⚠ Photo seeding failed: ${err.message}`);
  }

  // Summary
  console.log("\n" + "═".repeat(80));
  console.log("  RESET COMPLETE — Test Data Summary");
  console.log("═".repeat(80));

  console.log("\n  Admin:");
  console.log(`    URL:      ${baseUrl}/admin/login`);
  console.log(`    Username: admin`);
  console.log(`    Password: ${adminPassword}`);

  console.log("\n  Guest Invitations:");
  console.log(`  ${"Group".padEnd(25)} ${"Token".padEnd(35)} ${"RSVP".padEnd(12)} Login URL`);
  console.log("  " + "─".repeat(120));

  const allInvitations = await prisma.invitation.findMany({
    include: { attendees: true },
    orderBy: { createdAt: "asc" },
  });
  for (const inv of allInvitations) {
    const url = `${baseUrl}/api/login?token=${inv.token}`;
    console.log(
      `  ${inv.groupLabel.padEnd(25)} ${inv.token.padEnd(35)} ${inv.rsvpStatus.padEnd(12)} ${url}`
    );
  }

  console.log(`\n  Total: ${allInvitations.length} invitation(s), ${allInvitations.reduce((s, i) => s + i.attendees.length, 0)} attendee(s)`);
  console.log("═".repeat(80));
}

// ─── Main ────────────────────────────────────────────────────────────
const command = process.argv[2];

const commands = {
  help: cmdHelp,
  reset: cmdReset,
  "guest:create": cmdGuestCreate,
  "guest:list": cmdGuestList,
  "guest:delete": cmdGuestDelete,
  "photos:seed": cmdPhotosSeed,
  "photos:clear": cmdPhotosClear,
  "settings:lock-rsvp": cmdSettingsLockRsvp,
  "admin:reset-password": cmdAdminResetPassword,
};

if (!command || !commands[command]) {
  if (command && command !== "help") {
    console.error(`Unknown command: ${command}\n`);
  }
  await cmdHelp();
  if (command && command !== "help") process.exit(1);
} else {
  try {
    await commands[command]();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

await prisma.$disconnect();
