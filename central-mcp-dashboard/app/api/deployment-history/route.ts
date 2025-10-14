import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

interface DeploymentChange {
  timestamp: string;
  type: 'dashboard' | 'backend' | 'config' | 'scripts';
  files: string[];
  description: string;
  gitHash?: string;
}

interface DeploymentHistory {
  lastUpdate: string;
  lastGitHash: string;
  changes: DeploymentChange[];
  summary: {
    totalDeployments: number;
    lastDashboardUpdate: string;
    lastBackendUpdate: string;
    lastConfigUpdate: string;
  };
}

const DEPLOYMENT_LOG = '/opt/central-mcp/logs/deployment-history.json';

export async function GET(request: NextRequest) {
  try {
    // Try to read deployment history log
    let deploymentHistory: DeploymentChange[] = [];
    try {
      const logContent = await fs.readFile(DEPLOYMENT_LOG, 'utf-8');
      deploymentHistory = JSON.parse(logContent);
    } catch (err) {
      // Log doesn't exist yet, create empty
      deploymentHistory = [];
    }

    // Get current git info for dashboard
    const dashboardPath = '/home/lech/central-mcp-dashboard';
    let lastGitHash = 'unknown';
    let lastUpdate = new Date().toISOString();

    try {
      const { stdout: gitHash } = await execAsync(
        `cd ${dashboardPath} && git rev-parse --short HEAD`
      );
      lastGitHash = gitHash.trim();

      const { stdout: gitDate } = await execAsync(
        `cd ${dashboardPath} && git log -1 --format=%ai`
      );
      lastUpdate = gitDate.trim();
    } catch (err) {
      // Git info not available
    }

    // Get summary stats
    const lastDashboard = deploymentHistory
      .filter(d => d.type === 'dashboard')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const lastBackend = deploymentHistory
      .filter(d => d.type === 'backend')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const lastConfig = deploymentHistory
      .filter(d => d.type === 'config')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const response: DeploymentHistory = {
      lastUpdate,
      lastGitHash,
      changes: deploymentHistory.slice(0, 50), // Last 50 changes
      summary: {
        totalDeployments: deploymentHistory.length,
        lastDashboardUpdate: lastDashboard?.timestamp || 'Never',
        lastBackendUpdate: lastBackend?.timestamp || 'Never',
        lastConfigUpdate: lastConfig?.timestamp || 'Never',
      },
    };

    return Response.json(response);
  } catch (error: any) {
    console.error('Deployment history error:', error);
    return Response.json(
      {
        error: error.message,
        lastUpdate: new Date().toISOString(),
        lastGitHash: 'unknown',
        changes: [],
        summary: {
          totalDeployments: 0,
          lastDashboardUpdate: 'Unknown',
          lastBackendUpdate: 'Unknown',
          lastConfigUpdate: 'Unknown',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, files, description, gitHash } = body;

    // Read existing log
    let deploymentHistory: DeploymentChange[] = [];
    try {
      const logContent = await fs.readFile(DEPLOYMENT_LOG, 'utf-8');
      deploymentHistory = JSON.parse(logContent);
    } catch (err) {
      // Create directory if needed
      await fs.mkdir(path.dirname(DEPLOYMENT_LOG), { recursive: true });
    }

    // Add new deployment
    const newDeployment: DeploymentChange = {
      timestamp: new Date().toISOString(),
      type,
      files,
      description,
      gitHash,
    };

    deploymentHistory.unshift(newDeployment);

    // Keep only last 500 deployments
    if (deploymentHistory.length > 500) {
      deploymentHistory = deploymentHistory.slice(0, 500);
    }

    // Save log
    await fs.writeFile(
      DEPLOYMENT_LOG,
      JSON.stringify(deploymentHistory, null, 2)
    );

    return Response.json({ success: true, deployment: newDeployment });
  } catch (error: any) {
    console.error('Deployment log error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
