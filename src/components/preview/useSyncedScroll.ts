import { useEffect, type RefObject } from 'react';
import { useUi } from '@/state/ui';

/* Scrolling one pane moves the other proportionally. The `lock` flag stops the
   two from driving each other into a feedback loop, which is what makes a naive
   implementation of this stutter. */
export function useSyncedScroll(
  a: RefObject<HTMLElement | null>,
  b: RefObject<HTMLElement | null>
): void {
  const sync = useUi((s) => s.sync);
  useEffect(() => {
    const left = a.current;
    const right = b.current;
    if (!sync || !left || !right) return;
    let lock: HTMLElement | null = null;

    const follow = (source: HTMLElement, target: HTMLElement) => () => {
      if (lock && lock !== source) return;
      lock = source;
      const range = source.scrollHeight - source.clientHeight;
      const ratio = range > 0 ? source.scrollTop / range : 0;
      target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
      requestAnimationFrame(() => {
        lock = null;
      });
    };

    const onLeft = follow(left, right);
    const onRight = follow(right, left);
    left.addEventListener('scroll', onLeft, { passive: true });
    right.addEventListener('scroll', onRight, { passive: true });
    return () => {
      left.removeEventListener('scroll', onLeft);
      right.removeEventListener('scroll', onRight);
    };
  }, [a, b, sync]);
}
