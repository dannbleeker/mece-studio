import { Dialog } from './Dialog';

/**
 * A small confirm modal built on the shared `Dialog` — replaces `window.confirm`
 * so a destructive action (e.g. deleting a tree) gets the app's own styled,
 * focus-trapped dialog with a clearly-marked danger button.
 */
export function ConfirmDialog({
  label,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onClose,
}: {
  label: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog label={label} onClose={onClose}>
      <p className="mt-3 text-[13px] text-neutral-600 leading-relaxed">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-md px-3 py-1.5 font-medium text-[13px] text-white ${
            destructive ? 'bg-[#bd4a3a] hover:bg-[#a53f31]' : 'bg-[#3f6fb0] hover:bg-[#365f98]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
