import React from 'react';
import type { DownloadDescriptor } from '../utils/downloadFile';
import { downloadTextFile } from '../utils/downloadFile';
import { logger } from '../utils/logger';

interface DownloadButtonProps {
  content: string;
  download: DownloadDescriptor;
  className?: string;
  'data-testid'?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  content,
  download,
  className = '',
  'data-testid': testId = 'download-button',
}) => {
  const handleDownload = () => {
    if (!content) {
      logger.warn('Download attempted with no content');
      return;
    }

    downloadTextFile(content, download);
    logger.info('Download started', download.filename);
  };

  return (
    <button
      type="button"
      className={`download-button ${className}`.trim()}
      onClick={handleDownload}
      data-testid={testId}
      aria-label={`Download ${download.filename}`}
    >
      Download
    </button>
  );
};
