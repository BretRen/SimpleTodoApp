<script lang="ts">
  let aboutDialog = $state<HTMLDialogElement>();
  let editDialog = $state<HTMLDialogElement>();
  let editTodo = $state<Todo>();
  let editText = $state("");
  let editDate = $state<string | undefined>();

  interface Todo {
    id: string;
    text: string;
    done: boolean;
    dueDate?: Temporal.ZonedDateTime;
  }

  let todos = $state<Todo[]>([]);
  let input = $state("");
  let filter = $state<"all" | "active" | "completed">("all");

  $effect(() => {
    const saved = localStorage.getItem("todos");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        todos = parsed.map((t: any) => ({
          ...t,
          dueDate: t.dueDate
            ? Temporal.ZonedDateTime.from(t.dueDate)
            : undefined,
        }));
      } catch {}
    }
  });

  $effect(() => {
    localStorage.setItem(
      "todos",
      JSON.stringify(
        todos.map((t) => ({
          ...t,
          dueDate: t.dueDate?.toString(),
        })),
      ),
    );
  });

  const remaining = $derived(todos.filter((t) => !t.done).length);
  const filtered = $derived(
    todos.filter((t) => {
      if (filter === "active") return !t.done;
      if (filter === "completed") return t.done;
      return true;
    }),
  );

  function add() {
    const val = input.trim();
    if (!val) return;
    todos.push({ id: crypto.randomUUID(), text: val, done: false });
    input = "";
  }

  function remove(id: string) {
    todos = todos.filter((t) => t.id !== id);
  }

  function isOverdue(dueDate?: Temporal.ZonedDateTime): boolean {
    if (!dueDate) return false;
    const now = Temporal.Now.zonedDateTimeISO();
    return Temporal.ZonedDateTime.compare(dueDate, now) < 0;
  }

  function formatRelative(zdt: Temporal.ZonedDateTime) {
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

  function update() {
    const id = editTodo?.id;
    const text = editText;
    const next = text?.trim();
    if (!id || !next) return;

    const dueDate = editDate
      ? Temporal.PlainDateTime.from(editDate).toZonedDateTime(
          Temporal.Now.timeZoneId(),
        )
      : undefined;

    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, text: next, dueDate } : todo,
    );
    editDialog?.close();
    editText = "";
    editDate = undefined;
    editTodo = undefined;
  }

  function clearCompleted() {
    todos = todos.filter((t) => !t.done);
  }
</script>

<svelte:head>
  <title>Simple Todos App</title>
</svelte:head>

<main
  class="min-h-screen bg-base-100 p-6 flex justify-center items-start pt-16"
>
  <div class="w-full max-w-md space-y-4">
    <h1 class="text-2xl font-bold tracking-tight">Todos</h1>
    <p>
      <span class="text-gray-400">Maybe try create a todo?</span>
      <button
        onclick={() => aboutDialog?.showModal()}
        class="text-gray-400 underline">About</button
      >
    </p>
    <form
      onsubmit={(e) => {
        e.preventDefault();
        add();
      }}
      class="flex gap-2"
    >
      <input
        type="text"
        placeholder="Add a task..."
        bind:value={input}
        class="input input-bordered flex-1"
      />
      <button type="submit" class="btn">Add</button>
    </form>

    {#if todos.length > 0}
      <div class="border border-base-200 rounded-box divide-y divide-base-200">
        {#each filtered as todo (todo.id)}
          <div class="flex items-center justify-between p-3 gap-3">
            <label class="flex items-center gap-3 flex-1 cursor-pointer">
              <input
                type="checkbox"
                bind:checked={todo.done}
                class="checkbox checkbox-sm"
              />
              <span class="flex flex-col">
                <span class={todo.done ? "line-through opacity-40" : ""}>
                  {todo.text}
                </span>
                <p class="text-xs" class:text-error={isOverdue(todo.dueDate)}>
                  {#if todo.dueDate && !todo.done}
                    Due: {formatRelative(todo.dueDate)}
                  {/if}
                </p>
              </span>
            </label>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100"
              onclick={() => {
                editTodo = todo;
                editText = todo.text;
                editDate = todo.dueDate
                  ? todo.dueDate.toPlainDateTime().toString().slice(0, 16)
                  : undefined;
                editDialog?.showModal();
              }}
            >
              <span class="material-symbols-outlined text-xl!"> edit </span>
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100"
              onclick={() => remove(todo.id)}
            >
              <span class="material-symbols-outlined text-xl!"> delete </span>
            </button>
          </div>
        {/each}
      </div>

      <div
        class="flex items-center justify-between text-xs text-base-content/60 px-1"
      >
        <span>{remaining} {remaining === 1 ? "item" : "items"} left</span>

        <div class="join">
          <button
            type="button"
            class="join-item btn btn-xs {filter === 'all'
              ? 'btn-active'
              : 'btn-ghost'}"
            onclick={() => (filter = "all")}
          >
            All
          </button>
          <button
            type="button"
            class="join-item btn btn-xs {filter === 'active'
              ? 'btn-active'
              : 'btn-ghost'}"
            onclick={() => (filter = "active")}
          >
            Active
          </button>
          <button
            type="button"
            class="join-item btn btn-xs {filter === 'completed'
              ? 'btn-active'
              : 'btn-ghost'}"
            onclick={() => (filter = "completed")}
          >
            Completed
          </button>
        </div>
        <button
          type="button"
          class="hover:underline"
          class:invisible={!todos.some((t) => t.done)}
          onclick={clearCompleted}
        >
          Clear completed
        </button>
      </div>
    {/if}
  </div>
</main>

<dialog bind:this={aboutDialog} class="modal">
  <div class="modal-box flex justify-center items-center flex-col">
    <h3 class="text-lg font-bold">About</h3>
    <p>
      This is a practice project created during the Terra preparation week. It
      might not see many updates, though I do use it myself :D
    </p>
    <p class="text-gray-500">Made by Pidan</p>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>

<dialog bind:this={editDialog} class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Edit Todo</h3>
    <fieldset class="fieldset mt-4">
      <legend class="fieldset-legend">Edit Todo Title</legend>
      <input
        class="input w-full"
        placeholder="Have you decided what you're going to do?"
        bind:value={editText}
      />
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Select a due date</legend>
      <span class="flex gap-2 items-center">
        <input
          type="datetime-local"
          class="input flex-1"
          bind:value={editDate}
        />
        <button onclick={() => (editDate = undefined)} class="btn btn-ghost"
          >Clear</button
        >
      </span>
    </fieldset>
    <div class="modal-action">
      <button type="button" class="btn" onclick={() => editDialog?.close()}>
        Cancel
      </button>
      <button type="button" class="btn btn-primary" onclick={() => update()}>
        Save
      </button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
