import { Dialog } from '@/components/Dialog';
import { useMessages } from '@/i18n/useMessages';

const KBD =
  'rounded border border-neutral-300 border-b-2 bg-neutral-50 px-1.5 py-0.5 font-mono text-[11px] text-neutral-700';

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const m = useMessages();

  return (
    <Dialog label={m.app.shortcuts} subtitle={m.app.shortcutsSubtitle} onClose={onClose}>
      <table className="mt-5 w-full">
        <tbody>
          {m.app.shortcutRows.map((s) => (
            <tr key={s.action} className="border-neutral-100 border-b last:border-0">
              <td className="py-1.5 pr-4 text-[13px] text-neutral-700">{s.action}</td>
              <td className="whitespace-nowrap py-1.5 text-right">
                {s.keys.map((k, i) => (
                  <span key={k}>
                    {i > 0 && (
                      <span className="mx-1 text-[11px] text-neutral-400">
                        {m.app.shortcutKeyOr}
                      </span>
                    )}
                    <kbd className={KBD}>{k}</kbd>
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}
