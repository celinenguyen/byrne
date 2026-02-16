<script lang="ts">
	import { cn } from "../../../lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { ref?: HTMLDivElement | null } = $props();
</script>

<div
	bind:this={ref}
	data-slot="item-title"
	class={cn("flex w-fit items-center gap-2 text-sm leading-snug font-medium", className)}
	{...restProps}
>
	{@render children?.()}
</div>
