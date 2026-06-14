import { lazy, Suspense, useEffect } from 'react';
import { StartPage } from '@/components/start/StartPage';
import { useStore } from '@/store';

// The editor surface — the React Flow + dagre canvas, inspector, and clustered
// header — is the heavy half of the app and never shows on the Start landing.
// Load it as its own chunk so React Flow et al. stay off the cold-start path;
// Start is eager, and opening a tree pulls the editor in.
const Workspace = lazy(() => import('./Workspace').then((m) => ({ default: m.Workspace })));

/** Top-level router: the Start workspace shell, or a tree open on the canvas. */
export function App() {
  const view = useStore((s) => s.view);

  // Warm the editor chunk in the background once Start is showing, so the first
  // jump into a tree is instant — without weighing down first paint.
  useEffect(() => {
    if (view === 'start') void import('./Workspace');
  }, [view]);

  if (view === 'start') return <StartPage />;
  return (
    <Suspense fallback={<div className="h-full bg-[#faf9f5]" />}>
      <Workspace />
    </Suspense>
  );
}
