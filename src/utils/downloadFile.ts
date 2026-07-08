export interface DownloadDescriptor {
  filename: string;
  mimeType: string;
}

export const OUTPUT_DOWNLOAD: Record<'ascii' | 'diagram' | 'svg' | 'd2', DownloadDescriptor> = {
  ascii: {
    filename: 'query-plan.txt',
    mimeType: 'text/plain;charset=utf-8',
  },
  diagram: {
    filename: 'query-plan.mermaid',
    mimeType: 'text/vnd.mermaid;charset=utf-8',
  },
  svg: {
    filename: 'query-plan.svg',
    mimeType: 'image/svg+xml;charset=utf-8',
  },
  d2: {
    filename: 'query-plan.d2',
    mimeType: 'text/plain;charset=utf-8',
  },
};

export function downloadTextFile(content: string, { filename, mimeType }: DownloadDescriptor): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.click();
  URL.revokeObjectURL(url);
}
