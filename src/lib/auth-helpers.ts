import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getServerSession() {
  return auth();
}

export async function requireRole(role: "ADMIN" | "FACULTY" | "STUDENT") {
  const session = await getServerSession();

  if (!session?.user || session.user.role !== role) {
    redirect("/login");
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}
