<script lang="ts">
  let {
    value = $bindable(""),
    onadd,
  }: {
    value: string;
    onadd: () => void;
  } = $props();
</script>

<form
  onsubmit={(e) => {
    e.preventDefault();
    onadd();
  }}
  class="flex gap-2"
>
  <input
    type="text"
    placeholder="Add a task..."
    bind:value
    class="input input-bordered flex-1"
  />
  <button type="submit" class="btn">Add</button>
</form>
