"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateGrade } from "@/lib/utils";

type ExamData = {
  id: string;
  totalMarks: number;
};

type StudentData = {
  id: string;
  rollNo: string;
  user: {
    name: string;
  };
};

type ExistingResult = {
  studentId: string;
  marksObtained: number;
  remarks?: string | null;
};

type ResultDraft = {
  studentId: string;
  marksObtained: number;
  remarks: string;
};

type ResultsEntryTableProps = {
  exam: ExamData;
  students: StudentData[];
  existingResults?: ExistingResult[];
  onSave: (results: ResultDraft[]) => void | Promise<void>;
};

export default function ResultsEntryTable({
  exam,
  students,
  existingResults = [],
  onSave,
}: ResultsEntryTableProps) {
  const [submitting, setSubmitting] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, ResultDraft>>(
    students.reduce<Record<string, ResultDraft>>((accumulator, student) => {
      const existing = existingResults.find((item) => item.studentId === student.id);
      accumulator[student.id] = {
        studentId: student.id,
        marksObtained: existing?.marksObtained ?? 0,
        remarks: existing?.remarks ?? "",
      };
      return accumulator;
    }, {}),
  );

  const rows = useMemo(
    () =>
      students.map((student) => {
        const draft = drafts[student.id];
        return {
          ...student,
          ...draft,
          grade: calculateGrade(draft?.marksObtained ?? 0, exam.totalMarks),
        };
      }),
    [drafts, exam.totalMarks, students],
  );

  const save = async () => {
    setSubmitting(true);
    try {
      await onSave(Object.values(drafts));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-brand-border bg-brand-card shadow-premium">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
              <TableHead>#</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Roll No</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell className="text-brand-muted">{index + 1}</TableCell>
                <TableCell>{row.user.name}</TableCell>
                <TableCell className="font-mono text-brand-muted">{row.rollNo}</TableCell>
                <TableCell>
                  <input
                    type="number"
                    min={0}
                    max={exam.totalMarks}
                    value={row.marksObtained}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [row.id]: {
                          ...current[row.id],
                          marksObtained: Number(event.target.value),
                        },
                      }))
                    }
                    className="h-10 w-24 rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="default">{row.grade}</Badge>
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    value={row.remarks}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [row.id]: {
                          ...current[row.id],
                          remarks: event.target.value,
                        },
                      }))
                    }
                    className="h-10 w-full min-w-40 rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={submitting}>
          {submitting ? "Saving..." : "Save All Results"}
        </Button>
      </div>
    </div>
  );
}
