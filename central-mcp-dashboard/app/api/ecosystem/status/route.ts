import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      instances: {
        github: await getGitHubStatus(),
        vmHome: await getVMHomeStatus(),
        vmService: await getVMServiceStatus(),
      },
      storage: await getStorageStatus(),
      autoSync: await getAutoSyncStatus(),
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get ecosystem status' }, { status: 500 });
  }
}

async function getGitHubStatus() {
  try {
    const { stdout } = await execAsync('gh api repos/leolech14/PROJECT_central-mcp --jq "{commit: .default_branch, pushed_at, size}"');
    const data = JSON.parse(stdout);
    return {
      commit: 'main',
      lastPush: data.pushed_at,
      size: data.size,
      status: 'available'
    };
  } catch {
    return { status: 'unavailable' };
  }
}

async function getVMHomeStatus() {
  try {
    const { stdout } = await execAsync('gcloud compute ssh lech@central-mcp-server --zone=us-central1-a --command="cd /home/lech/PROJECTS_all/PROJECT_central-mcp 2>/dev/null && git log --oneline -1" 2>/dev/null');
    const commit = stdout.trim().split(' ')[0];
    return {
      commit,
      status: 'synced',
      location: '/home/lech/PROJECTS_all/PROJECT_central-mcp'
    };
  } catch {
    return { status: 'unavailable' };
  }
}

async function getVMServiceStatus() {
  try {
    const { stdout } = await execAsync('gcloud compute ssh lech@central-mcp-server --zone=us-central1-a --command="systemctl is-active central-mcp && echo ACTIVE || echo INACTIVE" 2>/dev/null');
    const isActive = stdout.trim() === 'ACTIVE';
    return {
      status: isActive ? 'active' : 'inactive',
      location: '/opt/central-mcp'
    };
  } catch {
    return { status: 'unknown' };
  }
}

async function getStorageStatus() {
  try {
    const { stdout } = await execAsync('gcloud compute ssh lech@central-mcp-server --zone=us-central1-a --command="df -h / /mnt/data" 2>/dev/null');
    return { raw: stdout, status: 'available' };
  } catch {
    return { status: 'unavailable' };
  }
}

async function getAutoSyncStatus() {
  try {
    const { stdout } = await execAsync('gcloud compute ssh lech@central-mcp-server --zone=us-central1-a --command="crontab -l | grep auto-sync" 2>/dev/null');
    return {
      enabled: stdout.includes('auto-sync'),
      schedule: '*/5 * * * *',
      status: 'active'
    };
  } catch {
    return { status: 'unknown' };
  }
}
