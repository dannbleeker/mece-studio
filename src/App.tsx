import { lazy, Suspense, useEffect } from 'react';
import { StartPage } from '@/components/start/StartPage';
import { parseDoc } from '@/services/storage';
import { useStore } from '@/store';

/** Open a `#doc=<base64 JSON>` share link (from "Copy share link") as a new tree. */
function openSharedDocFromHash(): void {
  const match = window.location.hash.match(/^#doc=(.+)$/);
  if (!match?.[1]) return;
  try {
    const bin = atob(decodeURIComponent(match[1]));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const doc = parseDoc(new TextDecoder().decode(bytes));
    if (doc) useStore.getState().openDoc(doc);
  } catch {
    // A malformed link just lands on Start — nothing to open.
  }
  // Clear the hash so a reload doesn't re-import the same tree.
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

// The editor surface — the React Flow + dagre canvas, inspector, and clustered
// header — is the heavy half of the app and never shows on the Start landing.
// Load it as its own chunk so React Flow et al. stay off the cold-start path;
// Start is eager, and opening a tree pulls the editor in.
const Workspace = lazy(() => import('./Workspace').then((m) => ({ default: m.Workspace })));

/** Top-level router: the Start workspace shell, or a tree open on the canvas. */
export function App() {
  const view = useStore((s) => s.view);

  // Open a shared tree from a `#doc=` link once, on first mount.
  useEffect(() => {
    openSharedDocFromHash();
  }, []);

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
