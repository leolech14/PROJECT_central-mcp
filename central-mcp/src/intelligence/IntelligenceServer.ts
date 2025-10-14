/**
 * Intelligence Server (Standalone)
 * =================================
 *
 * Standalone AI intelligence server that can be run independently
 * of the main Photon server for testing and development.
 */

import { IntelligenceEngine } from './IntelligenceEngine.js';
import { EventBroadcaster } from '../events/EventBroadcaster.js';
import { logger } from '../utils/logger.js';

async function startIntelligenceServer() {
  logger.info('🧠 Starting Standalone AI Intelligence Server...');
  logger.info('================================================');

  try {
    // Initialize Intelligence Engine with Z.AI
    logger.info('🔧 Initializing AI Intelligence Engine with Z.AI GLM-4-Flash...');

    const intelligenceEngine = IntelligenceEngine.getInstance({
      enableZAI: true,
      enableAnthropic: false, // Not yet configured
      enableGemini: false, // Not yet configured
      realtimeModel: 'zai',
      optimizationModel: 'zai',
      predictionModel: 'zai',
      patternModel: 'zai'
    });

    await intelligenceEngine.start();

    logger.info('✅ AI Intelligence Engine operational');
    logger.info('');
    logger.info('💡 Intelligence Features:');
    logger.info('   - Real-time event analysis (Z.AI GLM-4-Flash)');
    logger.info('   - Pattern detection from historical data');
    logger.info('   - Optimization suggestions');
    logger.info('   - Outcome predictions');
    logger.info('');
    logger.info('📊 Usage Statistics:');
    const stats = intelligenceEngine.getStats();
    logger.info(`   Total API calls: ${stats.totalCalls}`);
    logger.info(`   Total cost: $${stats.totalCost.toFixed(4)}`);
    logger.info(`   Uptime: ${Math.round(stats.uptime / 1000)}s`);
    logger.info('');
    logger.info('✨ Intelligence Server is ready!');

    // Health check every 5 minutes
    setInterval(async () => {
      const health = await intelligenceEngine.healthCheck();
      logger.info('🔍 Health Check:', health);
    }, 5 * 60 * 1000);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('🛑 Shutting down Intelligence Server...');
      intelligenceEngine.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('🛑 Shutting down Intelligence Server...');
      intelligenceEngine.stop();
      process.exit(0);
    });

  } catch (error: any) {
    logger.error('❌ Failed to start Intelligence Server:', error.message);
    process.exit(1);
  }
}

// Start server
startIntelligenceServer().catch((error) => {
  logger.error('💥 Unhandled error:', error);
  process.exit(1);
});
