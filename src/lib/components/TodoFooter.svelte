<script lang="ts">
  import type { Todo, TodoFilter } from "#lib/todo.ts";

  let {
    remaining,
    filter = $bindable(),
    todos,
    onclear,
  }: {
    remaining: number;
    filter: TodoFilter;
    todos: Todo[];
    onclear: () => void;
  } = $props();
</script>

<div class="flex items-center justify-between text-xs text-base-content/60 px-1">
  <span>{remaining} {remaining === 1 ? "item" : "items"} left</span>

  <div class="join">
    <button
      type="button"
      class="join-item btn btn-xs {filter === 'all' ? 'btn-active' : 'btn-ghost'}"
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
    onclick={onclear}
  >
    Clear completed
  </button>
</div>
