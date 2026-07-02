import { useEffect, useRef, useState } from 'react';
import { Dialog } from './Dialog';

/**
 * A small single-field prompt modal built on the shared `Dialog` — replaces
 * `window.prompt` (e.g. renaming a tree) with the app's own styled dialog.
 */
export function PromptDialog({
  label,
  subtitle,
  initialValue = '',
  placeholder,
  submitLabel = 'Save',
  onSubmit,
  onClose,
}: {
  label: string;
  subtitle?: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  // Move focus to the field once the dialog has mounted (Dialog focuses its shell).
  useEffect(() => {
    const h = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(h);
  }, []);

  const submit = () => {
    onSubmit(value);
    onClose();
  };

  return (
    <Dialog label={label} subtitle={subtitle} onClose={onClose}>
      <input
        ref={inputRef}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        className="mt-3 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-[13px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none"
      />
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
          onClick={submit}
          className="rounded-md bg-[#3f6fb0] px-3 py-1.5 font-medium text-[13px] text-white hover:bg-[#365f98]"
        >
          {submitLabel}
        </button>
      </div>
    </Dialog>
  );
}
