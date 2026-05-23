// scripts/create-superadmin.ts
import { prisma } from "../lib/prisma";

async function main() {
  const clerkId = "user_3DgiuotoUJ1zzD3qL196YqpHtID"; // ← Tu clerkId del error

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: { role: "SUPER_ADMIN" },
    create: {
      clerkId,
      email: "cg.gonzalo.88@gmail.com", // cambia si es necesario
      firstName: "Gonzalo",
      role: "SUPER_ADMIN",
    },
  });

  console.log("✅ Super Admin creado/actualizado:", user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());