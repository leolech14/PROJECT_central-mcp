import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  parents: string[];
  branches: string[];
  tags: string[];
}

interface GitGraph {
  commits: GitCommit[];
  branches: { name: string; commit: string; color: string }[];
  lastCommit: GitCommit | null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const repoPath = searchParams.get('repo') || '/opt/central-mcp';

    // Get git log with all branches
    const { stdout: logOutput } = await execAsync(
      `cd ${repoPath} && git log --all --pretty=format:'%H|%h|%an|%ai|%s|%P' --date-order -n ${limit}`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    // Get all branches with their HEAD commits
    const { stdout: branchOutput } = await execAsync(
      `cd ${repoPath} && git branch -a --format='%(refname:short)|%(objectname)'`
    );

    // Get current branch
    const { stdout: currentBranch } = await execAsync(
      `cd ${repoPath} && git branch --show-current`
    );

    // Parse commits
    const commits: GitCommit[] = logOutput
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, shortHash, author, date, message, parents] = line.split('|');
        return {
          hash,
          shortHash,
          author,
          date,
          message,
          parents: parents ? parents.split(' ') : [],
          branches: [],
          tags: [],
        };
      });

    // Parse branches
    const branchColors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
    ];

    const branches = branchOutput
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line, idx) => {
        const [name, commit] = line.split('|');
        return {
          name: name.replace('remotes/', ''),
          commit,
          color: branchColors[idx % branchColors.length],
        };
      });

    // Attach branch info to commits
    branches.forEach(branch => {
      const commit = commits.find(c => c.hash === branch.commit);
      if (commit) {
        commit.branches.push(branch.name);
      }
    });

    // Get last commit on current branch
    const lastCommit = commits.find(c =>
      c.branches.includes(currentBranch.trim())
    ) || commits[0] || null;

    const graph: GitGraph = {
      commits,
      branches,
      lastCommit,
    };

    return Response.json(graph);
  } catch (error: any) {
    console.error('Git history error:', error);
    return Response.json(
      { error: error.message, commits: [], branches: [], lastCommit: null },
      { status: 500 }
    );
  }
}
