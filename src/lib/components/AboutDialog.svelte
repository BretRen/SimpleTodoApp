<script lang="ts">
  let { dialog = $bindable() }: { dialog?: HTMLDialogElement } = $props();
</script>

<dialog bind:this={dialog} class="modal">
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
