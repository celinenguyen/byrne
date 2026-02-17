<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		optional = false,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> & {
		optional?: boolean;
	} = $props();
</script>

<span
	bind:this={ref}
	data-slot="field-label"
	class={cn("text-xs text-muted-foreground mb-1", className)}
	{...restProps}
>
	{@render children?.()}
	{#if optional}
		<span class="text-muted-foreground"> (optional)</span>
	{/if}
</span>
