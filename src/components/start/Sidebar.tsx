export type Section = 'start' | 'all' | 'recent' | 'templates' | 'review' | 'learn';

const NAV: { id: Section; label: string }[] = [
  { id: 'start', label: 'Start' },
  { id: 'all', label: 'All trees' },
  { id: 'recent', label: 'Recent' },
  { id: 'templates', label: 'Templates' },
  { id: 'review', label: 'Needs review' },
  { id: 'learn', label: 'Learn MECE' },
];

interface SidebarProps {
  section: Section;
  onSection: (s: Section) => void;
  onNew: () => void;
  treeCount: number;
  reviewCount: number;
  /** Whether the mobile drawer is open. Ignored at ≥sm, where the sidebar is static. */
  open: boolean;
  /** Dismiss the mobile drawer (backdrop tap, or after a nav choice). */
  onClose: () => void;
}

export function Sidebar({
  section,
  onSection,
  onNew,
  treeCount,
  reviewCount,
  open,
  onClose,
}: SidebarProps) {
  const badge: Partial<Record<Section, number>> = { all: treeCount, review: reviewCount };
  // On mobile every nav choice also dismisses the drawer so the content is visible.
  const pick = (s: Section) => {
    onSection(s);
    onClose();
  };
  return (
    <>
      {/* Scrim behind the mobile drawer — tap to dismiss. Absent at ≥sm. */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 sm:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[228px] shrink-0 flex-col gap-3 border-[#e7e4dc] border-r bg-[#f4f2ec] p-3 transition-transform duration-200 sm:static sm:z-auto sm:translate-x-0 ${
          open ? 'translate-x-0 shadow-xl' : '-translate-x-full sm:shadow-none'
        }`}
      >
        <button
          type="button"
          onClick={() => pick('start')}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/50"
          title="MECE Studio — Start"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <line x1="6" y1="11" x2="15" y2="6" stroke="#3f6fb0" strokeWidth="1.6" />
            <line x1="6" y1="11" x2="15" y2="16" stroke="#3f6fb0" strokeWidth="1.6" />
            <circle cx="6" cy="11" r="3" fill="#3f6fb0" />
            <circle cx="16" cy="6" r="2.4" fill="#3f6fb0" />
            <circle cx="16" cy="16" r="2.4" fill="#3f6fb0" />
          </svg>
          <span className="font-semibold text-[#3f6fb0]">MECE Studio</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onNew();
            onClose();
          }}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#3f6fb0] px-3 py-2 font-medium text-[13px] text-white shadow-sm hover:bg-[#365f98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
        >
          + New tree
        </button>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = item.id === section;
            const count = badge[item.id];
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => pick(item.id)}
                className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40 ${
                  active
                    ? 'bg-white font-medium text-[#3f6fb0] shadow-sm'
                    : 'text-neutral-600 hover:bg-white/60'
                }`}
              >
                <span>{item.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[11px] ${
                      active ? 'bg-[#3f6fb0]/10 text-[#3f6fb0]' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-[#e7e4dc] bg-white/70 p-3 text-[11px] text-neutral-500 leading-relaxed">
          <span className="font-medium text-neutral-700">🔒 Local &amp; private</span>
          <br />A local-first PWA. Works offline. Your trees never leave this device.
        </div>
      </aside>
    </>
  );
}
