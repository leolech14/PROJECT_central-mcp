/**
 * Discovery Module Exports
 * =========================
 *
 * Universal automatic discovery system for:
 * - Projects (auto-detect and register)
 * - Context (auto-extract and index)
 * - Agents (recognize and track)
 * - Job Proposals (intelligent matching)
 */

export { DiscoveryEngine } from './DiscoveryEngine.js';
export type { EnvironmentDiscovery } from './DiscoveryEngine.js';

export { ProjectDetector } from './ProjectDetector.js';
export type { Project, ProjectType, ProjectMetadata } from './ProjectDetector.js';

export { ContextExtractor } from './ContextExtractor.js';
export type {
  ExtractedContext,
  ContextFile,
  ContextFileType,
  ContextCategories,
  ContextStatistics,
  KeyFiles
} from './ContextExtractor.js';

export { AgentRecognizer } from './AgentRecognizer.js';
export type {
  Agent,
  AgentCapabilities,
  AgentMetadata,
  AgentIdentity,
  ConnectionRequest
} from './AgentRecognizer.js';

export { JobProposalEngine } from './JobProposalEngine.js';
export type {
  JobProposal,
  RelevantContext,
  TaskScore
} from './JobProposalEngine.js';

export { ContextManager } from '../core/ContextManager.js';
export type {
  CloudStorageConfig,
  UploadResult,
  DownloadResult,
  SearchOptions,
  SearchResult,
  ContextStats
} from '../core/ContextManager.js';
