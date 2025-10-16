'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EcosystemStatus {
  timestamp: string;
  instances: {
    github: any;
    vmHome: any;
    vmService: any;
  };
  storage: any;
  autoSync: any;
}

export function EcosystemStatusPanel() {
  const [status, setStatus] = useState<EcosystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/ecosystem/status');
        const data = await res.json();
        setStatus(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch ecosystem status:', error);
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Every 30s

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">Loading ecosystem status...</div>
      </div>
    );
  }

  if (!status) {
    return <div>Failed to load ecosystem status</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🌍 Ecosystem Status Monitor</h1>
        <Badge variant="outline">
          Updated: {new Date(status.timestamp).toLocaleTimeString()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GitHub */}
        <Card>
          <CardHeader>
            <CardTitle>🌐 GitHub Remote</CardTitle>
            <CardDescription>leolech14/PROJECT_central-mcp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant="success">{status.instances.github.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Commit:</span>
                <code className="text-sm">{status.instances.github.commit}</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VM Home */}
        <Card>
          <CardHeader>
            <CardTitle>☁️ VM Storage</CardTitle>
            <CardDescription>/home/lech/PROJECTS_all</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Commit:</span>
                <code className="text-sm">{status.instances.vmHome.commit}</code>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge>{status.instances.vmHome.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VM Service */}
        <Card>
          <CardHeader>
            <CardTitle>⚙️ VM Service</CardTitle>
            <CardDescription>/opt/central-mcp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={status.instances.vmService.status === 'active' ? 'success' : 'destructive'}>
                  {status.instances.vmService.status}
                </Badge>
              </div>
              {status.instances.vmService.status !== 'active' && (
                <p className="text-sm text-muted-foreground">
                  Service needs attention
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Auto-Sync */}
        <Card>
          <CardHeader>
            <CardTitle>🔄 Auto-Sync</CardTitle>
            <CardDescription>Automatic propagation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={status.autoSync.enabled ? 'success' : 'secondary'}>
                  {status.autoSync.enabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Schedule:</span>
                <code className="text-sm">{status.autoSync.schedule}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>💾 Storage Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">MacBook</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary h-6 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: '93%' }} />
                </div>
                <span className="text-sm">814 GB / 926 GB</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">VM Data Disk (1TB)</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary h-6 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '1%' }} />
                </div>
                <span className="text-sm">117 MB / 1 TB</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
