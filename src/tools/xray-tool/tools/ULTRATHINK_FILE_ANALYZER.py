#!/usr/bin/env python3
"""
╔════════════════════════════════════════════════════════════════════════════════════╗
║                      🕒 ULTRATHINK TIME-TRAVELING X-RAY VISION                    ║
║                         Advanced File Analysis System with LLM Integration         ║
╚════════════════════════════════════════════════════════════════════════════════════╝

Author: Claude Code + Central-MCP Integration
Version: 1.0.0
Purpose: Generate structured analysis of last 999 file modifications with AI context
Integration: Ollama + OpenAI 20B model for local processing
"""

import os
import json
import time
import hashlib
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import sqlite3
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse

@dataclass
class FileMetadata:
    """Complete file metadata structure"""
    name: str
    filepath: str
    absolute_path: str
    size_bytes: int
    size_human: str

    # Timestamps
    created_at: Optional[str] = None
    modified_at: Optional[str] = None
    accessed_at: Optional[str] = None
    changed_at: Optional[str] = None

    # File type info
    extension: str = ""
    mime_type: str = ""
    is_binary: bool = False

    # Content analysis
    content_hash: str = ""
    line_count: int = 0
    language: str = ""

    # AI-generated context
    ai_context: str = ""
    ai_tokens_used: int = 0
    ai_processing_time: float = 0.0

    # System metadata
    permissions: str = ""
    owner: str = ""
    group: str = ""

