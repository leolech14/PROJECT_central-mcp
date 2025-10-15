# 📦 CODEBASE INGESTION PIPELINE - Complete Documentation

**Built**: 2025-10-12
**Status**: ✅ OPERATIONAL - Product Extraction System
**Purpose**: Extract deliverable "products" from project codebases
**Vision**: **PROJECT → PRODUCT** (clean, deployable consolidation)

---

## 🎯 THE BRILLIANT INSIGHT (From Lech)

> "WE SHOULD MAKE A 'CODEBASE INGESTION PIPELINE' THAT IDENTIFIES WHICH OF THE FILES FROM THE ORIGINAL PROJECT'S FILES SHOULD BE MOVED TO A NEW SPECIAL DIRECTORY THAT WILL BE TREATED AS THE 'PRODUCT' OR 'OUTPUT' OF THE PROJECT, THE DELIVERABLE IN WHICH THE PROJECT FULFILLS ITS PURPOSE... THE NECESSITY OF MOVING THE FILES FROM ONE PLACE TO ANOTHER, WITH CLOSE ATTENTION, WILL ENSURE THAT WE CONSOLIDATE WHAT WE ALREADY HAVE OF TRUE VALUABLE, USEFUL, CODE, AND MAKE THEM INTEGRATE TOGETHER AS A SINGLE PURPOSEFUL SET OF FILES!"

---

## 🔥 THE PROBLEM WE SOLVED

**Before Codebase Ingestion:**
- ❌ Projects = Everything mixed together (code + context + experiments + cruft)
- ❌ Can't tell what's "product" vs "project support"
- ❌ Deployment confusion (what files to deploy?)
- ❌ No forced curation of valuable code
- ❌ Context files contaminate deployable
- ❌ Build folders bloated with unnecessary files

**After Codebase Ingestion:**
- ✅ Clean separation: PROJECT vs PRODUCT
- ✅ Product directory = 100% deployable
- ✅ Only essential files in product
- ✅ Forced conscious curation
- ✅ Context stays in project, not in product
- ✅ Deploy ONLY the product folder

---

## 🏗️ ARCHITECTURE

### The Transformation

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE: Everything Mixed (PROJECT)                          │
├─────────────────────────────────────────────────────────────┤
│  PROJECT_minerals/                                           │
│  ├── src/                    ← Product code (essential)      │
│  ├── public/                 ← Product assets (essential)    │
│  ├── package.json            ← Product config (essential)    │
│  ├── docs/                   ← Context (NOT product)         │
│  ├── experiments/            ← Trials (NOT product)          │
│  ├── scripts/                ← Dev tools (NOT product)       │
│  ├── context_files/          ← Agent context (NOT product)   │
│  ├── node_modules/           ← Reinstall (NOT product)       │
│  └── .next/                  ← Build output (NOT product)    │
│                                                               │
│  Problem: Can't deploy cleanly, everything is mixed!         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AFTER: Clean Separation (PROJECT + PRODUCT)                 │
├─────────────────────────────────────────────────────────────┤
│  PROJECT_minerals/                                           │
│  ├── minerals-app/           ← THE PRODUCT (deployable!)     │
│  │   ├── src/               ← ONLY essential code            │
│  │   ├── public/            ← ONLY needed assets             │
│  │   ├── package.json       ← ONLY production deps           │
│  │   └── Essential configs only                              │
│  ├── docs/                   ← Context (stays in project)    │
│  ├── experiments/            ← Trials (stays in project)     │
│  └── scripts/                ← Dev tools (stays in project)  │
│                                                               │
│  Clean: minerals-app/ is 100% deployable, zero cruft!        │
│  Deploy command: cd minerals-app/ && npm run build           │
└─────────────────────────────────────────────────────────────┘
```

### 4-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: ANALYSIS                                           │
│  → Scan project files                                        │
│  → Classify by type (source, config, context, build)        │
│  → Apply extraction rules                                    │
│  → Determine ESSENTIAL vs EXCLUDED                           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: EXTRACTION                                         │
│  → Create product directory                                  │
│  → Copy essential files only                                 │
│  → Maintain structure                                        │
│  → Skip excluded files                                       │
│  → Track everything in database                              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: VALIDATION                                         │
│  → Verify essential files present                            │
│  → Test build (npm run build)                                │
│  → Check dependencies                                        │
│  → Measure quality                                           │
│  → Calculate metrics                                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: DEPLOYMENT                                         │
│  → Product is ready!                                         │
│  → Deploy product directory                                  │
│  → Track deployment status                                   │
│  → Monitor product health                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 FILE LOCATIONS

```
central-mcp/
├── scripts/
│   └── extract-product.sh                      # CLI extraction tool
├── src/database/migrations/
│   └── 017_codebase_ingestion_pipeline.sql     # Database schema
├── docs/
│   └── CODEBASE_INGESTION_PIPELINE.md          # This file
└── data/
    └── registry.db                             # Central database
