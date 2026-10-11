<script lang="ts">
  let {
    dialog = $bindable(),
    workspace = $bindable(),
  }: {
    dialog?: HTMLDialogElement;
    workspace: string;
  } = $props();
  let editWorkspace = $state(workspace);
  let workspaces = $state<string[]>([]);
  let newWorkspace = $state("");
  const disabled = $derived(
    !editWorkspace.trim() || editWorkspace === workspace,
  );

  let confirmDeleteWorkspace = $state(false);

  function loadWorkspaces() {
    workspaces = Object.keys(localStorage)
      .filter((key) => key.endsWith("-todos"))
      .map((key) => key.replace("-todos", ""));
  }

  function save() {
    if (!editWorkspace.trim()) return;
    workspace = editWorkspace;
    dialog?.close();
  }

  function createNew() {
    const val = newWorkspace.trim();
    if (!val) return;
    editWorkspace = val;
    newWorkspace = "";
  }

  function deleteWorkspace() {
    if (!confirmDeleteWorkspace) {
      confirmDeleteWorkspace = true;
      return;
    }

    localStorage.removeItem(editWorkspace + "-todos");
    loadWorkspaces();

    if (editWorkspace === workspace) {
      workspace = "default";
    }

    editWorkspace = workspace;
    confirmDeleteWorkspace = false;
  }

  $effect(() => {
    loadWorkspaces();
    editWorkspace = workspace;
  });
</script>

<dialog bind:this={dialog} class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Settings</h3>

    <fieldset class="fieldset mt-4">
      <legend class="fieldset-legend">Workspace</legend>

      <select
        onchange={() => (confirmDeleteWorkspace = false)}
        bind:value={editWorkspace}
        class="select w-full"
      >
        {#each workspaces as ws}
          <option value={ws}>{ws}</option>
        {/each}
        {#if editWorkspace && !workspaces.includes(editWorkspace)}
          <option value={editWorkspace}>{editWorkspace} (new)</option>
        {/if}
      </select>

      <div class="flex gap-2 mt-2">
        <input
          type="text"
          placeholder="Or create a new one"
          class="input flex-1"
          bind:value={newWorkspace}
          onkeydown={(e) => e.key === "Enter" && createNew()}
        />
        <button type="button" class="btn" onclick={createNew}>Add</button>
      </div>
      <button
        class="btn btn-soft btn-error"
        disabled={editWorkspace === "default"}
        onclick={deleteWorkspace}
      >
        {editWorkspace === "default"
          ? "You can not delete default workspace"
          : confirmDeleteWorkspace
            ? "Confirm Delete"
            : "Delete Workspace"}
      </button>
    </fieldset>

    <div class="modal-action">
      <button class="btn" onclick={() => dialog?.close()}>Cancel</button>
      <button class="btn btn-primary" {disabled} onclick={save}>Save</button>
    </div>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
