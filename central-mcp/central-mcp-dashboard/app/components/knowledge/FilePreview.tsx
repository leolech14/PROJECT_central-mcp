/**
 * Knowledge Space File Preview Component
 * =====================================
 *
 * React component for displaying file previews with syntax highlighting
 * and support for various file types.
 *
 * Built by: Backend Specialist (Agent C)
 * Purpose: Knowledge Space file preview component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  FileCode,
  FileImage,
  Archive,
  Download,
  Search,
  Eye,
  Copy,
  Check
} from 'lucide-react';

interface FilePreviewProps {
  filePath: string;
  fileName: string;
  fileType: string;
  preview?: {
    content: string;
    htmlContent?: string;
    metadata: {
      size: number;
      lastModified: string;
      lines?: number;
      truncated?: boolean;
      language?: string;
    };
    previewType: 'text' | 'markdown' | 'code' | 'image' | 'pdf' | 'binary';
    canPreview: boolean;
  };
  onPreview?: (path: string) => void;
  className?: string;
}

interface PreviewContentProps {
  content: string;
  htmlContent?: string;
  language?: string;
  lines?: number;
  truncated?: boolean;
  previewType: string;
}

const PreviewContent: React.FC<PreviewContentProps> = ({
  content,
  htmlContent,
  language,
  lines,
  truncated,
  previewType
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  const renderContent = () => {
    if (previewType === 'markdown' && htmlContent) {
      return (
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }

    if (previewType === 'code' && htmlContent) {
      return (
        <div
          className="code-preview"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }

    if (previewType === 'image') {
      return (
        <div className="flex justify-center items-center p-4">
          <img
            src={content}
            alt="Preview"
            className="max-w-full max-h-96 object-contain rounded"
            onError={(e) => {
              e.currentTarget.src = '/api/files/preview?path=' + encodeURIComponent(content);
            }}
          />
        </div>
      );
    }

    if (previewType === 'pdf') {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">PDF Document</p>
          <p className="text-sm text-muted-foreground mb-4">
            Preview not available for PDF files
          </p>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      );
    }

    // Text content
    return (
      <div className="relative">
        <pre className="text-sm bg-muted p-4 rounded overflow-x-auto whitespace-pre-wrap">
          {content}
        </pre>
        {truncated && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-2 text-center text-sm text-muted-foreground">
            Content truncated...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {previewType !== 'image' && previewType !== 'pdf' && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}

      <ScrollArea className="h-96 w-full">
        {renderContent()}
      </ScrollArea>

      {language && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Language: {language}</span>
          {lines && <span>Lines: {lines}</span>}
        </div>
      )}
    </div>
  );
};

export const FilePreview: React.FC<FilePreviewProps> = ({
  filePath,
  fileName,
  fileType,
  preview,
  onPreview,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState(preview);

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'archive':
        return <Archive className="w-8 h-8 text-orange-500" />;
      case 'image':
        return <FileImage className="w-8 h-8 text-green-500" />;
      case 'code':
        return <FileCode className="w-8 h-8 text-blue-500" />;
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const handlePreview = async () => {
    if (previewData || !onPreview) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/knowledge/preview?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();

      if (data.success) {
        setPreviewData(data.data);
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/knowledge/download?path=${encodeURIComponent(filePath)}`, '_blank');
  };

  useEffect(() => {
    if (!previewData && onPreview) {
      handlePreview();
    }
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getFileIcon(fileType)}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{fileName}</CardTitle>
              <CardDescription className="text-sm">
                {fileType} • {previewData?.metadata.size ? formatFileSize(previewData.metadata.size) : 'Unknown size'}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {previewData?.metadata.language && (
              <Badge variant="secondary" className="text-xs">
                {previewData.metadata.language}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {previewData?.metadata && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Modified: {formatDate(previewData.metadata.lastModified)}
            </span>
            {previewData.metadata.lines && (
              <span>Lines: {previewData.metadata.lines}</span>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!isLoading && previewData && (
          <PreviewContent
            content={previewData.content}
            htmlContent={previewData.htmlContent}
            language={previewData.metadata.language}
            lines={previewData.metadata.lines}
            truncated={previewData.metadata.truncated}
            previewType={previewData.previewType}
          />
        )}

        {!isLoading && !previewData && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Eye className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Preview not available for this file type
            </p>
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Search className="w-4 h-4 mr-2" />
              Try to Load Preview
            </Button>
          </div>
        )}

        {previewData?.metadata.truncated && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              ⚠️ Content has been truncated for performance. Download the full file to see complete content.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilePreview;