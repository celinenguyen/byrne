<script lang="ts">
	import { Dialog } from "bits-ui";

	let { children, ...restProps }: Dialog.TriggerProps = $props();
</script>

<Dialog.Trigger {...restProps}>
	{@render children?.()}
</Dialog.Trigger>
