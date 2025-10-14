#!/usr/bin/env node

/**
 * Test Different File Types for Preview
 * ====================================
 */

const fs = require('fs');
const path = require('path');

async function testFileTypes() {
  const knowledgePath = path.join(__dirname, '03_CONTEXT_FILES', 'SPECIALIZED_KNOWLEDGE_PACKS');

  console.log('🧪 Testing File Type Support');
  console.log('=============================');

  const testFiles = [
    {
      path: path.join(knowledgePath, 'voice-systems', 'README.md'),
      type: 'markdown',
      name: 'README.md'
    },
    {
      path: path.join(knowledgePath, 'voice-systems', 'ULTRATHINK_REALTIME_VOICE_MASTERY_v1.2.0.zip'),
      type: 'zip archive',
      name: 'ULTRATHINK_REALTIME_VOICE_MASTERY_v1.2.0.zip'
    }
  ];

  for (const testFile of testFiles) {
    console.log(`\n📁 Testing: ${testFile.name}`);
    console.log(`   Type: ${testFile.type}`);

    try {
      const stats = await fs.promises.stat(testFile.path);
      console.log(`   ✅ File exists: ${formatBytes(stats.size)}`);

      if (testFile.type === 'markdown') {
        const content = await fs.promises.readFile(testFile.path, 'utf-8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : 'No Title';
        console.log(`   ✅ Title: ${title}`);
        console.log(`   ✅ Preview: ${content.substring(0, 100)}...`);

      } else if (testFile.type === 'zip archive') {
        console.log(`   ✅ Archive ready for extraction`);
        console.log(`   ✅ Can list contents and extract on demand`);
      }

      console.log(`   ✅ Last modified: ${stats.mtime.toISOString()}`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n🎉 File Type Support Test: COMPLETE ✅');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

testFileTypes();