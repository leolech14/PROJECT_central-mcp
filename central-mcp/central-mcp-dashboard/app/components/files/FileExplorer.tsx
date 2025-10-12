'use client';

import { useState, useEffect } from 'react';

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

interface DirectoryData {
  type: 'directory';
  path: string;
  name: string;
  entries: FileEntry[];
}

interface FileData {
  type: 'file';
  path: string;
  name: string;
  content: string;
  size: number;
  modified: string;
}

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [data, setData] = useState<DirectoryData | FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectRoot, setProjectRoot] = useState<string>('');

  // Initialize with PROJECTS_all directory
  useEffect(() => {
    const home = typeof window !== 'undefined' ? '' : '';
    const defaultPath = `/Users/lech/PROJECTS_all`;
    setProjectRoot(defaultPath);
    setCurrentPath(defaultPath);
  }, []);

  useEffect(() => {
    if (!currentPath) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPath]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (entry: FileEntry) => {
    if (entry.type === 'directory') return '📁';

    const ext = entry.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx': return '📜';
      case 'json': return '📋';
      case 'md': return '📝';
      case 'css':
      case 'scss': return '🎨';
      case 'png':
      case 'jpg':
      case 'svg': return '🖼️';
      default: return '📄';
    }
  };

  const getBreadcrumbs = () => {
    if (!currentPath) return [];
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [];
    let path = '';

    for (let i = 0; i < parts.length; i++) {
      path += '/' + parts[i];
      crumbs.push({ name: parts[i], path });
    }

    return crumbs;
  };

  const goUp = () => {
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parent);
  };

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center bg-scaffold-0">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-scaffold-0">
        <div className="text-color-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-scaffold-0">
      {/* Breadcrumb Navigation */}
      <div className="bg-scaffold-1 border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={goUp}
            className="px-2 py-1 hover:bg-scaffold-2 rounded text-text-secondary transition-colors"
            disabled={currentPath === '/'}
          >
            ↑
          </button>
          <button
            onClick={() => setCurrentPath(projectRoot)}
            className="px-2 py-1 hover:bg-scaffold-2 rounded text-text-primary transition-colors font-medium"
          >
            PROJECTS_all
          </button>
          {getBreadcrumbs().slice(getBreadcrumbs().findIndex(c => c.name === 'PROJECTS_all') + 1).map((crumb, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-text-tertiary">/</span>
              <button
                onClick={() => handleNavigate(crumb.path)}
                className="px-2 py-1 hover:bg-scaffold-2 rounded text-text-secondary hover:text-text-primary transition-colors"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Directory Listing */}
      {data?.type === 'directory' && (
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-scaffold-1 border-b border-border-subtle sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-text-tertiary">Name</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-text-tertiary">Size</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-text-tertiary">Modified</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, i) => (
                <tr
                  key={i}
                  onClick={() => handleNavigate(entry.path)}
                  className="border-b border-border-subtle hover:bg-scaffold-1 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFileIcon(entry)}</span>
                      <span className={`text-sm ${entry.type === 'directory' ? 'font-medium text-text-primary' : 'text-text-secondary'} group-hover:text-text-primary transition-colors`}>
                        {entry.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-text-tertiary">
                    {entry.type === 'file' ? formatSize(entry.size) : '-'}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-text-tertiary">
                    {formatDate(entry.modified)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* File Content Viewer */}
      {data?.type === 'file' && (
        <div className="flex-1 overflow-auto">
          <div className="bg-scaffold-1 border-b border-border-subtle px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{getFileIcon({ name: data.name, type: 'file', path: data.path })}</span>
              <span className="text-sm font-medium text-text-primary">{data.name}</span>
            </div>
            <div className="text-xs text-text-tertiary flex items-center gap-4">
              <span>{formatSize(data.size)}</span>
              <span>{formatDate(data.modified)}</span>
            </div>
          </div>
          <div className="p-4">
            <pre className="bg-scaffold-2 border border-border-subtle rounded-lg p-4 text-sm font-mono text-text-secondary overflow-x-auto">
              <code>{data.content}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
