// lib/auth.ts
import { prisma } from "./prisma";
import { currentUser } from "@clerk/nextjs/server";

const SUPER_ADMIN_CLERK_IDS = [
  "user_3DgiuotoUJ1zzD3qL196YqpHtID",   // ← Tu ID actual
  // Agrega aquí otros IDs de Clerk si quieres más super admins
];

export async function getOrCreateUser() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const isSuperAdmin = SUPER_ADMIN_CLERK_IDS.includes(clerkUser.id);

    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        avatarUrl: clerkUser.imageUrl || null,
      },
      create: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        avatarUrl: clerkUser.imageUrl || null,
        role: isSuperAdmin ? "SUPER_ADMIN" : "ORGANIZER",
      },
    });

    console.log(`✅ Usuario sincronizado: ${user.email} | Rol: ${user.role}`);
    return user;
  } catch (error) {
    console.error("❌ Error en getOrCreateUser:", error);
    return null;
  }
}