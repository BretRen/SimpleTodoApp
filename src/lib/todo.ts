export interface Todo {
  id: string;
  text: string;
  done: boolean;
  dueDate?: Temporal.ZonedDateTime;
}

export type TodoFilter = "all" | "active" | "completed";

export function isOverdue(dueDate?: Temporal.ZonedDateTime): boolean {
  if (!dueDate) return false;
  const now = Temporal.Now.zonedDateTimeISO();
  return Temporal.ZonedDateTime.compare(dueDate, now) < 0;
}

export function formatRelative(zdt: Temporal.ZonedDateTime) {
  if (!zdt) return "";

  const now = Temporal.Now.zonedDateTimeISO();
  const duration = now.until(zdt, { largestUnit: "day" });

  const rtf = new Intl.RelativeTimeFormat(navigator.language, {
    numeric: "auto",
  });

  if (Math.abs(duration.days) >= 1) {
    return rtf.format(duration.days, "day");
  }
  if (Math.abs(duration.hours) >= 1) {
    return rtf.format(duration.hours, "hour");
  }
  if (Math.abs(duration.minutes) >= 1) {
    return rtf.format(duration.minutes, "minute");
  }
  return rtf.format(duration.seconds, "second");
}

export function dueDateToInput(
  dueDate?: Temporal.ZonedDateTime,
): string | undefined {
  return dueDate
    ? dueDate.toPlainDateTime().toString().slice(0, 16)
    : undefined;
}

export function dueDateFromInput(
  value?: string,
): Temporal.ZonedDateTime | undefined {
  return value
    ? Temporal.PlainDateTime.from(value).toZonedDateTime(
        Temporal.Now.timeZoneId(),
      )
    : undefined;
}

export function todosFromStorage(saved: string): Todo[] {
  const parsed = JSON.parse(saved);
  return parsed.map((t: any) => ({
    ...t,
    dueDate: t.dueDate ? Temporal.ZonedDateTime.from(t.dueDate) : undefined,
  }));
}

export function todosToStorage(todos: Todo[]): string {
  return JSON.stringify(
    todos.map((t) => ({
      ...t,
      dueDate: t.dueDate?.toString(),
    })),
  );
}
