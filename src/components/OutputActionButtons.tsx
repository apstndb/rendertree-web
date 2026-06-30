import React from 'react';
import { CopyButton } from './CopyButton';
import { DownloadButton } from './DownloadButton';
import type { DownloadDescriptor } from '../utils/downloadFile';

interface OutputActionButtonsProps {
  content: string;
  download: DownloadDescriptor;
}

export const OutputActionButtons: React.FC<OutputActionButtonsProps> = ({ content, download }) => (
  <div className="output-actions">
    <CopyButton content={content} />
    <DownloadButton content={content} download={download} />
  </div>
);
