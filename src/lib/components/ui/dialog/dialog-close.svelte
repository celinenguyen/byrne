<script lang="ts">
	import { Dialog } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let { class: className, child, children, ...restProps }: Dialog.CloseProps = $props();
</script>

<Dialog.Close class={cn("", className)} {...restProps} {child}>
	{@render children?.()}
</Dialog.Close>
