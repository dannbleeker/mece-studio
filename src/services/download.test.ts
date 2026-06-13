// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard, downloadDataUrl, downloadText } from './download';

describe('copyToClipboard', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('writes the text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await copyToClipboard('hello');
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('swallows clipboard errors (blocked context)', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) },
    });
    await expect(copyToClipboard('x')).resolves.toBeUndefined();
  });
});

describe('downloads', () => {
  const clicked: HTMLAnchorElement[] = [];

  beforeEach(() => {
    clicked.length = 0;
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:abc');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function mockClick(
      this: HTMLAnchorElement
    ) {
      clicked.push(this);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('downloadText creates a blob anchor with the filename and revokes the URL', () => {
    downloadText('tree.json', '{}', 'application/json');
    expect(clicked).toHaveLength(1);
    expect(clicked[0]?.download).toBe('tree.json');
    expect(clicked[0]?.href).toContain('blob:abc');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:abc');
    expect(document.querySelector('a')).toBeNull(); // anchor cleaned up
  });

  it('downloadDataUrl clicks an anchor pointing at the data URL', () => {
    downloadDataUrl('tree.png', 'data:image/png;base64,XXX');
    expect(clicked[0]?.download).toBe('tree.png');
    expect(clicked[0]?.href).toBe('data:image/png;base64,XXX');
  });
});
