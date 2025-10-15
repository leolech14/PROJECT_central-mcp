# Knowledge Space API Documentation

## Overview

The Knowledge Space API provides automatic category generation from directory structure for the Central-MCP system. Every folder in the knowledge space becomes a category in the frontend interface with automatic metadata extraction.

## Base URL

```
http://localhost:8080/api/knowledge/space
```

## Endpoints

### GET /api/knowledge/space

Returns the complete knowledge space with all categories and knowledge packs.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `categories` | string | - | Comma-separated list of category IDs to filter by |
| `search` | string | - | Search term to filter knowledge packs by name or description |
| `fileTypes` | string | - | Comma-separated list of file extensions to filter by |
| `sortBy` | string | `lastModified` | Sort order: `name`, `lastModified`, `size` |
| `sortOrder` | string | `desc` | Sort direction: `asc`, `desc` |
| `offset` | integer | - | Pagination offset |
| `limit` | integer | - | Number of items to return |
| `featuredOnly` | boolean | `false` | Return only featured knowledge packs |

#### Response Structure

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "voice-systems",
        "name": "Voice Systems",
        "description": "Real-time voice conversation systems...",
        "readmeContent": "Full README content...",
        "knowledgePacks": [
          {
            "name": "ULTRATHINK_REALTIME_VOICE_MASTERY_v1.2.0.zip",
            "type": "file",
            "size": 187622,
            "lastModified": "2025-10-12T19:37:02.000Z",
            "description": "Compressed knowledge pack",
            "extension": ".zip",
            "path": "voice-systems/ULTRATHINK_REALTIME_VOICE_MASTERY_v1.2.0.zip",
            "featured": true,
            "version": "1.2.0"
          }
        ],
        "fileCount": 4,
        "totalSize": 287950,
        "lastModified": "2025-10-12T19:37:02.000Z",
        "icon": "🎤",
        "tags": ["webrtc", "realtime", "voice", "api"]
      }
    ],
    "totalCategories": 6,
    "totalKnowledgePacks": 9,
    "totalSize": 308023,
    "lastUpdated": "2025-10-13T22:59:52.813Z",
    "systemInfo": {
      "version": "1.0.0",
      "apiVersion": "v1",
      "uptime": 123.456
    },
    "query": {
      "search": null,
      "sortBy": "lastModified",
      "sortOrder": "desc"
    }
  }
}
```

## Usage Examples

### Basic Request

```bash
curl http://localhost:8080/api/knowledge/space
```

### Search Knowledge Packs

```bash
curl "http://localhost:8080/api/knowledge/space?search=voice"
```

### Filter by Category

```bash
curl "http://localhost:8080/api/knowledge/space?categories=voice-systems,ai-integration"
```

### Get Featured Items Only

```bash
curl "http://localhost:8080/api/knowledge/space?featuredOnly=true"
```

### Filter by File Type

```bash
curl "http://localhost:8080/api/knowledge/space?fileTypes=.zip,.pdf"
```

### Sort by Name

```bash
curl "http://localhost:8080/api/knowledge/space?sortBy=name&sortOrder=asc"
```

### Pagination

```bash
curl "http://localhost:8080/api/knowledge/space?offset=0&limit=3"
```

## Frontend Integration

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const KnowledgeSpace = () => {
  const [knowledgeSpace, setKnowledgeSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchKnowledgeSpace();
  }, [search]);

  const fetchKnowledgeSpace = async () => {
    try {
      setLoading(true);
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/knowledge/space${query}`);
      const result = await response.json();

      if (result.success) {
        setKnowledgeSpace(result.data);
      }
    } catch (error) {
      console.error('Error fetching knowledge space:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!knowledgeSpace) return <div>Error loading knowledge space</div>;

  return (
    <div className="knowledge-space">
      <h1>Knowledge Space</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search knowledge packs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="stats">
        <span>{knowledgeSpace.totalCategories} categories</span>
        <span>{knowledgeSpace.totalKnowledgePacks} knowledge packs</span>
        <span>{Math.round(knowledgeSpace.totalSize / 1024)} KB total</span>
      </div>

      <div className="categories">
        {knowledgeSpace.categories.map(category => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
};

const CategoryCard = ({ category }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="category-card">
      <div className="category-header" onClick={() => setExpanded(!expanded)}>
        <h2>
          <span className="icon">{category.icon}</span>
          {category.name}
        </h2>
        <div className="category-meta">
          <span>{category.knowledgePacks.length} packs</span>
          <span>{Math.round(category.totalSize / 1024)} KB</span>
        </div>
      </div>

      <p className="category-description">{category.description}</p>

      {category.tags.length > 0 && (
        <div className="category-tags">
          {category.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      {expanded && (
        <div className="knowledge-packs">
          {category.knowledgePacks.map(pack => (
            <KnowledgePackItem key={pack.path} pack={pack} />
          ))}
        </div>
      )}
    </div>
  );
};

const KnowledgePackItem = ({ pack }) => {
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  return (
    <div className={`knowledge-pack-item ${pack.featured ? 'featured' : ''}`}>
      <div className="pack-info">
        <span className="pack-icon">{pack.featured ? '⭐' : '📄'}</span>
        <span className="pack-name">{pack.name}</span>
        <span className="pack-size">{formatSize(pack.size)}</span>
      </div>

      <p className="pack-description">{pack.description}</p>

      <div className="pack-meta">
        <span>Modified: {new Date(pack.lastModified).toLocaleDateString()}</span>
        {pack.version && <span>Version: {pack.version}</span>}
      </div>

      <button className="download-btn">
        Download
      </button>
    </div>
  );
};

export default KnowledgeSpace;
```

### CSS Styling

```css
.knowledge-space {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-bar {
  margin-bottom: 20px;
}

.search-bar input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  font-weight: bold;
}

.category-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: #fff;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.category-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-meta {
  display: flex;
  gap: 15px;
  color: #666;
}

.category-description {
  margin: 10px 0;
  color: #333;
}

.category-tags {
  display: flex;
  gap: 8px;
  margin: 10px 0;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.knowledge-packs {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.knowledge-pack-item {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 10px;
}

.knowledge-pack-item.featured {
  border-color: #ffd700;
  background: #fffef7;
}

.pack-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.pack-name {
  font-weight: bold;
  flex: 1;
}

.pack-size {
  color: #666;
  font-size: 14px;
}

.pack-description {
  margin: 8px 0;
  color: #555;
  font-size: 14px;
}

.pack-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #888;
  margin-bottom: 10px;
}

.download-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.download-btn:hover {
  background: #1565c0;
}
```

## Configuration

The Knowledge Space API can be configured through the following options:

```javascript
const KNOWLEDGE_SPACE_CONFIG = {
  rootPath: './03_CONTEXT_FILES/SPECIALIZED_KNOWLEDGE_PACKS',
  enableCache: true,
  cacheDuration: 300, // 5 minutes
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedExtensions: ['.zip', '.md', '.txt', '.json', '.pdf', '.js', '.ts', '.html'],
  generateDownloadUrls: true,
  downloadBaseUrl: '/api/knowledge/download',
  trackStats: true
};
```

## Performance Features

### Caching
- Response caching with configurable duration
- Automatic cache invalidation
- Memory-efficient storage

### Filtering & Search
- Real-time search across knowledge packs
- Category-based filtering
- File type filtering
- Featured items filtering

### Pagination
- Efficient pagination for large knowledge spaces
- Configurable page sizes
- Performance optimization

## Error Handling

The API returns structured error responses:

```json
{
  "success": false,
  "error": "Failed to retrieve knowledge space data",
  "details": "Directory not found"
}
```

Common error scenarios:
- Knowledge space directory not found
- Permission denied accessing files
- Invalid query parameters
- Internal server errors

## Monitoring

The API includes built-in monitoring capabilities:

- Request timing and performance metrics
- Cache hit/miss statistics
- Error tracking and logging
- System uptime information

## Security Considerations

- File path validation to prevent directory traversal
- File size limits to prevent abuse
- Extension filtering for security
- Rate limiting capabilities (can be implemented)

---

**API Version**: 1.0.0
**Last Updated**: 2025-10-13
**Maintained by**: Central-MCP Development Team