import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

await prisma.invitation.upsert({
  where: { token: "test-token-123" },
  update: {},
  create: {
    token: "test-token-123",
    groupLabel: "Famille Test",
    email: "test@example.com",
    language: "fr",
    attendees: {
      create: { name: "Sophie Test", isPrimary: true },
    },
  },
});

console.log("✓ Seed complete — test token: test-token-123");
console.log("  Login URL: http://localhost:3000/api/login?token=test-token-123");

await prisma.$disconnect();
