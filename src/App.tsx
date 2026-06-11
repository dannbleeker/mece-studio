import { Canvas } from '@/components/canvas/Canvas';
import { Inspector } from '@/components/inspector/Inspector';
import { useStore } from '@/store';

export function App() {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.canUndo());
  const canRedo = useStore((s) => s.canRedo());

  return (
    <div className="flex h-full flex-col bg-[#faf9f5] text-neutral-800">
      <header className="flex shrink-0 items-center gap-3 border-neutral-200 border-b bg-white px-5 py-2.5">
        <span className="font-semibold text-[#3f6fb0] text-lg tracking-tight">MECE Studio</span>
        <span className="hidden text-[12px] text-neutral-400 sm:inline">
          issue trees, MECE by construction
        </span>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            className="rounded-md px-2.5 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
          >
            Undo
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={redo}
            className="rounded-md px-2.5 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
          >
            Redo
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <Canvas />
        </main>
        <Inspector />
      </div>
    </div>
  );
}
