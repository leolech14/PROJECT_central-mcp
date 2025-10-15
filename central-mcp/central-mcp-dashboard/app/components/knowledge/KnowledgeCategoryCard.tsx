/**
 * Knowledge Category Card Component
 * ================================
 *
 * React component for displaying knowledge categories with README content
 * and knowledge pack listings.
 *
 * Built by: Backend Specialist (Agent C)
 * Purpose: Knowledge Space category display component
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FolderOpen,
  FileText,
  Archive,
  FileCode,
  FileImage,
  Download,
  Eye,
  Clock,
  HardDrive,
  BookOpen,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface KnowledgePack {
  name: string;
  path: string;
  size: number;
  created: string;
  modified: string;
  extension: string;
  type: 'archive' | 'document' | 'code' | 'other';
  description?: string;
}

interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  readmeContent?: string;
  readmeMetadata?: {
    title?: string;
    author?: string;
    version?: string;
    tags?: string[];
    status?: string;
  };
  knowledgePacks: KnowledgePack[];
  fileCount: number;
  totalSize: number;
  lastModified: string;
  path: string;
}

interface KnowledgeCategoryCardProps {
  category: KnowledgeCategory;
  expanded?: boolean;
  onExpand?: (categoryId: string) => void;
  onPackClick?: (pack: KnowledgePack) => void;
  className?: string;
}

export const KnowledgeCategoryCard: React.FC<KnowledgeCategoryCardProps> = ({
  category,
  expanded = false,
  onExpand,
  onPackClick,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const handleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpand?.(category.id);
  };

  const getPackIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'archive':
        return <Archive className="w-4 h-4 text-orange-500" />;
      case 'code':
        return <FileCode className="w-4 h-4 text-blue-500" />;
      case 'image':
        return <FileImage className="w-4 h-4 text-green-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
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
    return new Date(dateString).toLocaleDateString();
  };

  const handlePackClick = (pack: KnowledgePack) => {
    onPackClick?.(pack);
  };

  const handleDownload = (pack: KnowledgePack, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/knowledge/download?path=${encodeURIComponent(pack.path)}`, '_blank');
  };

  const handlePreview = (pack: KnowledgePack, e: React.MouseEvent) => {
    e.stopPropagation();
    // Open preview modal or navigate to preview page
    window.open(`/knowledge/preview?path=${encodeURIComponent(pack.path)}`, '_blank');
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FolderOpen className="w-8 h-8 text-blue-500" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl truncate">{category.name}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {category.description}
              </CardDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="h-8 w-8 p-0"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </Button>
        </div>

        {/* Category metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>{category.fileCount} files</span>
            </div>
            <div className="flex items-center space-x-1">
              <HardDrive className="w-4 h-4" />
              <span>{formatFileSize(category.totalSize)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(category.lastModified)}</span>
          </div>
        </div>

        {/* README metadata if available */}
        {category.readmeMetadata && (
          <div className="flex flex-wrap gap-2 pt-2">
            {category.readmeMetadata.version && (
              <Badge variant="secondary" className="text-xs">
                v{category.readmeMetadata.version}
              </Badge>
            )}
            {category.readmeMetadata.author && (
              <Badge variant="outline" className="text-xs">
                {category.readmeMetadata.author}
              </Badge>
            )}
            {category.readmeMetadata.status && (
              <Badge variant="default" className="text-xs">
                {category.readmeMetadata.status}
              </Badge>
            )}
            {category.readmeMetadata.tags?.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <Tabs defaultValue="packs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="packs" className="flex items-center space-x-2">
                <Archive className="w-4 h-4" />
                <span>Knowledge Packs ({category.knowledgePacks.length})</span>
              </TabsTrigger>
              <TabsTrigger value="readme" className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Documentation</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="packs" className="space-y-3">
              {category.knowledgePacks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No knowledge packs found in this category</p>
                </div>
              ) : (
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-2">
                    {category.knowledgePacks.map((pack, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handlePackClick(pack)}
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {getPackIcon(pack.type)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-sm truncate">{pack.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {pack.type}
                              </Badge>
                            </div>
                            {pack.description && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {pack.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                              <span>{formatFileSize(pack.size)}</span>
                              <span>{formatDate(pack.modified)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handlePreview(pack, e)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDownload(pack, e)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="readme" className="space-y-3">
              {category.readmeContent ? (
                <ScrollArea className="h-64 w-full">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert p-4"
                    dangerouslySetInnerHTML={{ __html: category.readmeContent }}
                  />
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No documentation available for this category</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Category actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Path: <code className="bg-muted px-2 py-1 rounded text-xs">{category.path}</code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/knowledge/browse?path=${encodeURIComponent(category.path)}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default KnowledgeCategoryCard;