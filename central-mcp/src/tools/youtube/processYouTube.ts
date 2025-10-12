/**
 * process_youtube - YouTube Content Processing Pipeline Integration
 *
 * Integrates PROJECT_youtube ytpipe tool for comprehensive video analysis:
 * - YouTube video download
 * - Whisper transcription
 * - OCR text extraction
 * - Visual analysis (BLIP + DETR)
 * - Semantic chunking
 * - Vector storage (ChromaDB, FAISS, Qdrant, etc.)
 * - Interactive HTML dashboard generation
 */

import { z } from 'zod';
import Database from 'better-sqlite3';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../../utils/logger.js';

const execAsync = promisify(exec);

const ProcessYouTubeArgsSchema = z.object({
  url: z.string(),
  backend: z.enum(['chromadb', 'faiss', 'qdrant', 'pinecone', 'weaviate']).optional(),
  outputDir: z.string().optional()
});

export const processYouTubeTool = {
  name: 'process_youtube',
  description: 'Process YouTube video through comprehensive analysis pipeline. Downloads video, transcribes with Whisper, extracts text with OCR, performs visual analysis, creates semantic chunks, and generates interactive HTML dashboard.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        description: 'YouTube video URL (e.g., "https://youtube.com/watch?v=VIDEO_ID")'
      },
      backend: {
        type: 'string',
        enum: ['chromadb', 'faiss', 'qdrant', 'pinecone', 'weaviate'],
        description: 'Vector database backend for storage (default: chromadb)'
      },
      outputDir: {
        type: 'string',
        description: 'Output directory for processed files (default: ./KNOWLEDGE_YOUTUBE)'
      }
    },
    required: ['url']
  }
};

export async function handleProcessYouTube(args: unknown, db: Database.Database) {
  const parsed = ProcessYouTubeArgsSchema.parse(args);
  const { url, backend, outputDir } = parsed;

  try {
    logger.info(`🎬 Starting YouTube processing for: ${url}`);

    // Build ytpipe command
    const flags = [
      backend ? `--backend ${backend}` : '',
      outputDir ? `--output-dir "${outputDir}"` : ''
    ].filter(Boolean).join(' ');

    const command = `ytpipe "${url}" ${flags}`.trim();

    logger.info(`📊 Executing: ${command}`);

    // Execute ytpipe (with 30 minute timeout for long videos)
    const { stdout, stderr } = await execAsync(command, {
      cwd: outputDir || process.cwd(),
      timeout: 1800000, // 30 minutes
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer
    });

    // Parse output to extract results
    const outputDirMatch = stdout.match(/Output directory: (.+)/);
    const dashboardMatch = stdout.match(/Dashboard: (.+\.html)/);
    const transcriptMatch = stdout.match(/Transcript saved: (.+)/);
    const chunksMatch = stdout.match(/(\d+) semantic chunks created/);
    const vectorMatch = stdout.match(/Vector store: (.+)/);

    const results = {
      output_dir: outputDirMatch ? outputDirMatch[1] : outputDir || './KNOWLEDGE_YOUTUBE',
      dashboard_path: dashboardMatch ? dashboardMatch[1] : null,
      transcript_path: transcriptMatch ? transcriptMatch[1] : null,
      total_chunks: chunksMatch ? parseInt(chunksMatch[1]) : 0,
      vector_store: vectorMatch ? vectorMatch[1] : null,
      backend_used: backend || 'chromadb'
    };

    // Log to central-mcp database for tracking
    const timestamp = new Date().toISOString();
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS youtube_processing (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          video_url TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          backend TEXT,
          output_dir TEXT,
          dashboard_path TEXT,
          transcript_path TEXT,
          total_chunks INTEGER,
          vector_store TEXT
        )
      `);

      const insertStmt = db.prepare(`
        INSERT INTO youtube_processing (video_url, timestamp, backend, output_dir, dashboard_path, transcript_path, total_chunks, vector_store)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        url,
        timestamp,
        results.backend_used,
        results.output_dir,
        results.dashboard_path,
        results.transcript_path,
        results.total_chunks,
        results.vector_store
      );
    } catch (dbError) {
      logger.warn('Database logging failed (non-critical):', dbError);
    }

    logger.info(`✅ YouTube processing complete: ${url}`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          video_url: url,
          results: results,
          features: [
            '🎬 YouTube Video Download',
            '🎙️ Whisper Transcription',
            '📝 OCR Text Extraction',
            '👁️ Visual Analysis (BLIP + DETR)',
            '🧩 Semantic Chunking',
            '🗄️ Vector Storage',
            '📊 Interactive HTML Dashboard',
            '🔍 LLM-Ready Knowledge Base'
          ],
          processing_info: {
            backend: results.backend_used,
            output_directory: results.output_dir,
            total_chunks: results.total_chunks
          },
          next_steps: [
            results.dashboard_path ? `Open dashboard: open "${results.dashboard_path}"` : 'Dashboard path not available',
            results.transcript_path ? `Read transcript: cat "${results.transcript_path}"` : 'Transcript path not available',
            results.vector_store ? `Vector store ready at: ${results.vector_store}` : 'Vector store location not available',
            'Use semantic search on processed content',
            'Query ChromaDB/FAISS for content retrieval'
          ],
          stdout: stdout.trim(),
          stderr: stderr ? stderr.trim() : null
        }, null, 2)
      }]
    };

  } catch (error: any) {
    logger.error(`❌ YouTube processing failed:`, error);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          stderr: error.stderr || null,
          stdout: error.stdout || null,
          video_url: url,
          troubleshooting: [
            'Check if ytpipe is installed: which ytpipe',
            'Verify YouTube URL is valid and accessible',
            'Ensure sufficient disk space for video download',
            'Check internet connection',
            'Review ytpipe logs for detailed errors',
            'Try with --backend chromadb (default and most reliable)'
          ]
        }, null, 2)
      }],
      isError: true
    };
  }
}
