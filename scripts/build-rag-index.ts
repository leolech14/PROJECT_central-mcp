#!/usr/bin/env tsx

/**
 * Build RAG Index - Populate Central-MCP Knowledge Base
 * ====================================================
 *
 * Executes RAG builders to populate empty RAG tables with specification knowledge.
 * Makes Central-MCP's 02_SPECBASES/ content searchable for AI agents.
 *
 * Usage:
 *   npx tsx scripts/build-rag-index.ts [--simple | --docling]
 *
 * Options:
 *   --simple   Use RAGIndexBuilder (text-based, fast)
 *   --docling  Use GraniteDoclingRAG (vision models, advanced)
 *   (default)  Use both builders for complete coverage
 */

import Database from 'better-sqlite3';
import path from 'path';
import { RAGIndexBuilder } from '../src/spec/RAGIndexBuilder.js';
import { GraniteDoclingRAG } from '../src/spec/GraniteDoclingRAG.js';

const PROJECT_PATH = '/Users/lech/PROJECTS_all/PROJECT_central-mcp/central-mcp';
const DB_PATH = path.join(PROJECT_PATH, 'data/registry.db');

async function main() {
  const args = process.argv.slice(2);
  const useSimple = args.includes('--simple');
  const useDocling = args.includes('--docling');
  const useBoth = !useSimple && !useDocling;

  console.log('🚀 Central-MCP RAG Index Builder');
  console.log('================================\n');
  console.log(`📍 Project: ${PROJECT_PATH}`);
  console.log(`💾 Database: ${DB_PATH}\n`);

  // Open database connection
  const db = new Database(DB_PATH);
  console.log('✅ Database connected\n');

  try {
    // 1. Simple Text-Based RAG (Fast)
    if (useSimple || useBoth) {
      console.log('🔵 Building Simple RAG Index (text-based)...\n');
      const ragBuilder = new RAGIndexBuilder(db);
      await ragBuilder.buildRAGIndex(PROJECT_PATH);

      console.log('\n📊 Simple RAG Statistics:');
      const stats = ragBuilder.getStatistics();
      console.log(`   Specifications indexed: ${stats.totalSpecs}`);
      console.log(`   Total chunks: ${stats.totalChunks}`);
      console.log(`   Type distribution:`, stats.typeDistribution);
      console.log(`   Layer distribution:`, stats.layerDistribution);
      console.log(`   Importance levels:`, stats.importanceDistribution);
      console.log();
    }

    // 2. Advanced Docling RAG (Vision Models, Multi-Format)
    if (useDocling || useBoth) {
      console.log('🟣 Building Granite-Docling RAG Index (advanced)...\n');
      const doclingRAG = new GraniteDoclingRAG(db);

      try {
        await doclingRAG.buildRAGIndex(PROJECT_PATH);

        console.log('\n📊 Docling RAG Statistics:');
        const doclingStats = doclingRAG.getStatistics();
        console.log(`   Documents processed: ${doclingStats.documents.total_documents}`);
        console.log(`   File types: ${doclingStats.documents.unique_file_types}`);
        console.log(`   Total chunks: ${doclingStats.totalChunks}`);
        console.log(`   Avg processing time: ${doclingStats.documents.avg_processing_time}ms`);
        console.log(`   Chunks by type:`, doclingStats.chunksByType);
        console.log(`   Files by type:`, doclingStats.filesByType);
      } catch (error: any) {
        console.log('\n⚠️  Docling RAG skipped (requires Docling installation)');
        console.log(`   Error: ${error.message}`);
        console.log('   Install: pip install docling');
        console.log('   Continue with simple RAG only...\n');
      }
    }

    // 3. Verify Population
    console.log('\n✅ RAG INDEX BUILD COMPLETE!\n');
    console.log('📈 Database Population Status:');

    const specCount = db.prepare('SELECT COUNT(*) as count FROM rag_spec_chunks').get() as { count: number };
    const doclingCount = db.prepare('SELECT COUNT(*) as count FROM docling_chunks').get() as { count: number };

    console.log(`   rag_spec_chunks: ${specCount.count} rows`);
    console.log(`   docling_chunks: ${doclingCount.count} rows`);
    console.log();

    // 4. Test Search
    if (specCount.count > 0) {
      console.log('🔍 Testing Search Functionality...\n');
      const ragBuilder = new RAGIndexBuilder(db);
      const searchResults = await ragBuilder.searchSpecifications('dashboard UI', 5);

      console.log(`   Search: "dashboard UI"`);
      console.log(`   Results: ${searchResults.length} matches\n`);

      searchResults.forEach((result: any, i: number) => {
        console.log(`   ${i + 1}. ${result.title}`);
        console.log(`      Type: ${result.type} | Layer: ${result.layer}`);
        console.log(`      Snippet: ${result.snippet.substring(0, 100)}...`);
        console.log();
      });
    }

    console.log('🎯 Central-MCP RAG system ready for semantic search!');
    console.log('   Agents can now query specifications with natural language.\n');

  } catch (error: any) {
    console.error('\n❌ RAG Index Build Failed:');
    console.error(`   ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  } finally {
    db.close();
    console.log('✅ Database connection closed');
  }
}

main().catch(console.error);
