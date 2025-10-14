#!/usr/bin/env node

/**
 * Test File Preview Functionality
 * ==============================
 */

const fs = require('fs');
const path = require('path');

async function testFilePreview() {
  const knowledgePath = path.join(__dirname, '03_CONTEXT_FILES', 'SPECIALIZED_KNOWLEDGE_PACKS');
  const testFile = path.join(knowledgePath, 'voice-systems', 'README.md');

  console.log('🧪 Testing File Preview System');
  console.log('==============================');

  try {
    // Test 1: Check if file exists
    console.log(`📁 Testing file: ${testFile}`);
    const stats = await fs.promises.stat(testFile);
    console.log(`✅ File exists: ${stats.size} bytes`);

    // Test 2: Read file content
    const content = await fs.promises.readFile(testFile, 'utf-8');
    console.log(`✅ Content readable: ${content.length} characters`);

    // Test 3: Parse markdown
    const lines = content.split('\n').slice(0, 10);
    console.log('✅ First 10 lines:');
    lines.forEach((line, i) => console.log(`   ${i+1}: ${line.substring(0, 60)}...`));

    // Test 4: Extract title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'No Title Found';
    console.log(`✅ Title extracted: ${title}`);

    // Test 5: Extract description
    const descMatch = content.match(/##\s+🎯\s+Purpose\s*\n\s*\n(.+?)(?=\n##|\n#|$)/s);
    const description = descMatch ? descMatch[1].trim().substring(0, 100) + '...' : 'No Description';
    console.log(`✅ Description extracted: ${description}`);

    console.log('\n🎉 File Preview Test: PASSED ✅');

  } catch (error) {
    console.error('❌ File Preview Test: FAILED', error.message);
  }
}

testFilePreview();