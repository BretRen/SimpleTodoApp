<script lang="ts">
  import AboutDialog from "#lib/components/AboutDialog.svelte";
  import AddTodoForm from "#lib/components/AddTodoForm.svelte";
  import EditTodoDialog from "#lib/components/EditTodoDialog.svelte";
  import SearchBox from "#lib/components/SearchBox.svelte";
  import SettingsDialog from "#lib/components/SettingsDialog.svelte";
  import TodoFooter from "#lib/components/TodoFooter.svelte";
  import TodoItem from "#lib/components/TodoItem.svelte";
  import {
    base64ToBytes,
    decryptLegacy,
    decryptWithKey,
    deriveKey,
    encryptStorage,
    parseLegacyStorage,
    parseStorage,
    randomSalt,
  } from "#lib/crypto.ts";
  import { isOfficialWorkspace, officialTodos } from "#lib/official.ts";
  import {
    dueDateFromInput,
    dueDateToInput,
    todosFromStorage,
    todosToStorage,
    type Todo,
    type TodoFilter,
  } from "#lib/todo.ts";
  import { dndzone } from "svelte-dnd-action";
  let query = $state("");
  let isSearch = $state(false);

  let aboutDialog = $state<HTMLDialogElement>();
  let settingsDialog = $state<HTMLDialogElement>();
  let editDialog = $state<HTMLDialogElement>();
  let unlockDialog = $state<HTMLDialogElement>();
  let editTodo = $state<Todo>();
  let editText = $state("");
  let editDate = $state<string | undefined>();

  let todos = $state<Todo[]>([]);
  let input = $state("");
  let filter = $state<TodoFilter>("all");
  let workspace = $state("default");
  let locked = $state(false);
  let encryptionOn = $state(false);
  let unlockPassword = $state("");
  let unlockError = $state("");
  let loaded = false;
  let seenWorkspace = "";
  let sessionKey: CryptoKey | null = null;
  let sessionSalt: Uint8Array | null = null;
  let legacyPayload: string | null = null;
  let saveSerial = 0;
  const latestWrite = new Map<string, number>();

  const visibleTodos = $derived(todos.filter((t) => !t.deleted));
  const official = $derived(isOfficialWorkspace(workspace));

  function storageKey(name: string) {
    return name + "-todos";
  }

  $effect(() => {
    if (workspace === seenWorkspace) return;
    seenWorkspace = workspace;
    unlockPassword = "";
    unlockError = "";
  });

  $effect(() => {
    if (isOfficialWorkspace(workspace)) {
      sessionKey = null;
      sessionSalt = null;
      legacyPayload = null;
      todos = officialTodos();
      locked = false;
      encryptionOn = false;
      loaded = true;
      if (filter === "deleted") filter = "all";
      return;
    }
    if (!workspace) workspace = "default";

    const key = storageKey(workspace);
    const saved = localStorage.getItem(key);
    sessionKey = null;
    sessionSalt = null;
    legacyPayload = null;

    if (!saved) {
      todos = [];
      locked = false;
      encryptionOn = false;
      loaded = true;
      return;
    }

    const envelope = parseStorage(saved);
    if (envelope) {
      try {
        sessionSalt = base64ToBytes(envelope.salt);
      } catch {
        sessionSalt = null;
      }
      todos = [];
      locked = true;
      encryptionOn = true;
      loaded = true;
      return;
    }

    const legacy = parseLegacyStorage(saved);
    if (legacy) {
      legacyPayload = legacy.data;
      todos = [];
      locked = true;
      encryptionOn = true;
      loaded = true;
      return;
    }

    try {
      todos = todosFromStorage(saved);
    } catch {
      todos = [];
    }
    locked = false;
    encryptionOn = false;
    loaded = true;
  });

  $effect(() => {
    if (locked) unlockDialog?.showModal();
    else unlockDialog?.close();
  });

  $effect(() => {
    if (!workspace) workspace = "default";
    if (!loaded || locked || isOfficialWorkspace(workspace)) return;

    const target = storageKey(workspace);
    const json = todosToStorage(todos);
    if (!encryptionOn) {
      localStorage.setItem(target, json);
      return;
    }

    const key = sessionKey;
    const saltBytes = sessionSalt;
    if (!key || !saltBytes) return;

    const generation = ++saveSerial;
    latestWrite.set(target, generation);
    void encryptStorage(json, key, saltBytes).then(
      (stored) => {
        if (latestWrite.get(target) !== generation) return;
        localStorage.setItem(target, stored);
      },
      () => {},
    );
  });

  async function unlock() {
    const password = unlockPassword.trim();
    if (!password || (!sessionSalt && !legacyPayload)) {
      unlockError =
        sessionSalt || legacyPayload
          ? "Enter the encryption password"
          : "Corrupted data";
      return;
    }

    const saved = localStorage.getItem(storageKey(workspace));
    if (!saved) {
      unlockError = "Corrupted data";
      return;
    }

    try {
      let json: string;
      let key: CryptoKey;
      let saltBytes: Uint8Array;

      if (legacyPayload) {
        json = await decryptLegacy(legacyPayload, password);
        saltBytes = randomSalt();
        key = await deriveKey(password, saltBytes);
      } else {
        const envelope = parseStorage(saved);
        if (!envelope || !sessionSalt) {
          unlockError = "Corrupted data";
          return;
        }
        key = await deriveKey(password, sessionSalt);
        json = await decryptWithKey(envelope.data, key);
        saltBytes = sessionSalt;
      }

      const nextTodos = todosFromStorage(json);
      sessionKey = key;
      sessionSalt = saltBytes;
      legacyPayload = null;
      todos = nextTodos;
      unlockPassword = "";
      unlockError = "";
      locked = false;
    } catch {
      unlockError = "Wrong password or corrupted data";
    }
  }

  async function enableEncryption(password: string) {
    const trimmed = password.trim();
    if (!trimmed || locked || encryptionOn || isOfficialWorkspace(workspace)) {
      throw new Error("Cannot enable encryption");
    }
    const nextSalt = randomSalt();
    const key = await deriveKey(trimmed, nextSalt);
    sessionKey = key;
    sessionSalt = nextSalt;
    encryptionOn = true;
  }

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

  function handleDndConsider(e: any) {
    if (official) return;
    const reordered = e.detail.items;
    const deleted = todos.filter((t) => t.deleted);
    todos = [...reordered, ...deleted];
  }

  function handleDndFinalize(e: any) {
    if (official) return;
    const reordered = e.detail.items;
    const deleted = todos.filter((t) => t.deleted);
    todos = [...reordered, ...deleted];
  }

  function add() {
    if (official) return;
    const val = input.trim();
    if (!val) return;
    todos.push({ id: crypto.randomUUID(), text: val, done: false });
    input = "";
  }

  function remove(id: string) {
    if (official) return;
    todos = todos.filter((t) => t.id !== id);
  }

  function openEdit(todo: Todo) {
    if (official) return;
    editTodo = todo;
    editText = todo.text;
    editDate = dueDateToInput(todo.dueDate);
    editDialog?.showModal();
  }

  function update() {
    if (official) return;
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
    if (official) return;
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
    {#if locked}
      <button
        onclick={() => unlockDialog?.showModal()}
        class="text-gray-400 underline cursor-pointer hover:opacity-80 transition"
        >Unlock</button
      >
    {/if}
  </div>
  <div class="mb-4">
    <span class="text-gray-400">Function: </span>
    <button
      onclick={() => (isSearch = !isSearch)}
      class="text-gray-400 underline cursor-pointer hover:opacity-80 transition"
      >Search</button
    >
  </div>
  {#if official}
    <div role="alert" class="alert alert-info alert-soft mb-2">
      <span>This official roadmap can't be changed.</span>
    </div>
  {:else}
    <AddTodoForm bind:value={input} onadd={add} {locked} />
  {/if}
  {#if isSearch}
    <SearchBox bind:value={query} placeholder="Search todos..." />
  {/if}

  {#if filter === "deleted"}
    <div role="alert" class="alert alert-error alert-soft mb-2">
      <span>Deleted to-do(s) will not be saved!!</span>
    </div>
  {/if}

  {#if filter === "all" && !isSearch && !locked && !official}
    <div
      class="border border-base-200 rounded-box divide-y divide-base-200"
      use:dndzone={{
        items: visibleTodos,
        flipDurationMs: 150,
        dropTargetStyle: {
          outline: "2px dashed oklch(var(--s))",
          backgroundColor: "oklch(var(--s) / 0.1)",
        },
      }}
      onconsider={handleDndConsider}
      onfinalize={handleDndFinalize}
    >
      {#each visibleTodos as todo (todo.id)}
        <TodoItem {todo} onedit={openEdit} onremove={remove} readonly={official} />
      {/each}
    </div>
  {:else if locked}
    <div
      class="border border-base-200 rounded-box divide-y divide-base-200 flex justify-center items-center"
    >
      <p class="text-base-content/30">
        You have to unlock it! Or change workspace in settings
      </p>
    </div>
  {:else}
    <div class="border border-base-200 rounded-box divide-y divide-base-200">
      {#each filtered as todo (todo.id)}
        <TodoItem {todo} onedit={openEdit} onremove={remove} readonly={official} />
      {/each}
    </div>
  {/if}

  <TodoFooter
    {remaining}
    bind:filter
    {todos}
    onclear={clearCompleted}
    readonly={official}
  />
</div>

<AboutDialog bind:dialog={aboutDialog} />
<SettingsDialog
  bind:dialog={settingsDialog}
  bind:workspace
  encryptionEnabled={encryptionOn}
  onEnableEncryption={enableEncryption}
/>
<EditTodoDialog
  bind:dialog={editDialog}
  bind:text={editText}
  bind:date={editDate}
  onsave={update}
/>

<dialog bind:this={unlockDialog} class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Unlock workspace</h3>
    <fieldset class="fieldset w-full mt-4">
      <legend class="fieldset-legend">Encryption password</legend>
      <form
        class="flex gap-2"
        onsubmit={(e) => {
          e.preventDefault();
          unlock();
        }}
      >
        <input
          bind:value={unlockPassword}
          type="password"
          class="input flex-1"
          placeholder="Password"
          autocomplete="current-password"
        />
        <button class="btn" type="submit">Unlock</button>
      </form>
      {#if unlockError}
        <p class="text-error text-sm mt-2">{unlockError}</p>
      {/if}
    </fieldset>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
