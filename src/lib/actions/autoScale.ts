export function autoScale(
  node: HTMLElement,
  options?: { minScale?: number; cssVar?: string }
): { destroy(): void } {
  const minScale = options?.minScale ?? 0.5;
  const cssVar = options?.cssVar ?? '--auto-scale';

  function checkOverflow() {
    // Reset scale to measure natural size
    node.style.setProperty(cssVar, '1');
    node.style.overflowY = 'hidden';

    requestAnimationFrame(() => {
      const { scrollHeight, clientHeight } = node;
      if (scrollHeight > clientHeight && clientHeight > 0) {
        const scale = Math.max(minScale, clientHeight / scrollHeight);
        node.style.setProperty(cssVar, String(scale));

        // If at minimum scale and still overflowing, enable scroll
        if (scale <= minScale) {
          requestAnimationFrame(() => {
            if (node.scrollHeight > node.clientHeight) {
              node.style.overflowY = 'auto';
            }
          });
        }
      }
    });
  }

  const ro = new ResizeObserver(checkOverflow);
  ro.observe(node);
  checkOverflow();

  return {
    destroy() {
      ro.disconnect();
      node.style.removeProperty(cssVar);
      node.style.overflowY = '';
    },
  };
}
