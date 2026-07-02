/** Copy text to the clipboard (no-op if the clipboard API is unavailable). */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard may be blocked (insecure context / permissions) — non-fatal.
  }
}

/**
 * Copy a rendered image (data URL) to the clipboard as a real image, so it can
 * be pasted straight into Slack / email / a slide. Returns false when the async
 * Clipboard `write` API is unavailable (older browsers) so callers can fall back
 * to a download.
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch {
    return false;
  }
}

/** Trigger a browser download of `text` as `filename`. */
export function downloadText(filename: string, text: string, type = 'text/plain'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Trigger a browser download of a data URL (e.g. a generated PNG). */
export function downloadDataUrl(filename: string, dataUrl: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
