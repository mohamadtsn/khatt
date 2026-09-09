'use client';
import { useUi } from '@/state/ui';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export function ExplorerToggle() {
  const open = useUi((s) => s.explorer);
  const setExplorer = useUi((s) => s.setExplorer);
  return (
    <Button
      label="Toggle Explorer"
      icon={<Icon name="explorer" />}
      aria-expanded={open}
      onClick={() => setExplorer(!open)}
    />
  );
}
