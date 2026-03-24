import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

export default defineConfig({
  // @ts-expect-error earlyAccess is required by Prisma 7 but not yet in the type definitions
  earlyAccess: true,
  datasource: {
    url: databaseUrl,
  },
  migrate: {
    async adapter() {
      const { PrismaLibSql } = await import("@prisma/adapter-libsql");
      return new PrismaLibSql({ url: databaseUrl });
    },
  },
});