```

---

## 🗄️ DATABASE SCHEMA

### 6 Core Tables + 4 Views

**1. products_registry** - Extracted products
```sql
- product_id (PK)                -- e.g. "central-mcp-dashboard", "minerals-app"
- product_name / project_id (FK)
- product_type                   -- webapp, api, cli_tool, library, mobile_app
- source_path / product_path     -- Where it came from / where it went
- description / purpose / target_users
- tech_stack / primary_language / framework
- extraction_status              -- PENDING, IN_PROGRESS, EXTRACTED, FAILED
- build_status / deployment_status
- total_files / essential_files / excluded_files
- total_size_bytes / product_size_bytes
- quality_score / is_deployable
- last_build_attempt / last_build_success
- deployment_url
- created_at / extracted_at
```

**2. product_files** - File classifications
```sql
- file_id (PK)
- product_id (FK)
- file_path / original_path
- file_type                      -- source, config, asset, test, doc
- file_category                  -- ESSENTIAL, OPTIONAL, EXCLUDED
- classification_method          -- pattern, llm, manual
- classification_reason          -- Why included/excluded
- is_included / is_modified
- file_size_bytes / line_count
```

**3. extraction_rules** - Pattern-based classification
```sql
- rule_id (PK)
- rule_name / rule_type          -- include, exclude, transform
- path_pattern / file_pattern / content_pattern
- target_category                -- ESSENTIAL, OPTIONAL, EXCLUDED
- reason / applies_to_types
- priority                       -- Higher = applied first
- example_matches
- is_active
```

**4. extraction_sessions** - Extraction history
```sql
- session_id (PK)
- product_id (FK)
- extraction_type                -- full, incremental, cleanup
- extraction_method              -- manual, automated, llm_assisted
- files_before / files_after
- files_included / files_excluded / files_modified
- status / success / error_message
- build_attempted / build_passed
- duration_seconds
- started_at / completed_at
```

**5. product_dependencies** - What product needs
```sql
- dependency_id (PK)
- product_id (FK)
- dependency_name / dependency_version
- dependency_type                -- npm, pip, system, service
- scope                          -- production, development, optional
- install_command / is_installed
```

**6. product_build_configs** - Build configurations
```sql
- config_id (PK)
- product_id (FK)
- config_type                    -- build, dev, test, deploy
- config_name                    -- production, staging
- build_command / dev_command / test_command / deploy_command
- env_vars / required_tools
- is_tested / is_default
```

**Views:**
- `products_dashboard` - All products with key metrics
- `extraction_stats` - Extraction statistics per product
- `file_categories_summary` - File breakdown by category
- `recent_extractions` - Last 50 extraction sessions

---

## 🚀 USAGE GUIDE

### 1. Show Extraction Rules

```bash
cd /central-mcp
./scripts/extract-product.sh rules

# Shows:
# - INCLUDE rules (what gets copied)
# - EXCLUDE rules (what stays behind)
# - Priorities (higher = applied first)
```

**Pre-configured Rules:**

**INCLUDE (Priority 90):**
- `src/**/*.ts` → Main TypeScript source
- `src/**/*.tsx` → React components
- `src/**/*.js` → JavaScript source
- `src/**/*.py` → Python source
- `public/**/*` → Static assets

**INCLUDE (Priority 80):**
- `package.json` → Dependencies
- `tsconfig.json` → TypeScript config
- `next.config.js` → Next.js config
- `tailwind.config.js` → Tailwind config

**EXCLUDE (Priority 100):**
- `node_modules/**/*` → Reinstall from package.json
- `.next/**/*` → Build output
- `dist/**/*` → Build output
- `build/**/*` → Build output

**EXCLUDE (Priority 70):**
- `docs/**/*` → Documentation
- `context/**/*` → Development context
- `experiments/**/*` → Experimental code
- `scripts/**/*` → Development scripts

### 2. Analyze a Project

```bash
./scripts/extract-product.sh analyze /path/to/PROJECT_minerals

# Shows:
# - Total files
# - File types (TypeScript, JavaScript, Python, etc.)
# - Key files found (package.json, tsconfig.json, etc.)
# - Directories (src/, public/, docs/, etc.)
```

### 3. Preview Extraction (Dry Run)

```bash
./scripts/extract-product.sh preview /path/to/PROJECT_minerals --product-name minerals-app

