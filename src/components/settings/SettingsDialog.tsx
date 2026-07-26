import { Dialog } from '@/components/Dialog';
import { DEFAULT_SETTINGS } from '@/domain/settings';
import type { LocaleCode } from '@/domain/types';
import { LOCALES } from '@/i18n/registry';
import { useMessages } from '@/i18n/useMessages';
import { useStore } from '@/store';

/** Formula-tolerance choices as raw ratios — the catalogue does the wording. */
const TOLERANCE_OPTIONS: readonly number[] = [0.001, 0.005, 0.01, 0.02, 0.05];

const SELECT_CLASS =
  'shrink-0 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[13px] text-neutral-700 focus:border-[#3f6fb0] focus:outline-none';

/** A preference's heading plus the line explaining what it does. */
function Caption({ label, hint }: { label: string; hint: string }) {
  return (
    <span>
      <span className="block font-medium text-[13px] text-neutral-800">{label}</span>
      <span className="block text-[12px] text-neutral-500">{hint}</span>
    </span>
  );
}

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const m = useMessages();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);

  return (
    <Dialog label={m.settings.title} subtitle={m.settings.subtitle} onClose={onClose}>
      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Caption label={m.settings.locale.label} hint={m.settings.locale.hint} />
          <select
            value={settings.locale}
            onChange={(e) => setSettings({ locale: e.target.value as LocaleCode })}
            aria-label={m.settings.locale.label}
            className={SELECT_CLASS}
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeLabel}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={settings.sortSiblingsByPriority}
            onChange={(e) => setSettings({ sortSiblingsByPriority: e.target.checked })}
            className="mt-0.5"
          />
          <Caption
            label={m.settings.sortSiblingsByPriority.label}
            hint={m.settings.sortSiblingsByPriority.hint}
          />
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={settings.strictOverlap}
            onChange={(e) => setSettings({ strictOverlap: e.target.checked })}
            className="mt-0.5"
          />
          <Caption label={m.settings.strictOverlap.label} hint={m.settings.strictOverlap.hint} />
        </label>

        <div className="flex items-center justify-between gap-4">
          <Caption
            label={m.settings.formulaTolerance.label}
            hint={m.settings.formulaTolerance.hint}
          />
          <select
            value={settings.formulaTolerance}
            onChange={(e) => setSettings({ formulaTolerance: Number(e.target.value) })}
            aria-label={m.settings.formulaTolerance.label}
            className={SELECT_CLASS}
          >
            {TOLERANCE_OPTIONS.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio === DEFAULT_SETTINGS.formulaTolerance
                  ? m.settings.toleranceDefaultOption({ ratio })
                  : m.settings.toleranceOption({ ratio })}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Dialog>
  );
}
