'use client';
import { Menu, MenuItem } from '@/components/ui/Menu';
import { Icon } from '@/components/ui/Icon';
import { toast } from '@/components/ui/Toast';

export default function Page() {
  return (
    <main className="grid min-h-full place-items-center gap-4">
      <h1 className="text-[15px] font-semibold tracking-[-0.01em]">Markdown Editor</h1>
      {/* Temporary: exercises the primitives until the real toolbar lands in Task 22. */}
      <Menu trigger={<Icon name="more" />} label="More actions">
        <MenuItem onSelect={() => toast('Nothing here yet')}>Say hello</MenuItem>
      </Menu>
    </main>
  );
}
