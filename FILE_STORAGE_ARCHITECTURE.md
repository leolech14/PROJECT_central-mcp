# 📁 Central-MCP File Storage Architecture
## Where and How Project Files Are Stored

**Date**: 2025-10-09
**Question**: Where does Central-MCP store each project's files?
**Answer**: METADATA in database, FILES stay in original locations!

---

## 🎯 THE ARCHITECTURE (Smart!)

### **Central-MCP Does NOT Copy Project Files!**

**Instead:**
```
Central-MCP stores:
✅ Metadata about files (in database)
✅ File references (paths, timestamps)
✅ File categorization (SPEC/DOC/CODE)
✅ Search index (for quick lookup)

Central-MCP does NOT store:
❌ Actual file contents (stays in projects!)
❌ Duplicate files
❌ Copies of codebases

Why:
✅ No duplication (efficient!)
✅ Files stay in git repos (source of truth)
✅ Central-MCP is lightweight (2 MB database)
✅ Projects own their files
```

---

## 🗄️ THE DATABASE STORES REFERENCES

### **context_files Table (1,883 rows for LocalBrain):**

```sql
CREATE TABLE context_files (
  id TEXT PRIMARY KEY,
  project_id TEXT,              -- Which project
  relative_path TEXT,           -- Path within project
  absolute_path TEXT,           -- Full system path
  type TEXT,                    -- SPEC/DOC/CODE/etc
  size INTEGER,                 -- File size in bytes
  created_at TEXT,              -- File creation time
  modified_at TEXT,             -- Last modified
  content_hash TEXT,            -- For change detection
  indexed_at TEXT               -- When indexed by CI
);
```

**Example Rows:**
```
LocalBrain context_files:
├─ relative_path: "02_SPECBASES/LocalBrain/features/LB-AUTH-001.spec.md"
├─ absolute_path: "/Users/lech/PROJECTS_all/LocalBrain/02_SPECBASES/..."
├─ type: "SPEC"
├─ size: 2048 bytes
└─ indexed_at: 2025-10-09

Central-MCP knows:
✅ File exists at /Users/lech/PROJECTS_all/LocalBrain/...
✅ It's a SPEC file
✅ Last modified: Oct 8
✅ Can search/retrieve it

Central-MCP does NOT:
❌ Copy the file
❌ Store file contents
❌ Duplicate data
```

---

## 📍 WHERE FILES ACTUALLY LIVE

### **Project Files Stay in Their Original Locations:**

**LocalBrain Project:**
```
Files physically at:
/Users/lech/PROJECTS_all/LocalBrain/
├─ 02_SPECBASES/LocalBrain/*.spec.md (42 files)
├─ docs/*.md (89 files)
├─ 01_CODEBASES/**/*.ts (1,203 files)
└─ Total: 1,883 files

Central-MCP database stores:
├─ Reference to each file (path, type, size)
├─ Metadata for search
├─ Change tracking (hash, timestamps)
└─ NO file contents!

Size in Central-MCP database: ~200 KB (metadata only)
Size on disk in LocalBrain: ~45 MB (actual files)
```

**AudioAnalyzer Project (Future):**
```
Files physically at:
/Users/lech/PROJECTS_all/AudioAnalyzer/
├─ specs/
├─ src/
└─ docs/

Central-MCP stores:
├─ project_id: "audio-analyzer"
├─ References to each file
└─ Metadata for coordination

Files never move from AudioAnalyzer! ✅
```

---

## 💾 OPTIONAL: CONTEXT STORAGE (Cloud Upload)

### **For Cloud Deployment:**

**Current (Local):**
```
data/context-storage/ (compressed cache)
├─ 0deca674.../file1.ts.gz (compressed file)
├─ 0deca674.../file2.cjs.gz
└─ Optional local cache

Purpose: Speed up repeated access
Size: Small (compressed)
```

**Future (Cloud):**
```
S3/GCS Bucket: central-mcp-context/
├─ project-uuid/file1.ts.gz
├─ project-uuid/file2.ts.gz
└─ Shared across all machines

Database stores:
├─ cloud_storage table (5 rows)
├─ References to S3/GCS objects
└─ Download on-demand

Files in cloud: Optional optimization
Files in projects: Always source of truth ✅
```

