import { useStore } from '@/store';

export function App() {
  const rootQuestion = useStore((s) => s.doc.nodes[s.doc.rootId]?.label ?? '');

  return (
    <div className="flex h-full flex-col bg-[#faf9f5] text-neutral-800">
      <header className="flex items-center gap-2 border-neutral-200 border-b bg-white px-5 py-3">
        <span className="font-semibold text-[#3f6fb0] text-lg tracking-tight">MECE Studio</span>
        <span className="text-neutral-400 text-sm">issue trees, MECE by construction</span>
      </header>

      <main className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-xl rounded-xl border border-neutral-300 border-dashed bg-white/60 p-8 text-center">
          <p className="mb-2 font-medium text-neutral-400 text-xs uppercase tracking-wider">
            Key question
          </p>
          <h1 className="font-semibold text-2xl text-neutral-800">{rootQuestion}</h1>
          <p className="mt-4 text-neutral-500 text-sm">
            The canvas, decomposition, and live MECE checks arrive in the next milestone (M1).
          </p>
        </div>
      </main>
    </div>
  );
}
