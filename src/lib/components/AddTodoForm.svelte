<script lang="ts">
  let {
    value = $bindable(""),
    onadd,
    locked,
  }: {
    value: string;
    onadd: () => void;
    locked: boolean;
  } = $props();
</script>

<form
  onsubmit={(e) => {
    e.preventDefault();
    if (locked) return;
    onadd();
  }}
  class="flex gap-2 my-4"
>
  <input
    type="text"
    placeholder="Add a task..."
    bind:value
    disabled={locked}
    class="input input-bordered flex-1"
  />
  <button type="submit" class="btn" disabled={locked}>Add</button>
</form>
