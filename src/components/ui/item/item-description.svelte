<script lang="ts">
	import { cn } from "../../../lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLParagraphElement> & { ref?: HTMLParagraphElement | null } = $props();
</script>

<p
	bind:this={ref}
	data-slot="item-description"
	class={cn("text-muted-foreground text-sm leading-normal font-normal", className)}
	{...restProps}
>
	{@render children?.()}
</p>