class UltraThinkFileAnalyzer:
    """Advanced file analysis system with LLM integration"""

    def __init__(self, config_path: str = None):
        # Handle both config_path and config_dict for flexibility
        if isinstance(config_path, dict):
            self.config = self._load_config(None)
            self.config.update(config_path)
        else:
            self.config = self._load_config(config_path)
        self.cache_db = self.config.get('cache_db', 'file_analysis_cache.db')
        self.ollama_base_url = self.config.get('ollama_url', 'http://localhost:11434')
        self.ollama_model = self.config.get('ollama_model', 'llama3.1:8b')  # Using Llama 3.1 8B as it's more capable
        self.max_tokens = 300
        self.max_files = 999

        # Initialize cache database
        self._init_cache_db()

        # Performance metrics
        self.start_time = time.time()
        self.files_processed = 0
        self.cache_hits = 0
        self.llm_calls = 0

    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from file or use defaults"""
        default_config = {
            'cache_db': 'file_analysis_cache.db',
            'ollama_url': 'http://localhost:11434',
            'ollama_model': 'llama3.1:8b',
            'max_tokens': 300,
            'max_files': 999,
            'parallel_processing': True,
            'max_workers': 4,
            'exclude_patterns': [
                '*.pyc', '*.pyo', '__pycache__', '.git', '.DS_Store',
                'node_modules', '.vscode', '.idea', '*.log', '*.tmp'
            ]
        }

        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                user_config = json.load(f)
                default_config.update(user_config)

        return default_config

    def _init_cache_db(self):
        """Initialize SQLite cache database"""
        conn = sqlite3.connect(self.cache_db)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS file_analysis_cache (
                filepath TEXT PRIMARY KEY,
                mtime REAL,
                content_hash TEXT,
                metadata_json TEXT,
                ai_context TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_filepath ON file_analysis_cache(filepath)
        ''')

        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_mtime ON file_analysis_cache(mtime)
        ''')

        conn.commit()
        conn.close()

    def _get_file_metadata(self, filepath: Path) -> Optional[FileMetadata]:
        """Extract comprehensive file metadata"""
        try:
            stat = filepath.stat()

            # Basic metadata
            name = filepath.name
            absolute_path = str(filepath.resolve())
            size_bytes = stat.st_size
            size_human = self._format_size(size_bytes)
            extension = filepath.suffix.lower()

            # Timestamps
            created_at = datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat()
            modified_at = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
            accessed_at = datetime.fromtimestamp(stat.st_atime, tz=timezone.utc).isoformat()

            # Unix systems have st_birthtime for creation time
            if hasattr(stat, 'st_birthtime'):
                created_at = datetime.fromtimestamp(stat.st_birthtime, tz=timezone.utc).isoformat()

            # File type detection
            mime_type = self._get_mime_type(filepath)
            is_binary = self._is_binary_file(filepath)

            # Content analysis
            content_hash = self._calculate_content_hash(filepath)
            line_count = self._count_lines(filepath) if not is_binary else 0
            language = self._detect_language(filepath)

            # System metadata (Unix-specific)
            permissions = oct(stat.st_mode)[-3:]
            owner = str(stat.st_uid)  # Could be expanded to get actual username
            group = str(stat.st_gid)

            return FileMetadata(
                name=name,
                filepath=str(filepath),
                absolute_path=absolute_path,
                size_bytes=size_bytes,
                size_human=size_human,
                created_at=created_at,
                modified_at=modified_at,
                accessed_at=accessed_at,
                extension=extension,
                mime_type=mime_type,
                is_binary=is_binary,
                content_hash=content_hash,
                line_count=line_count,
                language=language,
                permissions=permissions,
                owner=owner,
                group=group
            )

        except (OSError, PermissionError) as e:
            print(f"Error accessing {filepath}: {e}")
            return None

    def _format_size(self, size_bytes: int) -> str:
        """Format file size in human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f}{unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f}PB"

    def _get_mime_type(self, filepath: Path) -> str:
        """Get MIME type of file"""
        try:
            import mimetypes
            mime_type, _ = mimetypes.guess_type(str(filepath))
            return mime_type or "application/octet-stream"
        except:
            return "unknown"

    def _is_binary_file(self, filepath: Path) -> bool:
        """Check if file is binary"""
        try:
            with open(filepath, 'rb') as f:
                chunk = f.read(1024)
                return b'\0' in chunk
        except:
            return True

    def _calculate_content_hash(self, filepath: Path) -> str:
        """Calculate SHA256 hash of file content"""
        try:
            hash_sha256 = hashlib.sha256()
            with open(filepath, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            return hash_sha256.hexdigest()[:16]  # Shortened for storage
        except:
            return ""

    def _count_lines(self, filepath: Path) -> int:
        """Count lines in text file"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                return sum(1 for _ in f)
        except:
            return 0

    def _detect_language(self, filepath: Path) -> str:
        """Detect programming language from file extension"""
        extension_map = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.tsx': 'React/TypeScript',
            '.jsx': 'React/JavaScript',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.scala': 'Scala',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.sass': 'SASS',
            '.less': 'LESS',
            '.json': 'JSON',
            '.xml': 'XML',
            '.yaml': 'YAML',
            '.yml': 'YAML',
            '.toml': 'TOML',
            '.md': 'Markdown',
            '.sql': 'SQL',
            '.sh': 'Shell',
            '.bash': 'Bash',
            '.zsh': 'Zsh',
            '.ps1': 'PowerShell',
            '.dockerfile': 'Docker',
            '.vue': 'Vue',
            '.svelte': 'Svelte',
            '.r': 'R',
            '.m': 'MATLAB/Octave',
            '.pl': 'Perl',
            '.lua': 'Lua',
            '.dart': 'Dart',
            '.elm': 'Elm',
            '.hs': 'Haskell',
            '.ml': 'OCaml',
            '.fs': 'F#',
            '.ex': 'Elixir',
            '.exs': 'Elixir',
            '.erl': 'Erlang',
            '.vim': 'VimScript',
            '.tf': 'Terraform',
            '.hcl': 'HCL',
        }

        return extension_map.get(filepath.suffix.lower(), 'Unknown')

    def _get_cached_analysis(self, filepath: str, mtime: float) -> Optional[Dict]:
        """Get cached analysis if valid"""
        try:
            conn = sqlite3.connect(self.cache_db)
            cursor = conn.cursor()

            cursor.execute('''
                SELECT metadata_json, ai_context FROM file_analysis_cache
                WHERE filepath = ? AND mtime = ?
            ''', (filepath, mtime))

            result = cursor.fetchone()
            conn.close()

            if result:
                self.cache_hits += 1
                metadata_json, ai_context = result
                metadata = json.loads(metadata_json)
                metadata['ai_context'] = ai_context or ""
                return metadata

        except Exception as e:
            print(f"Cache retrieval error: {e}")

        return None

    def _cache_analysis(self, metadata: FileMetadata):
        """Cache analysis result"""
        try:
            conn = sqlite3.connect(self.cache_db)
            cursor = conn.cursor()

            mtime = os.path.getmtime(metadata.filepath)
            metadata_json = json.dumps(asdict(metadata), default=str)

            cursor.execute('''
                INSERT OR REPLACE INTO file_analysis_cache
                (filepath, mtime, content_hash, metadata_json, ai_context)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                metadata.filepath,
                mtime,
                metadata.content_hash,
                metadata_json,
                metadata.ai_context
            ))

            conn.commit()
            conn.close()

        except Exception as e:
            print(f"Cache storage error: {e}")

    def _generate_ai_context(self, metadata: FileMetadata) -> str:
        """Generate AI context using local Ollama model"""
        if metadata.is_binary or metadata.size_bytes > 100000:  # 100KB limit
            return f"[Binary file: {metadata.mime_type}, Size: {metadata.size_human}]"

        try:
            # Read file content (limit to first 2000 chars for context)
            content = ""
            try:
                with open(metadata.filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read(2000)
                    if len(content) == 2000:
                        content += "...[truncated]"
            except:
                content = "[Unable to read file content]"

            # Create prompt for Ollama
            prompt = f"""
Analyze this file and provide a concise 300-token summary:

File: {metadata.name}
Path: {metadata.filepath}
Type: {metadata.language} ({metadata.mime_type})
Size: {metadata.size_human} ({metadata.line_count} lines)

Content:
{content}

Provide analysis covering:
1. Primary purpose and functionality
2. Key components or patterns
3. Dependencies and integrations
4. Code quality indicators
5. Security considerations
6. Performance implications

Keep response technical and precise, around 300 tokens.
"""

            # Call Ollama API
            start_time = time.time()
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.9,
                        "max_tokens": self.max_tokens
                    }
                },
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                ai_context = result.get('response', 'No analysis available')

                metadata.ai_processing_time = time.time() - start_time
                metadata.ai_tokens_used = len(ai_context.split())
                self.llm_calls += 1

                return ai_context
            else:
                return f"[LLM Analysis Failed: HTTP {response.status_code}]"

        except Exception as e:
            return f"[LLM Analysis Error: {str(e)}]"

    def _should_exclude_file(self, filepath: Path) -> bool:
        """Check if file should be excluded from analysis"""
        path_str = str(filepath)

        for pattern in self.config.get('exclude_patterns', []):
            if pattern.startswith('*'):
                if filepath.match(pattern):
                    return True
            elif pattern in path_str:
                return True

        return False

    def find_recent_files(self, directory: str = ".", max_files: int = None) -> List[Path]:
        """Find most recently modified files"""
        if max_files is None:
            max_files = self.max_files

        files = []
        base_path = Path(directory).resolve()

        print(f"🔍 Scanning directory: {base_path}")

        # Use find command for better performance on large directories
        try:
            cmd = ['find', str(base_path), '-type', 'f', '-not', '-path', '*/.*']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

            if result.returncode == 0:
                file_paths = [Path(line.strip()) for line in result.stdout.split('\n') if line.strip()]
            else:
                # Fallback to os.walk
                file_paths = []
                for root, dirs, filenames in os.walk(base_path):
                    # Skip hidden directories
                    dirs[:] = [d for d in dirs if not d.startswith('.')]

                    for filename in filenames:
                        file_paths.append(Path(root) / filename)

        except Exception as e:
            print(f"Find command failed, using os.walk: {e}")
            file_paths = []
            for root, dirs, filenames in os.walk(base_path):
                dirs[:] = [d for d in dirs if not d.startswith('.')]
                for filename in filenames:
                    file_paths.append(Path(root) / filename)

        # Filter files and sort by modification time
        valid_files = []
        for filepath in file_paths:
            if not self._should_exclude_file(filepath):
                try:
                    mtime = filepath.stat().st_mtime
                    valid_files.append((mtime, filepath))
                except (OSError, PermissionError):
                    continue

        # Sort by modification time (newest first) and take top files
        valid_files.sort(key=lambda x: x[0], reverse=True)
        return [filepath for _, filepath in valid_files[:max_files]]

    def analyze_file(self, filepath: Path) -> Optional[FileMetadata]:
        """Analyze a single file with caching"""
        try:
            mtime = filepath.stat().st_mtime

            # Check cache first
            cached = self._get_cached_analysis(str(filepath), mtime)
            if cached:
                return FileMetadata(**cached)

            # Get metadata
            metadata = self._get_file_metadata(filepath)
            if not metadata:
                return None

            # Generate AI context
            print(f"🧠 Analyzing: {metadata.name}")
            metadata.ai_context = self._generate_ai_context(metadata)

            # Cache result
            self._cache_analysis(metadata)
            self.files_processed += 1

            return metadata

        except Exception as e:
            print(f"Error analyzing {filepath}: {e}")
            return None

    def analyze_directory(self, directory: str = ".", output_file: str = None) -> List[FileMetadata]:
        """Analyze directory and generate comprehensive report"""
        print(f"🚀 Starting ULTRATHINK File Analysis...")
        print(f"📊 Target: {directory}")
        print(f"🔢 Max files: {self.max_files}")
        print(f"🤖 LLM Model: {self.ollama_model}")
        print(f"💾 Cache: {self.cache_db}")
        print("-" * 80)

        # Find recent files
        files = self.find_recent_files(directory)
        print(f"📁 Found {len(files)} recent files")

        if not files:
            print("❌ No files found to analyze")
            return []

        # Analyze files
        results = []

        if self.config.get('parallel_processing', True):
            # Parallel processing
            max_workers = self.config.get('max_workers', 4)
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_file = {executor.submit(self.analyze_file, filepath): filepath
                                for filepath in files}

                for future in as_completed(future_to_file):
                    filepath = future_to_file[future]
                    try:
                        metadata = future.result()
                        if metadata:
                            results.append(metadata)
                    except Exception as e:
                        print(f"Error processing {filepath}: {e}")
        else:
            # Sequential processing
            for filepath in files:
                metadata = self.analyze_file(filepath)
                if metadata:
                    results.append(metadata)

        # Sort results by modification time
        results.sort(key=lambda x: x.modified_at, reverse=True)

        # Generate report
        if output_file:
            self._generate_report(results, output_file)

        # Print summary
        self._print_summary(results)

        return results

    def _generate_report(self, results: List[FileMetadata], output_file: str):
        """Generate comprehensive JSON report"""
        report = {
            'metadata': {
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'total_files_analyzed': len(results),
                'processing_time_seconds': time.time() - self.start_time,
                'files_processed': self.files_processed,
                'cache_hits': self.cache_hits,
                'llm_calls': self.llm_calls,
                'cache_hit_rate': f"{(self.cache_hits / len(results) * 100):.1f}%" if results else "0%",
                'ollama_model': self.ollama_model,
                'max_tokens': self.max_tokens,
                'directory_analyzed': os.getcwd()
            },
            'files': [asdict(result) for result in results]
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"📄 Report saved: {output_file}")

    def _print_summary(self, results: List[FileMetadata]):
        """Print analysis summary"""
        total_time = time.time() - self.start_time

        print("\n" + "=" * 80)
        print("📊 ULTRATHINK ANALYSIS COMPLETE")
        print("=" * 80)
        print(f"📁 Files analyzed: {len(results)}")
        print(f"⏱️  Total time: {total_time:.2f} seconds")
        print(f"🚀 Processing rate: {len(results)/total_time:.1f} files/second")
        print(f"💾 Cache hits: {self.cache_hits} ({(self.cache_hits/len(results)*100):.1f}%)" if results else "💾 Cache hits: 0")
        print(f"🤖 LLM calls: {self.llm_calls}")

        # File type distribution
        languages = {}
        total_size = sum(r.size_bytes for r in results)

        for result in results:
            lang = result.language
            languages[lang] = languages.get(lang, 0) + 1

        print(f"\n📈 Language Distribution:")
        for lang, count in sorted(languages.items(), key=lambda x: x[1], reverse=True)[:10]:
            percentage = (count / len(results)) * 100
            print(f"   {lang}: {count} files ({percentage:.1f}%)")

        print(f"\n💾 Total size: {self._format_size(total_size)}")

        # Most recent files
        print(f"\n🕒 Most Recent Files:")
        for result in results[:5]:
            print(f"   {result.modified_at[:19]} | {result.name} ({result.size_human})")

        print("=" * 80)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='ULTRATHINK File Analyzer - Time-traveling X-ray vision for your files')
    parser.add_argument('directory', nargs='?', default='.', help='Directory to analyze (default: current)')
    parser.add_argument('-o', '--output', help='Output JSON file (default: ultrathink_analysis_TIMESTAMP.json)')
    parser.add_argument('-c', '--config', help='Configuration file path')
    parser.add_argument('-n', '--max-files', type=int, default=999, help='Maximum files to analyze (default: 999)')
    parser.add_argument('--ollama-url', default='http://localhost:11434', help='Ollama API URL')
    parser.add_argument('--ollama-model', default='llama3.1:8b', help='Ollama model to use')
    parser.add_argument('--no-cache', action='store_true', help='Disable caching')
    parser.add_argument('--no-parallel', action='store_true', help='Disable parallel processing')

    args = parser.parse_args()

    # Create configuration
    config = {}
    if args.config:
        with open(args.config, 'r') as f:
            config = json.load(f)

    if args.ollama_url:
        config['ollama_url'] = args.ollama_url
    if args.ollama_model:
        config['ollama_model'] = args.ollama_model
    if args.max_files:
        config['max_files'] = args.max_files
    if args.no_cache:
        config['cache_db'] = None
    if args.no_parallel:
        config['parallel_processing'] = False

    # Initialize analyzer
    analyzer = UltraThinkFileAnalyzer(config)

    # Generate output filename if not provided
    if not args.output:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        args.output = f"ultrathink_analysis_{timestamp}.json"

    # Run analysis
    try:
        results = analyzer.analyze_directory(args.directory, args.output)
        print(f"\n✨ Analysis complete! {len(results)} files analyzed.")
        print(f"📄 Report saved to: {args.output}")

    except KeyboardInterrupt:
        print("\n⚠️  Analysis interrupted by user")
    except Exception as e:
        print(f"\n❌ Error during analysis: {e}")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())