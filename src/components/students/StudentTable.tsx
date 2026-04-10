"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, getInitials } from "@/lib/utils";

type StudentRow = {
  id: string;
  rollNo: string;
  phone: string;
  enrolledAt: string | Date;
  attendancePercentage?: number;
  user: {
    name: string;
    email: string;
  };
  batch: {
    name: string;
    subject?: string;
  };
};

type Pagination = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
};

type StudentTableProps = {
  students: StudentRow[];
  loading?: boolean;
  onEdit?: (student: StudentRow) => void;
  onDelete?: (student: StudentRow) => void;
  onView?: (student: StudentRow) => void;
  pagination: Pagination;
};

type SortKey = "name" | "rollNo" | "enrolledAt";

export default function StudentTable({
  students,
  loading = false,
  onEdit,
  onDelete,
  onView,
  pagination,
}: StudentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("enrolledAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedStudents = useMemo(() => {
    const items = [...students];
    items.sort((a, b) => {
      let comparison = 0;

      if (sortKey === "name") {
        comparison = a.user.name.localeCompare(b.user.name);
      }
      if (sortKey === "rollNo") {
        comparison = a.rollNo.localeCompare(b.rollNo);
      }
      if (sortKey === "enrolledAt") {
        comparison = new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime();
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return items;
  }, [students, sortDirection, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "enrolledAt" ? "desc" : "asc");
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-brand-border bg-brand-card shadow-premium">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
              <TableHead>#</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="inline-flex items-center gap-2"
                >
                  Student
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("rollNo")}
                  className="inline-flex items-center gap-2"
                >
                  Roll No
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("enrolledAt")}
                  className="inline-flex items-center gap-2"
                >
                  Enrolled
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>Att%</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-12 w-full rounded-2xl" />
                    </TableCell>
                  </TableRow>
                ))
              : sortedStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="text-brand-muted">
                      {(pagination.page - 1) * Math.max(students.length, 1) + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(student.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{student.user.name}</p>
                          <p className="text-xs text-brand-muted">{student.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{student.rollNo}</TableCell>
                    <TableCell className="text-brand-muted">{student.batch.name}</TableCell>
                    <TableCell className="text-brand-muted">{student.phone}</TableCell>
                    <TableCell className="text-brand-muted">{formatDate(student.enrolledAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (student.attendancePercentage ?? 0) >= 75
                            ? "success"
                            : (student.attendancePercentage ?? 0) >= 60
                              ? "warning"
                              : "danger"
                        }
                      >
                        {(student.attendancePercentage ?? 0).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          aria-label={`View ${student.user.name}`}
                          onClick={() => onView?.(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          aria-label={`Edit ${student.user.name}`}
                          onClick={() => onEdit?.(student)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          aria-label={`Delete ${student.user.name}`}
                          className="hover:border-red-500 hover:text-red-300"
                          onClick={() => onDelete?.(student)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-brand-muted">
          Page {pagination.page} of {pagination.totalPages} · {pagination.total} students
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => pagination.onPageChange(pagination.page - 1)}
          >
            Prev
          </Button>
          {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
            <Button
              key={page}
              type="button"
              variant={page === pagination.page ? "default" : "secondary"}
              size="sm"
              onClick={() => pagination.onPageChange(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => pagination.onPageChange(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
