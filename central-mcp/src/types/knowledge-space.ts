/**
 * Knowledge Space Type Definitions
 * ================================
 *
 * Type definitions for the Central-MCP Knowledge Space system.
 * These interfaces define the data structures used by the Knowledge Space API.
 */

/**
 * Individual knowledge pack information
 */
export interface KnowledgePack {
  /** Name of the knowledge pack file or directory */
  name: string;
  /** Type of the knowledge pack */
  type: 'file' | 'directory';
  /** Size in bytes */
  size: number;
  /** Last modification timestamp */
  lastModified: string;
  /** Optional description extracted from filename or metadata */
  description?: string;
  /** File extension if applicable */
  extension?: string;
  /** Full path relative to knowledge space root */
  path: string;
  /** Whether this is a featured/important pack */
  featured?: boolean;
  /** Version information if available */
  version?: string;
}

/**
 * Knowledge category information
 */
export interface KnowledgeCategory {
  /** Unique identifier for the category */
  id: string;
  /** Display name of the category */
  name: string;
  /** Brief description of the category */
  description: string;
  /** Full content of the README.md file */
  readmeContent: string;
  /** List of knowledge packs in this category */
  knowledgePacks: KnowledgePack[];
  /** Total number of files in this category */
  fileCount: number;
  /** Total size of all files in bytes */
  totalSize: number;
  /** Last modification timestamp for the category */
  lastModified: string;
  /** Category icon or emoji */
  icon?: string;
  /** Tags for categorization and filtering */
  tags: string[];
  /** Usage statistics */
  stats?: {
    downloads: number;
    views: number;
    lastAccessed: string;
  };
}

/**
 * Main knowledge space response
 */
export interface KnowledgeSpaceResponse {
  /** List of all knowledge categories */
  categories: KnowledgeCategory[];
  /** Total number of categories */
  totalCategories: number;
  /** Total number of knowledge packs across all categories */
  totalKnowledgePacks: number;
  /** Total size of all knowledge packs */
  totalSize: number;
  /** Last update timestamp */
  lastUpdated: string;
  /** System information */
  systemInfo: {
    version: string;
    apiVersion: string;
    uptime: number;
  };
}

/**
 * Knowledge space API query parameters
 */
export interface KnowledgeSpaceQuery {
  /** Filter by category IDs */
  categories?: string[];
  /** Search term for knowledge packs */
  search?: string;
  /** Filter by file type */
  fileTypes?: string[];
  /** Sort order */
  sortBy?: 'name' | 'lastModified' | 'size' | 'downloads';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Pagination offset */
  offset?: number;
  /** Number of items to return */
  limit?: number;
  /** Include featured items only */
  featuredOnly?: boolean;
}

/**
 * Knowledge pack download response
 */
export interface KnowledgePackDownloadResponse {
  /** Download URL for the knowledge pack */
  downloadUrl: string;
  /** File information */
  fileInfo: {
    name: string;
    size: number;
    mimeType: string;
    checksum: string;
  };
  /** Download expiration time */
  expiresAt: string;
  /** Usage instructions if available */
  instructions?: string;
}

/**
 * Knowledge space statistics
 */
export interface KnowledgeSpaceStats {
  /** Total categories */
  totalCategories: number;
  /** Total knowledge packs */
  totalKnowledgePacks: number;
  /** Total storage used */
  totalStorageUsed: number;
  /** Most popular categories */
  popularCategories: Array<{
    categoryId: string;
    categoryName: string;
    downloadCount: number;
  }>;
  /** Recently updated categories */
  recentlyUpdated: Array<{
    categoryId: string;
    categoryName: string;
    lastModified: string;
  }>;
  /** Storage by category */
  storageByCategory: Array<{
    categoryId: string;
    categoryName: string;
    size: number;
    fileCount: number;
  }>;
  /** File type distribution */
  fileTypeDistribution: Array<{
    extension: string;
    count: number;
    totalSize: number;
  }>;
}

/**
 * Knowledge space configuration
 */
export interface KnowledgeSpaceConfig {
  /** Root directory path */
  rootPath: string;
  /** Whether to enable caching */
  enableCache: boolean;
  /** Cache duration in seconds */
  cacheDuration: number;
  /** Maximum file size for processing */
  maxFileSize: number;
  /** Allowed file extensions */
  allowedExtensions: string[];
  /** Whether to generate download URLs */
  generateDownloadUrls: boolean;
  /** Base URL for downloads */
  downloadBaseUrl: string;
  /** Whether to track usage statistics */
  trackStats: boolean;
}

/**
 * Knowledge space validation result
 */
export interface KnowledgeSpaceValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** List of validation errors */
  errors: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  /** Validation statistics */
  stats: {
    categoriesChecked: number;
    filesChecked: number;
    errorsFound: number;
    warningsFound: number;
  };
  /** Recommendations for improvement */
  recommendations: string[];
}

/**
 * Knowledge space search result
 */
export interface KnowledgeSpaceSearchResult {
  /** Search query */
  query: string;
  /** Total matches found */
  totalMatches: number;
  /** Matching knowledge packs */
  matches: Array<{
    category: KnowledgeCategory;
    pack: KnowledgePack;
    relevanceScore: number;
    matchedFields: string[];
  }>;
  /** Search suggestions */
  suggestions?: string[];
  /** Search duration in milliseconds */
  searchDuration: number;
}

/**
 * Knowledge space event types
 */
export type KnowledgeSpaceEventType =
  | 'category_added'
  | 'category_updated'
  | 'category_removed'
  | 'pack_added'
  | 'pack_updated'
  | 'pack_removed'
  | 'pack_downloaded'
  | 'search_performed';

/**
 * Knowledge space event
 */
export interface KnowledgeSpaceEvent {
  /** Event type */
  type: KnowledgeSpaceEventType;
  /** Timestamp */
  timestamp: string;
  /** Event data */
  data: any;
  /** User or system that triggered the event */
  source: string;
  /** Event ID */
  id: string;
}