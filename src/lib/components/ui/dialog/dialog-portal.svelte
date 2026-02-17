<script lang="ts">
	import { Dialog } from "bits-ui";

	let { children, ...restProps }: Dialog.PortalProps = $props();
</script>

<Dialog.Portal {...restProps}>
	{@render children?.()}
</Dialog.Portal>
