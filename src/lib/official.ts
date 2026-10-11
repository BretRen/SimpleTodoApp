import type { Todo } from "#lib/todo.ts";

export const officialWorkspaceName = "roadmap";

const items: Array<Pick<Todo, "id" | "text" | "done"> & { due?: string }> = [
    { id: "roadmap-1", text: "encryption", done: true },
    {
        id: "roadmap-priority",
        text: "Priority",
        done: false,
    },
];

export function isOfficialWorkspace(name: string) {
    return name === officialWorkspaceName;
}

export function officialTodos(): Todo[] {
    const zone = Temporal.Now.timeZoneId();
    return items.map((item) => ({
        id: item.id,
        text: item.text,
        done: item.done,
        dueDate: item.due
            ? Temporal.PlainDateTime.from(item.due).toZonedDateTime(zone)
            : undefined,
    }));
}
