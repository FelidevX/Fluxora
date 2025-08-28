"use client";

import { useFormattedDate } from "@/hooks/useDate";

interface FormattedDateProps {
  date: string | Date;
  className?: string;
}

export default function FormattedDate({ date, className }: FormattedDateProps) {
  const formattedDate = useFormattedDate(date);

  if (!formattedDate) {
    return <span className={className}>--</span>;
  }

  return <span className={className}>{formattedDate}</span>;
}
