import dynamic from "next/dynamic";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

const ChatWidget = dynamic(() => import("@/components/chatbot/ChatWidget"), {
  ssr: false,
});

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("STUDENT");

  const student = await prisma.student.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      batch: {
        select: {
          name: true,
          subject: true,
        },
      },
    },
  });

  return (
    <>
      {children}
      {student ? (
        <ChatWidget
          userId={session.user.id}
          studentName={student.user.name}
          batchName={student.batch.name}
          subjects={[student.batch.subject]}
        />
      ) : null}
    </>
  );
}
