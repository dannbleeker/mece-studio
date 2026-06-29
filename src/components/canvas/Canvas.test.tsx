// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { childrenOf } from '@/domain/tree';
import { downloadDataUrl, downloadText } from '@/services/download';
import { useStore } from '@/store';
import { Canvas } from './Canvas';

// Export uses dynamic import() of these heavy libs. Mock them so a toolbar click
// drives the real export plumbing (bounds → render → save) without the actual
// rasteriser / encoders, which don't run under happy-dom.
const { toPngMock, toSvgMock, pdfSave, pdfAddImage, pptxWrite, pptxAddImage } = vi.hoisted(() => ({
  toPngMock: vi.fn(async () => 'data:image/png;base64,AAAA'),
  toSvgMock: vi.fn(
    async () =>
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script><rect/></svg>')}`
  ),
  pdfSave: vi.fn(),
  pdfAddImage: vi.fn(),
  pptxWrite: vi.fn(async () => undefined),
  pptxAddImage: vi.fn(),
}));
vi.mock('html-to-image', () => ({ toPng: toPngMock, toSvg: toSvgMock }));
// Real classes (not vi.fn) — a mock fn used with `new` doesn't reliably return
// the factory object, so instance methods would be undefined.
vi.mock('jspdf', () => ({
  jsPDF: class {
    addImage = pdfAddImage;
    save = pdfSave;
  },
}));
vi.mock('pptxgenjs', () => ({
  default: class {
    addSlide() {
      return { addImage: pptxAddImage };
    }
    writeFile = pptxWrite;
  },
}));
vi.mock('@/services/download', () => ({
  downloadDataUrl: vi.fn(),
  downloadText: vi.fn(),
  copyToClipboard: vi.fn(),
}));

// React Flow needs ResizeObserver, which happy-dom doesn't provide.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  localStorage.clear();
  useStore.setState(FRESH, true);
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Canvas', () => {
  it('renders the canvas toolbar (find, collapse)', () => {
    render(<Canvas />);
    expect(screen.getByLabelText('Find nodes')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Collapse all' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Expand all' })).toBeTruthy();
  });

  it('reports a match count while searching', async () => {
    s().setRootQuestion('Find me here');
    render(<Canvas />);
    fireEvent.change(screen.getByLabelText('Find nodes'), { target: { value: 'find' } });
    expect(await screen.findByText(/1 match/)).toBeTruthy();
  });

  it('collapse all / expand all drive the store', () => {
    const rootId = s().doc.rootId;
    s().addChild(rootId, 'A');
    const a = childrenOf(s().doc, rootId)[0];
    if (!a) throw new Error('expected child A');
    s().addChild(a.id, 'A1'); // A (non-root) now has a child → collapsible
    render(<Canvas />);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(s().doc.nodes[a.id]?.collapsed).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(s().doc.nodes[a.id]?.collapsed).toBeUndefined();
  });

  // Export moved to the header; the canvas fulfils a store request (exportRequest).
  it('exports a PNG when the store requests it', async () => {
    render(<Canvas />);
    act(() => {
      s().requestExport('png');
    });
    await waitFor(() =>
      expect(downloadDataUrl).toHaveBeenCalledWith('mece-tree.png', 'data:image/png;base64,AAAA')
    );
    expect(toPngMock).toHaveBeenCalledTimes(1);
    expect(s().exportRequest).toBeNull(); // cleared after fulfilling
  });

  it('exports a sanitised SVG when the store requests it', async () => {
    render(<Canvas />);
    act(() => {
      s().requestExport('svg');
    });
    await waitFor(() => expect(downloadText).toHaveBeenCalledTimes(1));
    expect(toSvgMock).toHaveBeenCalledTimes(1);
    const [filename, svg, mime] = (downloadText as unknown as { mock: { calls: string[][] } }).mock
      .calls[0] as [string, string, string];
    expect(filename).toBe('mece-tree.svg');
    expect(mime).toBe('image/svg+xml');
    expect(svg).toContain('<rect'); // benign content survives
    expect(svg).not.toContain('<script'); // the script was stripped at the sink
    expect(svg).not.toContain('alert(1)');
  });

  it('exports a PDF when the store requests it', async () => {
    render(<Canvas />);
    act(() => {
      s().requestExport('pdf');
    });
    await waitFor(() => expect(pdfSave).toHaveBeenCalledWith('mece-tree.pdf'));
    expect(pdfAddImage).toHaveBeenCalledTimes(1);
  });

  it('exports a PPTX when the store requests it', async () => {
    render(<Canvas />);
    act(() => {
      s().requestExport('pptx');
    });
    await waitFor(() => expect(pptxWrite).toHaveBeenCalledWith({ fileName: 'mece-tree.pptx' }));
    expect(pptxAddImage).toHaveBeenCalledTimes(1);
  });

  it('zooms to matches when Enter is pressed in the search box', () => {
    s().setRootQuestion('Find me here');
    render(<Canvas />);
    const input = screen.getByLabelText('Find nodes');
    fireEvent.change(input, { target: { value: 'find' } });
    fireEvent.keyDown(input, { key: 'Enter' }); // exercises fitToMatches + stopPropagation
    expect(screen.getByText(/1 match/)).toBeTruthy();
  });
});
