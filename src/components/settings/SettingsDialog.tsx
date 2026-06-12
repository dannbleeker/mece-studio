import { useModalFocus } from '@/components/useModalFocus';
import { useStore } from '@/store';

interface SettingsDialogProps {
  onClose: () => void;
}

const TOLERANCE_OPTIONS: { value: number; label: string }[] = [
  { value: 0.001, label: '0.1%' },
  { value: 0.005, label: '0.5% (default)' },
  { value: 0.01, label: '1%' },
  { value: 0.02, label: '2%' },
  { value: 0.05, label: '5%' },
];

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const ref = useModalFocus<HTMLDivElement>(onClose);
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-neutral-900/30"
      />
      <div
        ref={ref}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl outline-none"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[#3f6fb0] text-lg tracking-tight">Settings</h2>
            <p className="mt-1 text-[13px] text-neutral-500 leading-relaxed">
              Preferences apply across all your trees and are saved on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md px-2 py-1 text-neutral-400 text-sm hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.sortSiblingsByPriority}
              onChange={(e) => setSettings({ sortSiblingsByPriority: e.target.checked })}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium text-[13px] text-neutral-800">
                Sort siblings by priority
              </span>
              <span className="block text-[12px] text-neutral-500">
                Lay branches out highest-impact first, instead of the order you created them.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.strictOverlap}
              onChange={(e) => setSettings({ strictOverlap: e.target.checked })}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium text-[13px] text-neutral-800">
                Stricter overlap detection
              </span>
              <span className="block text-[12px] text-neutral-500">
                Flag shorter shared words between siblings — catches more possible overlaps (and
                more false positives).
              </span>
            </span>
          </label>

          <div className="flex items-center justify-between gap-4">
            <span>
              <span className="block font-medium text-[13px] text-neutral-800">
                Formula tolerance
              </span>
              <span className="block text-[12px] text-neutral-500">
                How closely a value-driver split must reconcile to count as collectively exhaustive.
              </span>
            </span>
            <select
              value={settings.formulaTolerance}
              onChange={(e) => setSettings({ formulaTolerance: Number(e.target.value) })}
              aria-label="Formula tolerance"
              className="shrink-0 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[13px] text-neutral-700 focus:border-[#3f6fb0] focus:outline-none"
            >
              {TOLERANCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
