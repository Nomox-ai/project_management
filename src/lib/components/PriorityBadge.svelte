<script lang="ts">
  export let priority: string;

  const styles: Record<string, string> = {
    urgent: 'bg-red-100 text-red-800',
    high:   'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low:    'bg-blue-100 text-blue-800',
    none:   'bg-secondary text-secondary-foreground'
  };

  $: style = styles[priority?.toLowerCase()] ?? styles.none;
</script>

<span class="inline-block px-2 py-0.5 rounded-full text-xs capitalize font-medium {style}">
  {priority ?? 'none'}
</span>
