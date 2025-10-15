/**
 * ULTRATHINK Type Definitions
 * ==========================
 *
 * TypeScript interfaces for the ULTRATHINK X-Ray Vision system
 */
export interface FileMetadata {
    name: string;
    filepath: string;
    absolute_path: string;
    size_bytes: number;
    size_human: string;
    created_at?: string;
    modified_at?: string;
    accessed_at?: string;
    changed_at?: string;
    extension: string;
    mime_type: string;
    is_binary: boolean;
    content_hash: string;
    line_count: number;
    language: string;
    ai_context: string;
    ai_tokens_used: number;
    ai_processing_time: number;
    permissions: string;
    owner: string;
    group: string;
}
export interface AnalysisMetadata {
    generated_at: string;
    total_files_analyzed: number;
    processing_time_seconds: number;
    files_processed: number;
    cache_hits: number;
    llm_calls: number;
    cache_hit_rate: string;
    ollama_model: string;
    max_tokens: number;
    directory_analyzed: string;
}
export interface AnalysisResults {
    metadata: AnalysisMetadata;
    files: FileMetadata[];
}
export interface AnalyzeRecentFilesArgs {
    directory?: string;
    max_files?: number;
    ollama_model?: string;
    output_file?: string;
    include_binary?: boolean;
    parallel_processing?: boolean;
}
export interface GetFileSummaryArgs {
    limit?: number;
    filter_by_language?: string;
    sort_by?: 'modified_at' | 'size_bytes' | 'name' | 'language';
}
export interface SearchFileAnalysisArgs {
    query: string;
    search_in?: Array<'name' | 'filepath' | 'ai_context' | 'language' | 'all'>;
    limit?: number;
}
export interface GetAnalysisStatsArgs {
}
export interface CheckOllamaStatusArgs {
    ollama_url?: string;
}
export interface OllamaModel {
    name: string;
    size: number;
    digest?: string;
    modified_at?: string;
}
export interface OllamaStatusResponse {
    connected: boolean;
    models: OllamaModel[];
    error?: string;
}
export interface XRayToolResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
    metadata?: {
        processing_time?: number;
        files_analyzed?: number;
        ollama_model?: string;
    };
}
export interface SearchMatch {
    file: FileMetadata;
    score: number;
    reasons: string[];
    context_snippet?: string;
}
export interface AnalysisStats {
    total_files: number;
    total_size: number;
    total_lines: number;
    average_file_size: number;
    processing_time: number;
    cache_hit_rate: number;
    llm_calls: number;
    language_distribution: Record<string, number>;
    size_distribution: Record<string, number>;
    most_recent_files: Array<{
        name: string;
        modified_at: string;
        size_human: string;
    }>;
}
export interface XRayTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}
export declare class XRayToolError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class OllamaConnectionError extends XRayToolError {
    url: string;
    constructor(message: string, url: string);
}
export declare class AnalysisError extends XRayToolError {
    filepath?: string | undefined;
    constructor(message: string, filepath?: string | undefined);
}
//# sourceMappingURL=ultrathink.d.ts.map