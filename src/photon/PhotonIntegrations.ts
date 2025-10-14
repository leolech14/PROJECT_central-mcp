/**
 * PHOTON Integrations
 * ====================
 *
 * Integrates VM tools and A2A protocol into PHOTON API
 */

import { PhotonAPI } from './PhotonAPI.js';
import { PhotonCore } from './PhotonCore.js';
import { A2AServer } from '../a2a/A2AServer.js';
import { getVMTools } from '../tools/vm/index.js';
import { logger } from '../utils/logger.js';
import Database from 'better-sqlite3';

export interface PhotonIntegrationsConfig {
  a2a: {
    enabled: boolean;
    path?: string;
    enableAuth?: boolean;
  };
  vmTools: {
    enabled: boolean;
  };
}

export class PhotonIntegrations {
  private photonAPI: PhotonAPI;
  private photonCore: PhotonCore;
  private a2aServer?: A2AServer;
  private config: PhotonIntegrationsConfig;
  private db: Database.Database;

  constructor(
    photonAPI: PhotonAPI,
    photonCore: PhotonCore,
    db: Database.Database,
    config: PhotonIntegrationsConfig
  ) {
    this.photonAPI = photonAPI;
    this.photonCore = photonCore;
    this.db = db;
    this.config = config;
  }

  /**
   * Initialize all integrations
   */
  async initialize(): Promise<void> {
    logger.info('🔧 Initializing PHOTON integrations...');

    // Initialize VM Tools
    if (this.config.vmTools.enabled) {
      await this.initializeVMTools();
    }

    // Initialize A2A Server
    if (this.config.a2a.enabled) {
      await this.initializeA2AServer();
    }

    logger.info('✅ PHOTON integrations initialized');
  }

  /**
   * Initialize VM access tools
   */
  private async initializeVMTools(): Promise<void> {
    try {
      logger.info('🖥️ Initializing VM access tools...');

      const vmTools = getVMTools();

      logger.info(`✅ VM Tools initialized: ${vmTools.length} tools available`);
      logger.info('   - executeBash: Execute terminal commands on VM');
      logger.info('   - readVMFile: Read files from VM filesystem');
      logger.info('   - writeVMFile: Write files to VM filesystem');
      logger.info('   - listVMDirectory: List VM directories');

      // Note: Tools are available via getVMTools() for any MCP server integration

    } catch (error) {
      logger.error('❌ Failed to initialize VM tools:', error);
      throw error;
    }
  }

  /**
   * Initialize A2A Protocol Server
   */
  private async initializeA2AServer(): Promise<void> {
    try {
      logger.info('🤝 Initializing Agent2Agent (A2A) protocol server...');

      // Get HTTP server from PhotonAPI
      const httpServer = (this.photonAPI as any).server;

      if (!httpServer) {
        throw new Error('PhotonAPI HTTP server not available');
      }

      // Create A2A server
      this.a2aServer = new A2AServer(httpServer, this.db, {
        path: this.config.a2a.path || '/a2a',
        enableAuth: this.config.a2a.enableAuth !== false
      });

      logger.info('✅ A2A Server initialized');
      logger.info(`   - Protocol: Agent2Agent v1.0`);
      logger.info(`   - Endpoint: ws://0.0.0.0:${(this.photonAPI as any).config.port}${this.config.a2a.path || '/a2a'}`);
      logger.info(`   - Auth: ${this.config.a2a.enableAuth !== false ? 'Enabled (JWT/API Key)' : 'Disabled'}`);
      logger.info(`   - Frameworks: Google ADK, LangGraph, Crew.ai, MCP, Custom`);

    } catch (error) {
      logger.error('❌ Failed to initialize A2A server:', error);
      throw error;
    }
  }

  /**
   * Get A2A server statistics
   */
  getA2AStats() {
    if (!this.a2aServer) {
      return null;
    }

    return this.a2aServer.getStats();
  }

  /**
   * Shutdown integrations
   */
  async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down PHOTON integrations...');

    if (this.a2aServer) {
      this.a2aServer.shutdown();
      logger.info('✅ A2A Server shut down');
    }

    logger.info('✅ PHOTON integrations shut down complete');
  }
}
