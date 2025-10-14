/**
 * 999-X-Ray-Tool: Analyze Recent Files
 * =====================================
 *
 * MCP Tool for analyzing recent files with AI-generated context
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import type {
  AnalyzeRecentFilesArgs,
  XRayToolResponse,
  AnalysisResults
} from '../types/ultrathink.js';

export const analyzeRecentFilesTool = {
  name: "analyze_recent_files",
  description: "Analyze the last 999 modified files with AI-generated context using local Ollama",
  inputSchema: {
    type: "object",
    properties: {
      directory: {
        type: "string",
        description: "Directory to analyze (default: current directory)",
        default: "."
      },
      max_files: {
        type: "integer",
        description: "Maximum number of files to analyze (default: 999)",
        default: 999,
        minimum: 1,
        maximum: 9999
      },
      ollama_model: {
        type: "string",
        description: "Ollama model to use (default: llama3.1:8b)",
        default: "llama3.1:8b"
      },
      output_file: {
        type: "string",
        description: "Output JSON file path (optional)",
        default: null
      },
      include_binary: {
        type: "boolean",
        description: "Include binary files in analysis (default: false)",
        default: false
      },
      parallel_processing: {
        type: "boolean",
        description: "Use parallel processing (default: true)",
        default: true
      }
    }
  }
};

export async function handleAnalyzeRecentFiles(
  args: AnalyzeRecentFilesArgs
): Promise<XRayToolResponse> {
  const startTime = Date.now();

  try {
    const scriptPath = path.join(__dirname, 'ULTRATHINK_FILE_ANALYZER.py');

    // Verify the script exists
    try {
      await fs.access(scriptPath);
    } catch (error) {
      throw new Error(`999-X-Ray-Tool analyzer script not found: ${scriptPath}`);
    }

    // Build command arguments
    const cmdArgs: string[] = [scriptPath];

    if (args.directory && args.directory !== '.') {
      cmdArgs.push(args.directory);
    }

    if (args.max_files && args.max_files !== 999) {
      cmdArgs.push('--max-files', args.max_files.toString());
    }

    if (args.ollama_model && args.ollama_model !== 'llama3.1:8b') {
      cmdArgs.push('--ollama-model', args.ollama_model);
    }

    if (args.output_file) {
      cmdArgs.push('-o', args.output_file);
    }

    if (!args.parallel_processing) {
      cmdArgs.push('--no-parallel');
    }

    console.log(`🧠 999-X-Ray-Tool analyzing: ${args.directory || '.'} with ${args.max_files || 999} files`);

    // Execute the analysis
    const result = await executePythonScript(cmdArgs);

    const processingTime = Date.now() - startTime;

    // Try to read and parse the output file if it exists
    let analysisData: AnalysisResults | null = null;
    const outputFile = args.output_file || generateOutputFilename();

    try {
      const outputData = await fs.readFile(outputFile, 'utf-8');
      analysisData = JSON.parse(outputData);
    } catch (error) {
      // Output file might not exist or be invalid - continue without it
      console.warn('Could not read output file:', error);
    }

    return {
      success: true,
      message: `999-X-Ray-Tool analysis completed successfully`,
      data: {
        stdout: result.stdout,
        stderr: result.stderr,
        analysisData,
        outputFile: outputFile
      },
      metadata: {
        processing_time: processingTime,
        files_analyzed: analysisData?.metadata.total_files_analyzed || 0,
        ollama_model: args.ollama_model || 'llama3.1:8b'
      }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;

    return {
      success: false,
      message: `999-X-Ray-Tool analysis failed`,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        processing_time: processingTime
      }
    };
  }
}

function executePythonScript(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const process = spawn('python3', args, {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 300000 // 5 minute timeout
    });

    let stdout = '';
    let stderr = '';

    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Python script exited with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(new Error(`Failed to execute Python script: ${error.message}`));
    });

    // Handle timeout
    process.on('timeout', () => {
      process.kill();
      reject(new Error('Python script execution timed out'));
    });
  });
}

function generateOutputFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `xray-analysis-${timestamp}.json`;
}