# Shows:
# - What would be INCLUDED
# - What would be EXCLUDED
# - No files are actually copied
```

### 4. Extract Product (THE MAIN COMMAND!)

```bash
./scripts/extract-product.sh extract /path/to/PROJECT_minerals \
  --product-name minerals-app \
  --product-type webapp

# This:
# 1. Creates PROJECT_minerals/minerals-app/
# 2. Copies ONLY essential files based on rules
# 3. Skips docs/, experiments/, node_modules/, etc.
# 4. Results in 100% deployable product directory

# Result:
# PROJECT_minerals/
# ├── minerals-app/        ← THE PRODUCT (ready to deploy!)
# │   ├── src/
# │   ├── public/
# │   ├── package.json
# │   └── config files
# └── [original files remain in project]
```

### 5. Dry Run (Preview Without Copying)

```bash
./scripts/extract-product.sh extract /path/to/PROJECT_minerals \
  --product-name minerals-app \
  --product-type webapp \
  --dry-run

# Shows what would be copied without actually copying
```

### 6. Validate Extracted Product

```bash
./scripts/extract-product.sh validate minerals-app

# Checks:
# - Essential files present?
# - Dependencies installable? (npm install)
# - Build working? (npm run build)
# - Product deployable?
```

### 7. List All Products

```bash
./scripts/extract-product.sh list

# Shows all extracted products with:
# - Product name and type
# - Extraction status
# - Build status
# - Deployment status
# - Quality score
```

### 8. Show Statistics

```bash
./scripts/extract-product.sh stats

# Shows:
# - Total files vs included files
# - Size reduction percentage
# - Extraction efficiency
```

---

## 📊 EXTRACTION RULES (Pre-configured)

### INCLUDE Rules (What Gets Copied)

**Priority 90 (Highest):**
- TypeScript source: `src/**/*.ts`, `src/**/*.tsx`
- JavaScript source: `src/**/*.js`, `src/**/*.jsx`
- Python source: `src/**/*.py`
- Public assets: `public/**/*`

**Priority 80:**
- package.json (Node.js dependencies)
- tsconfig.json (TypeScript config)
- next.config.js (Next.js config)
- tailwind.config.js (Tailwind CSS config)

**Priority 70:**
- .env.example (Environment template)

**Priority 60 (Optional):**
- README.md (Product documentation)

**Priority 50 (Optional):**
- **/*.test.ts (Unit tests)

### EXCLUDE Rules (What Stays Behind)

**Priority 100 (Absolute Exclusion):**
- `node_modules/**/*` → Reinstall from package.json
- `.next/**/*` → Next.js build output
- `dist/**/*` → General build output
- `build/**/*` → General build output

**Priority 95:**
- `.git/**/*` → Version control (keep root .git)

**Priority 90:**
- `coverage/**/*` → Test coverage reports
- `.vscode/**/*` → VSCode settings
- `.idea/**/*` → IntelliJ settings

**Priority 70:**
- `docs/**/*` → Documentation (not needed in product)
- `context/**/*` → Development context files

**Priority 60:**
- `examples/**/*` → Example code
- `experiments/**/*` → Experimental code
- `scripts/**/*` → Development scripts

---

## 🎯 PRODUCT TYPES

### Type 1: **webapp** 🌐
Web applications (React, Next.js, Vue, etc.)
- **Includes**: src/, public/, package.json, configs
- **Build**: npm run build
- **Deploy**: Vercel, Netlify, custom server

### Type 2: **api** 🔧
Backend APIs (Express, FastAPI, etc.)
- **Includes**: src/, package.json/requirements.txt, configs
- **Build**: npm run build or docker build
- **Deploy**: Railway, Heroku, GCP, AWS

### Type 3: **cli_tool** 💻
Command-line tools
- **Includes**: src/, bin/, package.json, configs
- **Build**: npm run build, create executable
- **Deploy**: npm publish, homebrew, releases

### Type 4: **library** 📚
Reusable libraries (npm/pip packages)
- **Includes**: src/, package.json/setup.py, configs
- **Build**: npm run build, create dist/
- **Deploy**: npm publish, PyPI

### Type 5: **mobile_app** 📱
Mobile applications (React Native, Flutter, etc.)
- **Includes**: src/, assets/, config files
- **Build**: Platform-specific build
- **Deploy**: App Store, Play Store

---

## 🔥 THE POWER OF THIS APPROACH

### 1. Forced Conscious Curation
- **Must decide** what's valuable
- **Can't deploy** everything blindly
- **Quality focus** from the start

### 2. Clean Deployments
- **Deploy ONLY** the product folder
- **No cruft** in production
- **Fast builds** (less to process)

### 3. Clear Separation
- **Project** = everything (context + code + experiments)
- **Product** = deliverable (clean, tested, deployable)
- **No confusion** about what to deploy

### 4. Integration Verification
- Files **must work together** as one set
- Dependencies **must be complete**
- Build **must pass**

### 5. Metrics and Quality
- **Measure** what's essential vs cruft
- **Track** extraction efficiency
- **Improve** over time

---

## 🚧 FUTURE ENHANCEMENTS (Planned)

### Phase 2: LLM-Assisted Classification
```bash
./scripts/extract-product.sh extract /path/to/project \
  --method llm_assisted \
  --product-name app-name

