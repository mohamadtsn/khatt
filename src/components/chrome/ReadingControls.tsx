'use client';
import { useEffect } from 'react';
import { useUi } from '@/state/ui';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export function ReadingControls() {
  const reading = useUi((s) => s.reading);
  const locked = useUi((s) => s.readingLocked);
  const setReading = useUi((s) => s.setReading);
  const setLocked = useUi((s) => s.setReadingLocked);

  /* The class lives on <body> so the print stylesheet and the chrome can both
     react to it without threading state through every component. */
  useEffect(() => {
    document.body.classList.toggle('reading', reading);
    return () => document.body.classList.remove('reading');
  }, [reading]);

  useEffect(() => {
    if (!reading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReading(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [reading, setReading]);

  if (!reading) return null;

  return (
    <div className="material-overlay fixed end-4 top-4 z-50 flex items-center gap-1 rounded-[var(--radius-lg)] p-1">
      <Button
        label={locked ? 'Unlock reading mode' : 'Lock reading mode'}
        icon={<Icon name={locked ? 'lock' : 'unlock'} />}
        onClick={() => setLocked(!locked)}
      />
      <Button label="Leave reading mode" icon={<Icon name="clear" />} onClick={() => setReading(false)} />
    </div>
  );
}