---

## 🎯 THE SMART DESIGN

### **Why This Architecture is Brilliant:**

**1. No Duplication**
```
Project has: 1,883 files (45 MB)
Central-MCP has: Metadata only (200 KB)

If Central-MCP copied files:
├─ 60 projects × 45 MB = 2.7 GB! ❌
├─ Sync issues
├─ Version conflicts
└─ Maintenance nightmare

Current approach:
├─ Database: 2 MB total ✅
├─ References only
├─ Files stay in git repos
└─ No sync issues
```

**2. Git is Source of Truth**
```
Project files:
├─ Managed by git
├─ Versioned
├─ Backed up
└─ Source of truth ✅

Central-MCP:
├─ Reads files when needed
├─ Indexes metadata
├─ Doesn't own files
└─ Coordinator, not storage
```

**3. Portable**
```
Central-MCP database:
├─ Only 2 MB
├─ Can backup easily
├─ Can migrate to cloud
└─ Can share across machines

Project files:
├─ Stay in projects
├─ Independent
├─ No dependency on CI database
└─ Can work offline
```

---

## 📊 COMPLETE STORAGE MAP

### **For Each Project Central-MCP Manages:**

**Stored in Central-MCP Database:**
```sql
projects table:
├─ id: "localbrain"
├─ name: "LocalBrain"
├─ path: "/Users/lech/PROJECTS_all/LocalBrain"
├─ type: "COMMERCIAL_APP"
└─ metadata: {...}

context_files table (1,883 rows):
├─ References to LocalBrain files
├─ Paths: absolute + relative
├─ Metadata: type, size, timestamps
└─ NO actual file contents!

tasks table (19 rows):
├─ LocalBrain app tasks
├─ Progress tracking
└─ Coordination data
```

**Stored in Original Project:**
```
/Users/lech/PROJECTS_all/LocalBrain/
├─ 02_SPECBASES/ (42 spec files) ✅
├─ docs/ (89 doc files) ✅
├─ 01_CODEBASES/ (1,203 code files) ✅
└─ CLAUDE.md, README.md, etc. ✅

All files STAY HERE! ✅
Central-MCP just references them! ✅
```

---

## 🎯 ANSWER TO YOUR QUESTION

**"Where does Central-MCP store each project's files?"**

### **SHORT ANSWER:**

**It DOESN'T store files - it stores REFERENCES!**

### **COMPLETE ANSWER:**

**Central-MCP Database Contains:**
- ✅ Project metadata (name, path, type)
- ✅ File references (1,883 for LocalBrain)
- ✅ File metadata (type, size, timestamps)
- ✅ Task coordination data
- ✅ Agent intelligence data

**Actual Project Files Stay At:**
- ✅ `/Users/lech/PROJECTS_all/LocalBrain/` (LocalBrain files)
- ✅ `/Users/lech/PROJECTS_all/AudioAnalyzer/` (AudioAnalyzer files)
- ✅ `/Users/lech/PROJECTS_all/Gov.br/` (Gov.br files)
- ✅ Original locations (never moved!)

**Optional Cloud Storage:**
- ⚠️ `data/context-storage/` (compressed cache, optional)
- 🔮 S3/GCS (future, for sharing across machines)

---

## 💡 THE GENIUS

**Central-MCP is a COORDINATOR, not a FILE STORAGE SYSTEM!**

```
Like a library card catalog:
├─ Catalog: Knows where every book is
├─ Books: Stay on shelves in their sections
└─ Efficient: No duplication

Central-MCP:
├─ Database: Knows where every file is
├─ Files: Stay in their project directories
└─ Efficient: 2 MB database coordinates 60 projects!
```

**This is why it's called "Central Intelligence" not "Central Storage"!** 🧠✨

---

**Created By**: Agent B (1M Supervisor)
**Principle**: Reference, don't duplicate
**Result**: Lightweight, portable, efficient ✅