# LLM analyzes:
# - File purposes
# - Code dependencies
# - Optimal structure
# - Suggests improvements
```

### Phase 3: Incremental Extraction
```bash
./scripts/extract-product.sh extract /path/to/project \
  --type incremental \
  --since "2025-10-01"

# Only extracts files changed since date
```

### Phase 4: Automated Optimization
- Detect unused dependencies
- Remove dead code
- Optimize imports
- Bundle analysis
- Performance recommendations

### Phase 5: Multi-Product Projects
- Extract multiple products from one project
- Shared dependencies
- Mono-repo support
- Cross-product coordination

---

## 🎓 BEST PRACTICES

### For Extraction:
1. **Analyze first** - Run analyze before extract
2. **Preview** - Use preview/dry-run to see what happens
3. **Validate** - Always validate after extraction
4. **Test build** - Ensure product builds successfully
5. **Track changes** - Document what was included/excluded
6. **Iterate** - Extraction can be refined

### For Product Organization:
1. **Keep it clean** - Only essential files
2. **No context docs** - Those stay in project
3. **No experiments** - Only production code
4. **Complete dependencies** - package.json must be complete
5. **Self-contained** - Product should build standalone

### For Deployment:
1. **Deploy product only** - Never deploy project root
2. **Use product path** - cd product/ && npm run build
3. **Environment configs** - Use .env for environments
4. **Test locally** - Verify product works before deploy
5. **Monitor quality** - Track build success rate

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Issue**: "Extraction includes too many files"
**Solution**: Add more EXCLUDE rules or increase their priority

**Issue**: "Build fails in extracted product"
**Solution**: Check if all dependencies are in package.json, verify configs copied

**Issue**: "Product missing essential files"
**Solution**: Review INCLUDE rules, may need to add specific patterns

**Issue**: "Size reduction not significant"
**Solution**: Review EXCLUDE rules, ensure node_modules/ etc. excluded

---

## 🔗 RELATED DOCUMENTATION

- **Projects Registry**: `/docs/PROJECTS_REGISTRY_SYSTEM.md`
- **Code Snippets**: `/docs/CODE_SNIPPETS_LIBRARY.md`
- **Knowledge Injection**: `/docs/KNOWLEDGE_INJECTION_SYSTEM.md`
- **Database Schema**: `/src/database/migrations/017_codebase_ingestion_pipeline.sql`

---

## 🎉 CONCLUSION

**The Codebase Ingestion Pipeline provides FORCED CURATION and CLEAN SEPARATION of project vs product!**

**What We Built:**
- ✅ Complete database schema (6 tables, 4 views)
- ✅ CLI extraction tool (`extract-product.sh`)
- ✅ 20+ pre-configured extraction rules
- ✅ Analysis, preview, and validation commands
- ✅ Dry-run support for safe testing
- ✅ Complete tracking and metrics
- ✅ Comprehensive documentation

**Impact:**
- 🎯 **PROJECT → PRODUCT** transformation
- 🚀 Clean, deployable product directories
- 📊 Forced conscious curation of valuable code
- 🛡️ Only essential files in product
- 💾 Context stays in project, not in product
- 📋 Complete extraction history
- 🤖 Foundation for automated extraction
- 💰 Deploy only what's needed

**The Workflow:**
```
1. Analyze project → See what's there
2. Preview extraction → See what would be included
3. Extract product → Create clean product directory
4. Validate product → Verify it builds
5. Deploy product → Ship ONLY the product!
```

**Lech's Vision Realized:**
> "CONSOLIDATE WHAT WE ALREADY HAVE OF TRUE VALUABLE, USEFUL, CODE, AND MAKE THEM INTEGRATE TOGETHER AS A SINGLE PURPOSEFUL SET OF FILES!"

**✅ ACHIEVED!**

---

**Built by**: Agent B (Sonnet-4.5)
**Date**: 2025-10-12
**Status**: ✅ PRODUCTION READY

**This is the product extraction system Central-MCP needed!** 📦🚀

**From messy projects to clean products: The transformation is complete!**
