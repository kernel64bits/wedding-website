import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const guests = [
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

for (const g of guests) {
  const { attendees, ...invData } = g;
  await prisma.invitation.upsert({
    where: { token: g.token },
    update: {},
    create: {
      ...invData,
      attendees: {
        create: attendees.map(({ isPlusOne, ...a }) => ({
          ...a,
          isPlusOne: isPlusOne ?? false,
        })),
      },
    },
  });
  console.log(`✓ ${g.groupLabel}`);
}

await prisma.$disconnect();
