<script lang="ts">
  export let estimate: string | null;

  // Color scale around #2D2DF6 — light to dark: XS → XL, always white text
  const bg: Record<string, string> = {
    XS: '#9494f9',
    S:  '#6060f8',
    M:  '#2D2DF6',
    L:  '#1a1aae',
    XL: '#0f0f5e',
  };
</script>

{#if estimate}
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
    style="background-color: {bg[estimate] ?? '#2D2DF6'}; color: #ffffff;"
  >
    {estimate}
  </span>
{:else}
  <span class="text-xs text-muted-foreground">—</span>
{/if}
