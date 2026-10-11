<script lang="ts">
  import favicon from "#lib/assets/favicon.svg";
  import Footer from "#lib/components/Footer.svelte";
  import type { LayoutProps } from "./$types";
  import "./layout.css";

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>
<div class="min-h-screen flex flex-col bg-base-100">
  <main class="flex-1 p-6 flex justify-center items-start pt-16">
    {@render children()}
  </main>

  <Footer />
</div>
