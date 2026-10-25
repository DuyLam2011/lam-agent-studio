import { FileCode, FileJson, FileType2, FileText, Image as ImageIcon, FileCode2, FileTerminal } from 'lucide-react';

export const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileType2 size={14} className="text-blue-400 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileType2 size={14} className="text-yellow-400 shrink-0" />;
    case 'json':
      return <FileJson size={14} className="text-yellow-200 shrink-0" />;
    case 'css':
      return <FileCode2 size={14} className="text-blue-300 shrink-0" />;
    case 'html':
      return <FileCode size={14} className="text-orange-400 shrink-0" />;
    case 'md':
      return <FileText size={14} className="text-purple-400 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
    case 'webp':
      return <ImageIcon size={14} className="text-green-400 shrink-0" />;
    case 'sh':
    case 'bat':
    case 'cmd':
      return <FileTerminal size={14} className="text-green-300 shrink-0" />;
    default:
      return <FileCode size={14} className="text-gray-400 shrink-0" />;
  }
};
