<script lang="ts">
  import { formatRelative, isOverdue, type Todo } from "#lib/todo.ts";

  let {
    todo,
    onedit,
    onremove,
  }: {
    todo: Todo;
    onedit: (todo: Todo) => void;
    onremove: (id: string) => void;
  } = $props();
</script>

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
        {#if todo.dueDate && !todo.done && !todo.deleted}
          Due: {formatRelative(todo.dueDate)}
        {/if}
      </p>
    </span>
  </label>
  {#if !todo.deleted}
    <button
      type="button"
      class="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100"
      onclick={() => onedit(todo)}
    >
      <span class="material-symbols-outlined text-xl!"> edit </span>
    </button>
  {:else}
    <button
      type="button"
      class="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100"
      onclick={() => (todo.deleted = false)}
    >
      <span class="material-symbols-outlined text-xl!"> undo </span>
    </button>
  {/if}

  <button
    type="button"
    class="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100"
    onclick={() => (todo.deleted ? onremove(todo.id) : (todo.deleted = true))}
  >
    <span
      class="material-symbols-outlined text-xl!"
      class:text-red-500={todo.deleted}
    >
      delete
    </span>
  </button>
</div>
