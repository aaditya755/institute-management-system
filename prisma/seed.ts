import bcrypt from "bcryptjs";
import { subDays, set } from "date-fns";
import { PrismaClient, AttendanceStatus, FeeStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();

const saltRounds = 10;

const facultySeed = [
  {
    name: "Dr. Priya Sharma",
    email: "priya@milestone.com",
    password: "Faculty@123",
    subjects: ["Physics", "Mathematics"],
    qualification: "Ph.D Physics",
    salary: 45000,
  },
  {
    name: "Mr. Rahul Verma",
    email: "rahul@milestone.com",
    password: "Faculty@123",
    subjects: ["Chemistry", "Biology"],
    qualification: "M.Sc Chemistry",
    salary: 38000,
  },
  {
    name: "Ms. Ananya Singh",
    email: "ananya@milestone.com",
    password: "Faculty@123",
    subjects: ["Mathematics", "CS"],
    qualification: "M.Tech CS",
    salary: 42000,
  },
];

const studentSeed = [
  {
    name: "Arjun Mehta",
    email: "arjun@milestone.com",
    password: "Student@123",
    rollNo: "MC-2401",
    phone: "9876500001",
    parentPhone: "9876510001",
    address: "12 Lakeview Residency, Ahmedabad",
  },
  {
    name: "Sneha Patel",
    email: "sneha@milestone.com",
    password: "Student@123",
    rollNo: "MC-2402",
    phone: "9876500002",
    parentPhone: "9876510002",
    address: "44 Sunrise Avenue, Surat",
  },
  {
    name: "Karan Joshi",
    email: "karan@milestone.com",
    password: "Student@123",
    rollNo: "MC-2403",
    phone: "9876500003",
    parentPhone: "9876510003",
    address: "8 Riverfront Enclave, Jaipur",
  },
  {
    name: "Riya Nair",
    email: "riya@milestone.com",
    password: "Student@123",
    rollNo: "MC-2404",
    phone: "9876500004",
    parentPhone: "9876510004",
    address: "77 Palm Grove, Kochi",
  },
  {
    name: "Dev Agarwal",
    email: "dev@milestone.com",
    password: "Student@123",
    rollNo: "MC-2405",
    phone: "9876500005",
    parentPhone: "9876510005",
    address: "25 Orchard Park, Delhi",
  },
  {
    name: "Meera Iyer",
    email: "meera@milestone.com",
    password: "Student@123",
    rollNo: "MC-2406",
    phone: "9876500006",
    parentPhone: "9876510006",
    address: "63 Green Meadows, Chennai",
  },
];

const attendancePattern: AttendanceStatus[] = [
  AttendanceStatus.PRESENT,
  AttendanceStatus.PRESENT,
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.PRESENT,
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
  AttendanceStatus.PRESENT,
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.PRESENT,
  AttendanceStatus.PRESENT,
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
  AttendanceStatus.PRESENT,
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.PRESENT,
];

const feeStatusPattern: FeeStatus[] = [
  FeeStatus.PAID,
  FeeStatus.PARTIAL,
  FeeStatus.UNPAID,
];

const examTemplates = [
  { name: "Unit Test 1", totalMarks: 100, dayOffset: 21 },
  { name: "Performance Review", totalMarks: 80, dayOffset: 7 },
];

function gradeFromMarks(marks: number, total: number) {
  const percentage = (marks / total) * 100;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

async function main() {
  await prisma.result.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.student.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("Admin@123", saltRounds);
  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@milestone.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const createdFaculty = [];
  for (const faculty of facultySeed) {
    const user = await prisma.user.create({
      data: {
        name: faculty.name,
        email: faculty.email,
        password: await bcrypt.hash(faculty.password, saltRounds),
        role: Role.FACULTY,
        faculty: {
          create: {
            subjects: faculty.subjects,
            qualification: faculty.qualification,
            salary: faculty.salary,
          },
        },
      },
      include: {
        faculty: true,
      },
    });
    createdFaculty.push(user.faculty!);
  }

  const batchDefinitions = [
    {
      name: "Physics Elite",
      subject: "Physics",
      facultyId: createdFaculty[0].id,
      days: ["Mon", "Wed", "Fri"],
      startTime: "09:00",
      endTime: "11:00",
    },
    {
      name: "Chemistry Pro",
      subject: "Chemistry",
      facultyId: createdFaculty[1].id,
      days: ["Tue", "Thu", "Sat"],
      startTime: "14:00",
      endTime: "16:00",
    },
    {
      name: "Math Masters",
      subject: "Mathematics",
      facultyId: createdFaculty[2].id,
      days: ["Mon", "Wed", "Fri"],
      startTime: "16:00",
      endTime: "18:00",
    },
  ];

  const batches = [];
  for (const batch of batchDefinitions) {
    const created = await prisma.batch.create({ data: batch });
    batches.push(created);
  }

  const batchAssignments = [batches[0].id, batches[0].id, batches[1].id, batches[1].id, batches[2].id, batches[2].id];

  const createdStudents = [];
  for (const [index, student] of studentSeed.entries()) {
    const enrolledAt = subDays(new Date(), 45 - index * 3);
    const user = await prisma.user.create({
      data: {
        name: student.name,
        email: student.email,
        password: await bcrypt.hash(student.password, saltRounds),
        role: Role.STUDENT,
        student: {
          create: {
            rollNo: student.rollNo,
            batchId: batchAssignments[index],
            phone: student.phone,
            parentPhone: student.parentPhone,
            address: student.address,
            enrolledAt,
          },
        },
      },
      include: {
        student: true,
      },
    });
    createdStudents.push(user.student!);
  }

  for (const [batchIndex, batch] of batches.entries()) {
    for (const day of batch.days) {
      await prisma.timetable.create({
        data: {
          batchId: batch.id,
          facultyId: batch.facultyId,
          day,
          startTime: batch.startTime,
          endTime: batch.endTime,
          subject: batch.subject,
        },
      });
    }

    const studentsForBatch = createdStudents.filter((student) => student.batchId === batch.id);
    for (const template of examTemplates) {
      const exam = await prisma.exam.create({
        data: {
          name: `${batch.subject} ${template.name}`,
          batchId: batch.id,
          facultyId: batch.facultyId,
          subject: batch.subject,
          date: subDays(new Date(), template.dayOffset + batchIndex * 2),
          totalMarks: template.totalMarks,
        },
      });

      for (const [studentIndex, student] of studentsForBatch.entries()) {
        const marksBase = template.totalMarks - (studentIndex * 7 + batchIndex * 4);
        const marks = Math.max(32, Math.min(template.totalMarks, marksBase));
        await prisma.result.create({
          data: {
            examId: exam.id,
            studentId: student.id,
            marksObtained: marks,
            grade: gradeFromMarks(marks, template.totalMarks),
            remarks: marks >= template.totalMarks * 0.8 ? "Strong conceptual clarity" : "Needs targeted revision",
          },
        });
      }
    }
  }

  for (const [studentIndex, student] of createdStudents.entries()) {
    const batch = batches.find((item) => item.id === student.batchId)!;

    for (let dayIndex = 0; dayIndex < 30; dayIndex += 1) {
      const date = set(subDays(new Date(), 29 - dayIndex), {
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
      const status = attendancePattern[(studentIndex * 3 + dayIndex) % attendancePattern.length];
      await prisma.attendance.create({
        data: {
          studentId: student.id,
          batchId: batch.id,
          date,
          status,
        },
      });
    }

    for (let installmentIndex = 0; installmentIndex < 3; installmentIndex += 1) {
      const amount = 3000 + ((studentIndex + installmentIndex) % 4) * 1000 + installmentIndex * 250;
      const dueDate = subDays(new Date(), 35 - installmentIndex * 18 - studentIndex * 2);
      const status = feeStatusPattern[(studentIndex + installmentIndex) % feeStatusPattern.length];
      const paidDate =
        status === FeeStatus.PAID
          ? subDays(dueDate, -2)
          : status === FeeStatus.PARTIAL
            ? subDays(dueDate, -5)
            : null;

      await prisma.fee.create({
        data: {
          studentId: student.id,
          amount,
          dueDate,
          paidDate,
          status,
          installmentNo: installmentIndex + 1,
          description: `Term ${installmentIndex + 1} tuition installment`,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
