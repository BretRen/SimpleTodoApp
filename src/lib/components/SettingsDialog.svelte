<script lang="ts">
  let {
    dialog = $bindable(),
    workspace = $bindable(),
  }: {
    dialog?: HTMLDialogElement;
    workspace: string;
  } = $props();
  let editWorkspace = $state(workspace);
  let disabled = $state(true);

  function save() {
    console.log("test");
    workspace = editWorkspace;
    dialog?.close();
  }
</script>

<dialog bind:this={dialog} class="modal">
  <div class="modal-box flex justify-center items-center flex-col">
    <h3 class="text-lg font-bold">Settings</h3>
    <fieldset class="fieldset mt-4">
      <legend class="fieldset-legend">Workspace</legend>
      <span>
        <input
          bind:value={editWorkspace}
          onchange={() => (disabled = editWorkspace === workspace)}
          class="input w-full"
          placeholder="Workspace"
        />
      </span>
    </fieldset>
    <button class="btn mt-4" {disabled} onclick={() => save()}>Save</button>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
