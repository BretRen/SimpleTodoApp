<script lang="ts">
  import AboutDialog from "#lib/components/AboutDialog.svelte";
  import AddTodoForm from "#lib/components/AddTodoForm.svelte";
  import EditTodoDialog from "#lib/components/EditTodoDialog.svelte";
  import SearchBox from "#lib/components/SearchBox.svelte";
  import SettingsDialog from "#lib/components/SettingsDialog.svelte";
  import TodoFooter from "#lib/components/TodoFooter.svelte";
  import TodoItem from "#lib/components/TodoItem.svelte";
  import {
    dueDateFromInput,
    dueDateToInput,
    todosFromStorage,
    todosToStorage,
    type Todo,
    type TodoFilter,
  } from "#lib/todo.ts";
  let query = $state("");
  let isSearch = $state(false);

  let aboutDialog = $state<HTMLDialogElement>();
  let settingsDialog = $state<HTMLDialogElement>();
  let editDialog = $state<HTMLDialogElement>();
  let editTodo = $state<Todo>();
  let editText = $state("");
  let editDate = $state<string | undefined>();

  let todos = $state<Todo[]>([]);
  let input = $state("");
  let filter = $state<TodoFilter>("all");
  let workspace = $state("default");
  let loaded = false;

  $effect(() => {
    if (!workspace) workspace = "default";

    const key = workspace + "-todos";
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        todos = todosFromStorage(saved);
      } catch {}
    } else {
      todos = [];
    }
    loaded = true;
  });

  $effect(() => {
    if (!workspace) workspace = "default";
    if (!loaded) return;
    localStorage.setItem(workspace + "-todos", todosToStorage(todos));
  });

  const remaining = $derived(todos.filter((t) => !t.done && !t.deleted).length);
  const filtered = $derived(
    todos.filter((t) => {
      const matchQuery =
        !isSearch ||
        !query ||
        t.text.toLowerCase().includes(query.toLowerCase());
      const matchFilter =
        (filter === "all" && !t.deleted) ||
        (filter === "active" && !t.done && !t.deleted) ||
        (filter === "completed" && t.done && !t.deleted) ||
        (filter === "deleted" && t.deleted);

      return matchQuery && matchFilter;
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

  function openEdit(todo: Todo) {
    editTodo = todo;
    editText = todo.text;
    editDate = dueDateToInput(todo.dueDate);
    editDialog?.showModal();
  }

  function update() {
    const id = editTodo?.id;
    const text = editText;
    const next = text?.trim();
    if (!id || !next) return;

    const dueDate = dueDateFromInput(editDate);

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

<div class="w-full max-w-md">
  <h1 class="text-2xl font-bold tracking-tight">Todos</h1>
  <div class="mt-4">
    <span class="text-gray-400">Maybe try create a todo?</span>
    <button
      onclick={() => aboutDialog?.showModal()}
      class="text-gray-400 underline cursor-pointer hover:opacity-80 transition"
      >About</button
    >
    <button
      onclick={() => settingsDialog?.showModal()}
      class="text-gray-400 underline cursor-pointer hover:opacity-80 transition"
      >Settings</button
    >
  </div>
  <div class="mb-4">
    <span class="text-gray-400">Function: </span>
    <button
      onclick={() => (isSearch = !isSearch)}
      class="text-gray-400 underline cursor-pointer hover:opacity-80 transition"
      >Search</button
    >
  </div>
  <AddTodoForm bind:value={input} onadd={add} />
  {#if isSearch}
    <SearchBox bind:value={query} placeholder="Search todos..." />
  {/if}

  <div class="border border-base-200 rounded-box divide-y divide-base-200">
    {#each filtered as todo (todo.id)}
      <TodoItem {todo} onedit={openEdit} onremove={remove} />
    {/each}
  </div>

  <TodoFooter {remaining} bind:filter {todos} onclear={clearCompleted} />
</div>

<AboutDialog bind:dialog={aboutDialog} />
<SettingsDialog bind:dialog={settingsDialog} bind:workspace />
<EditTodoDialog
  bind:dialog={editDialog}
  bind:text={editText}
  bind:date={editDate}
  onsave={update}
/>
