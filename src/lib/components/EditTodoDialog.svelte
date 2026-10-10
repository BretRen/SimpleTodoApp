<script lang="ts">
  let {
    dialog = $bindable(),
    text = $bindable(""),
    date = $bindable(),
    onsave,
  }: {
    dialog?: HTMLDialogElement;
    text: string;
    date?: string;
    onsave: () => void;
  } = $props();
</script>

<dialog bind:this={dialog} class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Edit Todo</h3>
    <fieldset class="fieldset mt-4">
      <legend class="fieldset-legend">Edit Todo Title</legend>
      <input
        class="input w-full"
        placeholder="Have you decided what you're going to do?"
        bind:value={text}
      />
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Select a due date</legend>
      <span class="flex gap-2 items-center">
        <input type="datetime-local" class="input flex-1" bind:value={date} />
        <button onclick={() => (date = undefined)} class="btn btn-ghost"
          >Clear</button
        >
      </span>
    </fieldset>
    <div class="modal-action">
      <button type="button" class="btn" onclick={() => dialog?.close()}>
        Cancel
      </button>
      <button type="button" class="btn btn-primary" onclick={() => onsave()}>
        Save
      </button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
