import { useState, useEffect } from "react";

export function useCurrentDate() {
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCurrentDate(new Date().toISOString().split("T")[0]);
  }, []);

  return { currentDate, isClient };
}

export function useFormattedDate(date?: string | Date) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (date) {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      setFormattedDate(dateObj.toLocaleDateString("es-ES"));
    } else {
      setFormattedDate(new Date().toLocaleDateString("es-ES"));
    }
  }, [date]);

  if (!isClient) return "";
  return formattedDate;
}

export function getCurrentDateString(): string {
  if (typeof window === "undefined") {
    // En el servidor, retornamos una fecha vacía para evitar hidratación
    return "";
  }
  return new Date().toISOString().split("T")[0];
}
