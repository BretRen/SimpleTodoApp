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
    <input type="checkbox" bind:checked={todo.done} class="checkbox checkbox-sm" />
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
    onclick={() => onedit(todo)}
  >
    <span class="material-symbols-outlined text-xl!"> edit </span>
  </button>
  <button
    type="button"
    class="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100"
    onclick={() => onremove(todo.id)}
  >
    <span class="material-symbols-outlined text-xl!"> delete </span>
  </button>
</div>
