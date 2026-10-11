<script lang="ts">
  let { value = $bindable(""), placeholder = "Search..." } = $props();
</script>

<label class="input flex items-center gap-2 w-full my-2">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-4 w-4 opacity-50"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
  <input type="search" class="grow" {placeholder} bind:value />
  {#if value}
    <button
      type="button"
      class="btn btn-ghost btn-xs btn-circle"
      onclick={() => (value = "")}
    >
      ✕
    </button>
  {/if}
</label>
