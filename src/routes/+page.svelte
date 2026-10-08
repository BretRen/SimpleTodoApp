<script lang="ts">
  interface Todo {
    id: string;
    text: string;
    done: boolean;
  }

  let todos = $state<Todo[]>([]);
  let input = $state("");
  let filter = $state<"all" | "active" | "completed">("all");

  $effect(() => {
    const saved = localStorage.getItem("todos");
    if (saved) {
      try {
        todos = JSON.parse(saved);
      } catch {}
    }
  });

  $effect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
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
      <span class="text-gray-400 underline">About</span>
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
              <span class={todo.done ? "line-through opacity-40" : ""}>
                {todo.text}
              </span>
            </label>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100"
              onclick={() => remove(todo.id)}
            >
              ✕
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
          class:invisible={todos.some((t) => t.done)}
          onclick={clearCompleted}
        >
          Clear completed
        </button>
      </div>
    {/if}
  </div>
</main>
