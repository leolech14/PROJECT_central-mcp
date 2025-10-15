"use strict";
/**
 * Context Auto-Extractor
 * =======================
 *
 * Automatically extracts all context from project directory.
 *
 * Features:
 * - Scans specs, docs, code, architecture files
 * - Categorizes files by type
 * - Extracts metadata
 * - Prepares for cloud upload
 * - Generates statistics
 *
 * T002 - CRITICAL PATH - DISCOVERY ENGINE FOUNDATION
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextExtractor = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path_1 = require("path");
var uuid_1 = require("uuid");
var ContextExtractor = /** @class */ (function () {
    function ContextExtractor(db) {
        this.db = db;
    }
    /**
     * Extract all context from project directory
     */
    ContextExtractor.prototype.extractContext = function (projectId, projectPath) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, files, categories, keyFiles, statistics, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDD0D Extracting context from: ".concat(projectPath));
                        startTime = Date.now();
                        return [4 /*yield*/, this.scanProjectDirectory(projectId, projectPath)];
                    case 1:
                        files = _a.sent();
                        categories = this.categorizeFiles(files);
                        keyFiles = this.readKeyFiles(projectPath);
                        statistics = this.generateStatistics(files, categories);
                        // 5. Store in database
                        return [4 /*yield*/, this.storeContext(files)];
                    case 2:
                        // 5. Store in database
                        _a.sent();
                        duration = Date.now() - startTime;
                        console.log("\u2705 Context extracted: ".concat(files.length, " files in ").concat(duration, "ms"));
                        return [2 /*return*/, {
                                projectId: projectId,
                                extractedAt: new Date().toISOString(),
                                files: files,
                                categories: categories,
                                statistics: statistics,
                                keyFiles: keyFiles
                            }];
                }
            });
        });
    };
    /**
     * Scan project directory for all relevant files
     */
    ContextExtractor.prototype.scanProjectDirectory = function (projectId, projectPath) {
        return __awaiter(this, void 0, void 0, function () {
            var files, scanDirs, _i, scanDirs_1, _a, dir, type, fullPath, dirFiles, patterns, _b, patterns_1, _c, pattern, type, matchedFiles, uniqueFiles, _d, files_1, file;
            return __generator(this, function (_e) {
                files = [];
                scanDirs = [
                    { dir: '02_SPECBASES', type: 'SPEC' },
                    { dir: 'docs', type: 'DOC' },
                    { dir: '01_CODEBASES', type: 'CODE' },
                    { dir: '04_AGENT_FRAMEWORK', type: 'ARCHITECTURE' },
                    { dir: '05_EXECUTION_STATUS', type: 'STATUS' }
                ];
                // Scan each directory
                for (_i = 0, scanDirs_1 = scanDirs; _i < scanDirs_1.length; _i++) {
                    _a = scanDirs_1[_i], dir = _a.dir, type = _a.type;
                    fullPath = path_1.default.join(projectPath, dir);
                    if ((0, fs_1.existsSync)(fullPath)) {
                        dirFiles = this.scanDirectory(projectId, projectPath, fullPath, type);
                        files.push.apply(files, dirFiles);
                    }
                }
                patterns = [
                    { pattern: '**/CLAUDE.md', type: 'CONFIG' },
                    { pattern: '**/README.md', type: 'DOC' },
                    { pattern: '**/*ARCHITECTURE*.md', type: 'ARCHITECTURE' },
                    { pattern: '**/*STATUS*.md', type: 'STATUS' },
                    { pattern: '**/CENTRAL_TASK_REGISTRY.md', type: 'CONFIG' }
                ];
                for (_b = 0, patterns_1 = patterns; _b < patterns_1.length; _b++) {
                    _c = patterns_1[_b], pattern = _c.pattern, type = _c.type;
                    matchedFiles = this.findFilesByPattern(projectId, projectPath, pattern, type);
                    files.push.apply(files, matchedFiles);
                }
                uniqueFiles = new Map();
                for (_d = 0, files_1 = files; _d < files_1.length; _d++) {
                    file = files_1[_d];
                    if (!uniqueFiles.has(file.relativePath)) {
                        uniqueFiles.set(file.relativePath, file);
                    }
                }
                return [2 /*return*/, Array.from(uniqueFiles.values())];
            });
        });
    };
    /**
     * Scan directory recursively (OPTIMIZED - Parallel + Smart Skipping)
     */
    ContextExtractor.prototype.scanDirectory = function (projectId, projectPath, directory, defaultType) {
        var files = [];
        var maxFileSize = 10 * 1024 * 1024; // 10MB limit
        var maxFilesPerDir = 500; // Limit files per directory
        try {
            var entries = (0, fs_1.readdirSync)(directory, { withFileTypes: true });
            // Separate files and directories
            var dirs = [];
            var fileEntries = [];
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var entry = entries_1[_i];
                if (this.shouldSkip(entry.name))
                    continue;
                var fullPath = path_1.default.join(directory, entry.name);
                if (entry.isDirectory()) {
                    dirs.push(fullPath);
                }
                else if (entry.isFile()) {
                    fileEntries.push({ name: entry.name, fullPath: fullPath });
                }
                // Limit files to prevent explosion
                if (fileEntries.length >= maxFilesPerDir) {
                    console.warn("\u26A0\uFE0F  Directory ".concat(directory, " has ").concat(entries.length, " files, limiting to ").concat(maxFilesPerDir));
                    break;
                }
            }
            // Process files (quick - just metadata)
            for (var _a = 0, fileEntries_1 = fileEntries; _a < fileEntries_1.length; _a++) {
                var entry = fileEntries_1[_a];
                try {
                    var stats = (0, fs_1.statSync)(entry.fullPath);
                    // Skip large files (likely binaries)
                    if (stats.size > maxFileSize) {
                        console.warn("\u26A0\uFE0F  Skipping large file: ".concat(entry.name, " (").concat(stats.size, " bytes)"));
                        continue;
                    }
                    var file = this.createContextFile(projectId, projectPath, entry.fullPath, defaultType);
                    if (file) {
                        files.push(file);
                    }
                }
                catch (error) {
                    // Skip inaccessible files
                    continue;
                }
            }
            // Recurse into subdirectories (limit depth)
            var depth = directory.split('/').length - projectPath.split('/').length;
            if (depth < 10) { // Max depth of 10
                for (var _b = 0, dirs_1 = dirs; _b < dirs_1.length; _b++) {
                    var dir = dirs_1[_b];
                    var subFiles = this.scanDirectory(projectId, projectPath, dir, defaultType);
                    files.push.apply(files, subFiles);
                }
            }
            else {
                console.warn("\u26A0\uFE0F  Max depth reached at: ".concat(directory));
            }
        }
        catch (error) {
            // Directory not accessible
            console.warn("\u26A0\uFE0F  Cannot scan directory: ".concat(directory));
        }
        return files;
    };
    /**
     * Create ContextFile object from file path
     */
    ContextExtractor.prototype.createContextFile = function (projectId, projectPath, filePath, defaultType) {
        try {
            var stats = (0, fs_1.statSync)(filePath);
            var relativePath = path_1.default.relative(projectPath, filePath);
            // Classify file type
            var type = this.classifyFileType(filePath, defaultType);
            // Get file hash (simple size+mtime hash)
            var hash = "".concat(stats.size, "-").concat(stats.mtimeMs);
            return {
                id: (0, uuid_1.v4)(),
                projectId: projectId,
                relativePath: relativePath,
                absolutePath: filePath,
                type: type,
                size: stats.size,
                createdAt: stats.birthtime.toISOString(),
                modifiedAt: stats.mtime.toISOString(),
                contentHash: hash
            };
        }
        catch (error) {
            return null;
        }
    };
    /**
     * Classify file type from path and extension
     */
    ContextExtractor.prototype.classifyFileType = function (filePath, defaultType) {
        var basename = path_1.default.basename(filePath);
        var ext = path_1.default.extname(filePath).toLowerCase();
        // Specific files
        if (basename === 'CLAUDE.md' || basename === 'package.json')
            return 'CONFIG';
        if (basename.includes('ARCHITECTURE'))
            return 'ARCHITECTURE';
        if (basename.includes('STATUS'))
            return 'STATUS';
        if (basename.includes('TASK_REGISTRY'))
            return 'CONFIG';
        // By directory
        if (filePath.includes('02_SPECBASES'))
            return 'SPEC';
        if (filePath.includes('/docs/'))
            return 'DOC';
        if (filePath.includes('01_CODEBASES'))
            return 'CODE';
        // By extension
        if (['.md', '.mdx'].includes(ext))
            return 'DOC';
        if (['.ts', '.tsx', '.js', '.jsx', '.swift', '.py'].includes(ext))
            return 'CODE';
        if (['.json', '.yaml', '.yml', '.toml'].includes(ext))
            return 'CONFIG';
        if (['.png', '.jpg', '.jpeg', '.svg', '.gif'].includes(ext))
            return 'ASSET';
        return defaultType;
    };
    /**
     * Find files by glob pattern
     */
    ContextExtractor.prototype.findFilesByPattern = function (projectId, projectPath, pattern, type) {
        var _this = this;
        try {
            var command = "find . -path \"".concat(pattern, "\" -type f");
            var result = (0, child_process_1.execSync)(command, {
                cwd: projectPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
            if (!result)
                return [];
            var paths = result.split('\n').filter(function (p) { return p.trim(); });
            return paths
                .map(function (p) {
                var fullPath = path_1.default.join(projectPath, p);
                return _this.createContextFile(projectId, projectPath, fullPath, type);
            })
                .filter(function (f) { return f !== null; });
        }
        catch (error) {
            return [];
        }
    };
    /**
     * Should skip this directory/file? (EXPANDED - More aggressive filtering)
     */
    ContextExtractor.prototype.shouldSkip = function (name) {
        var skipList = [
            // Dependencies
            'node_modules',
            'vendor',
            'packages',
            // Version control
            '.git',
            '.svn',
            '.hg',
            // Build outputs
            '.next',
            'dist',
            'build',
            'out',
            '.vercel',
            'coverage',
            '.turbo',
            // Caches
            '.cache',
            '__pycache__',
            '.pytest_cache',
            '.eslintcache',
            // IDE
            '.idea',
            '.vscode',
            '.vs',
            'DerivedData',
            // OS
            '.DS_Store',
            'Thumbs.db',
            // Large assets (skip for performance)
            'videos',
            'images',
            'assets',
            'public/uploads'
        ];
        return skipList.includes(name) || name.startsWith('.');
    };
    /**
     * Categorize files by type
     */
    ContextExtractor.prototype.categorizeFiles = function (files) {
        return {
            specs: files.filter(function (f) { return f.type === 'SPEC'; }),
            docs: files.filter(function (f) { return f.type === 'DOC'; }),
            code: files.filter(function (f) { return f.type === 'CODE'; }),
            architecture: files.filter(function (f) { return f.type === 'ARCHITECTURE'; }),
            status: files.filter(function (f) { return f.type === 'STATUS'; }),
            config: files.filter(function (f) { return f.type === 'CONFIG'; }),
            assets: files.filter(function (f) { return f.type === 'ASSET'; })
        };
    };
    /**
     * Read key project files
     */
    ContextExtractor.prototype.readKeyFiles = function (projectPath) {
        var keyFiles = {};
        // CLAUDE.md
        var claudePath = path_1.default.join(projectPath, 'CLAUDE.md');
        if ((0, fs_1.existsSync)(claudePath)) {
            keyFiles.claudeMd = (0, fs_1.readFileSync)(claudePath, 'utf-8');
        }
        // README.md
        var readmePath = path_1.default.join(projectPath, 'README.md');
        if ((0, fs_1.existsSync)(readmePath)) {
            keyFiles.readmeMd = (0, fs_1.readFileSync)(readmePath, 'utf-8');
        }
        // package.json
        var packagePath = path_1.default.join(projectPath, 'package.json');
        if ((0, fs_1.existsSync)(packagePath)) {
            keyFiles.packageJson = (0, fs_1.readFileSync)(packagePath, 'utf-8');
        }
        // Task registry
        var taskRegistryPath = path_1.default.join(projectPath, '04_AGENT_FRAMEWORK/CENTRAL_TASK_REGISTRY.md');
        if ((0, fs_1.existsSync)(taskRegistryPath)) {
            keyFiles.taskRegistry = (0, fs_1.readFileSync)(taskRegistryPath, 'utf-8');
        }
        return keyFiles;
    };
    /**
     * Generate statistics
     */
    ContextExtractor.prototype.generateStatistics = function (files, categories) {
        var totalSize = files.reduce(function (sum, f) { return sum + f.size; }, 0);
        var byType = {
            SPEC: categories.specs.length,
            DOC: categories.docs.length,
            CODE: categories.code.length,
            ARCHITECTURE: categories.architecture.length,
            STATUS: categories.status.length,
            CONFIG: categories.config.length,
            ASSET: categories.assets.length,
            UNKNOWN: files.filter(function (f) { return f.type === 'UNKNOWN'; }).length
        };
        // Count lines of code (approximation)
        var linesOfCode = categories.code.reduce(function (sum, file) {
            try {
                var content = (0, fs_1.readFileSync)(file.absolutePath, 'utf-8');
                return sum + content.split('\n').length;
            }
            catch (error) {
                return sum;
            }
        }, 0);
        // Extract technologies from code files
        var technologies = this.detectTechnologies(categories.code);
        return {
            totalFiles: files.length,
            totalSize: totalSize,
            byType: byType,
            linesOfCode: linesOfCode,
            technologies: technologies
        };
    };
    /**
     * Detect technologies from code files
     */
    ContextExtractor.prototype.detectTechnologies = function (codeFiles) {
        var technologies = new Set();
        for (var _i = 0, _a = codeFiles.slice(0, 50); _i < _a.length; _i++) { // Sample first 50 files
            var file = _a[_i];
            var ext = path_1.default.extname(file.relativePath);
            if (ext === '.ts' || ext === '.tsx')
                technologies.add('TypeScript');
            if (ext === '.js' || ext === '.jsx')
                technologies.add('JavaScript');
            if (ext === '.swift')
                technologies.add('Swift');
            if (ext === '.py')
                technologies.add('Python');
            if (file.relativePath.includes('next'))
                technologies.add('Next.js');
            if (file.relativePath.includes('react'))
                technologies.add('React');
            if (file.relativePath.includes('electron'))
                technologies.add('Electron');
        }
        return Array.from(technologies);
    };
    /**
     * Store context in database
     */
    ContextExtractor.prototype.storeContext = function (files) {
        return __awaiter(this, void 0, void 0, function () {
            var insert, insertMany;
            return __generator(this, function (_a) {
                // Create context_files table if needed
                this.db.exec("\n      CREATE TABLE IF NOT EXISTS context_files (\n        id TEXT PRIMARY KEY,\n        project_id TEXT NOT NULL,\n        relative_path TEXT NOT NULL,\n        absolute_path TEXT NOT NULL,\n        type TEXT NOT NULL,\n        size INTEGER NOT NULL,\n        created_at TEXT NOT NULL,\n        modified_at TEXT NOT NULL,\n        content_hash TEXT NOT NULL,\n        indexed_at TEXT NOT NULL DEFAULT (datetime('now')),\n        UNIQUE(project_id, relative_path),\n        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE\n      )\n    ");
                this.db.exec("\n      CREATE INDEX IF NOT EXISTS idx_context_project ON context_files(project_id);\n      CREATE INDEX IF NOT EXISTS idx_context_type ON context_files(type);\n      CREATE INDEX IF NOT EXISTS idx_context_modified ON context_files(modified_at);\n    ");
                insert = this.db.prepare("\n      INSERT OR REPLACE INTO context_files (\n        id, project_id, relative_path, absolute_path, type,\n        size, created_at, modified_at, content_hash\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\n    ");
                insertMany = this.db.transaction(function (files) {
                    for (var _i = 0, files_2 = files; _i < files_2.length; _i++) {
                        var file = files_2[_i];
                        insert.run(file.id, file.projectId, file.relativePath, file.absolutePath, file.type, file.size, file.createdAt, file.modifiedAt, file.contentHash);
                    }
                });
                insertMany(files);
                console.log("\u2705 Stored ".concat(files.length, " files in database"));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get context files for project
     */
    ContextExtractor.prototype.getContextFiles = function (projectId, type) {
        var _a;
        var query = "SELECT * FROM context_files WHERE project_id = ?";
        var params = [projectId];
        if (type) {
            query += " AND type = ?";
            params.push(type);
        }
        query += " ORDER BY modified_at DESC";
        var rows = (_a = this.db.prepare(query)).all.apply(_a, params);
        return rows.map(function (row) { return ({
            id: row.id,
            projectId: row.project_id,
            relativePath: row.relative_path,
            absolutePath: row.absolute_path,
            type: row.type,
            size: row.size,
            createdAt: row.created_at,
            modifiedAt: row.modified_at,
            contentHash: row.content_hash
        }); });
    };
    /**
     * Search context files by content or name
     */
    ContextExtractor.prototype.searchContextFiles = function (projectId, query, limit) {
        if (limit === void 0) { limit = 20; }
        var rows = this.db.prepare("\n      SELECT * FROM context_files\n      WHERE project_id = ?\n        AND (relative_path LIKE ? OR absolute_path LIKE ?)\n      ORDER BY modified_at DESC\n      LIMIT ?\n    ").all(projectId, "%".concat(query, "%"), "%".concat(query, "%"), limit);
        return rows.map(function (row) { return ({
            id: row.id,
            projectId: row.project_id,
            relativePath: row.relative_path,
            absolutePath: row.absolute_path,
            type: row.type,
            size: row.size,
            createdAt: row.created_at,
            modifiedAt: row.modified_at,
            contentHash: row.content_hash
        }); });
    };
    /**
     * Get context statistics for project
     */
    ContextExtractor.prototype.getContextStatistics = function (projectId) {
        var files = this.getContextFiles(projectId);
        var categories = this.categorizeFiles(files);
        return this.generateStatistics(files, categories);
    };
    /**
     * Check if context needs update (files changed)
     */
    ContextExtractor.prototype.needsUpdate = function (projectId, projectPath) {
        var storedFiles = this.getContextFiles(projectId);
        // Quick check: count files in directory vs database
        try {
            var currentFileCount = (0, child_process_1.execSync)('find . -type f | wc -l', {
                cwd: projectPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
            var count = parseInt(currentFileCount, 10);
            if (Math.abs(count - storedFiles.length) > 10) {
                return true; // Significant change in file count
            }
        }
        catch (error) {
            return true; // Assume needs update
        }
        // Check if any key files modified
        var keyFilePaths = [
            'CLAUDE.md',
            '04_AGENT_FRAMEWORK/CENTRAL_TASK_REGISTRY.md',
            'package.json'
        ];
        var _loop_1 = function (keyPath) {
            var fullPath = path_1.default.join(projectPath, keyPath);
            if ((0, fs_1.existsSync)(fullPath)) {
                var stats = (0, fs_1.statSync)(fullPath);
                var storedFile = storedFiles.find(function (f) { return f.relativePath === keyPath; });
                if (!storedFile || stats.mtime.toISOString() !== storedFile.modifiedAt) {
                    return { value: true };
                }
            }
        };
        for (var _i = 0, keyFilePaths_1 = keyFilePaths; _i < keyFilePaths_1.length; _i++) {
            var keyPath = keyFilePaths_1[_i];
            var state_1 = _loop_1(keyPath);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return false; // No significant changes
    };
    return ContextExtractor;
}());
exports.ContextExtractor = ContextExtractor;
