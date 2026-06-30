import { describe, expect, it } from 'vitest';
import { OUTPUT_DOWNLOAD } from '../downloadFile';

describe('OUTPUT_DOWNLOAD', () => {
  it('uses text/plain for ASCII output', () => {
    expect(OUTPUT_DOWNLOAD.ascii).toEqual({
      filename: 'query-plan.txt',
      mimeType: 'text/plain;charset=utf-8',
    });
  });

  it('uses mermaid extension and vendor mime for diagram source', () => {
    expect(OUTPUT_DOWNLOAD.diagram.filename).toMatch(/\.mermaid$/);
    expect(OUTPUT_DOWNLOAD.diagram.mimeType).toContain('mermaid');
  });

  it('uses svg extension and image/svg+xml for Graphviz output', () => {
    expect(OUTPUT_DOWNLOAD.svg).toEqual({
      filename: 'query-plan.svg',
      mimeType: 'image/svg+xml;charset=utf-8',
    });
  });
});
