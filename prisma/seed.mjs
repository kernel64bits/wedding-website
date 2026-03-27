import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

await prisma.invitation.upsert({
  where: { token: "test-token-123" },
  update: {},
  create: {
    token: "test-token-123",
    groupLabel: "Famille Test",
    attendees: {
      create: { name: "Sophie Test", isPrimary: true },
    },
  },
});

console.log("✓ Seed complete — test token: test-token-123");
console.log("  Login URL: http://localhost:3000/api/login?token=test-token-123");

const passwordHash = await bcrypt.hash("admin1234", 12);
await prisma.admin.upsert({
  where: { username: "admin" },
  update: {},
  create: { username: "admin", passwordHash },
});
console.log("✓ Admin seeded — username: admin / password: admin1234");
console.log("  ⚠️  Change this password before going live.");

await prisma.$disconnect();
