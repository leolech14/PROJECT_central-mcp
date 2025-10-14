/**
 * Knowledge Space API Client
 * =========================
 *
 * A simple client library for interacting with the Knowledge Space API.
 * Supports both browser and Node.js environments.
 */

/**
 * Knowledge Space API Client
 */
class KnowledgeSpaceClient {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get the complete knowledge space
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Knowledge space data
   */
  async getKnowledgeSpace(options = {}) {
    const cacheKey = `knowledge-space-${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const queryString = this.buildQueryString(options);
    const url = `${this.baseUrl}/api/knowledge/space${queryString}`;

    try {
      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch knowledge space');
      }

      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      });

      return result.data;
    } catch (error) {
      throw new Error(`Knowledge Space API error: ${error.message}`);
    }
  }

  /**
   * Search knowledge packs
   * @param {string} query - Search term
   * @param {Object} options - Additional search options
   * @returns {Promise<Object>} Search results
   */
  async searchKnowledgePacks(query, options = {}) {
    return this.getKnowledgeSpace({
      search: query,
      ...options
    });
  }

  /**
   * Get knowledge packs by category
   * @param {string|Array} categoryIds - Category ID(s)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Category data
   */
  async getKnowledgePacksByCategory(categoryIds, options = {}) {
    const categories = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    return this.getKnowledgeSpace({
      categories: categories.join(','),
      ...options
    });
  }

  /**
   * Get featured knowledge packs
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Featured knowledge packs
   */
  async getFeaturedKnowledgePacks(options = {}) {
    return this.getKnowledgeSpace({
      featuredOnly: true,
      ...options
    });
  }

  /**
   * Get knowledge packs by file type
   * @param {string|Array} fileTypes - File extension(s)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Knowledge packs by file type
   */
  async getKnowledgePacksByFileType(fileTypes, options = {}) {
    const types = Array.isArray(fileTypes) ? fileTypes : [fileTypes];
    return this.getKnowledgeSpace({
      fileTypes: types.join(','),
      ...options
    });
  }

  /**
   * Get knowledge space statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const knowledgeSpace = await this.getKnowledgeSpace();

    const stats = {
      totalCategories: knowledgeSpace.totalCategories,
      totalKnowledgePacks: knowledgeSpace.totalKnowledgePacks,
      totalSize: knowledgeSpace.totalSize,
      categories: knowledgeSpace.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        packCount: cat.knowledgePacks.length,
        totalSize: cat.totalSize,
        featuredCount: cat.knowledgePacks.filter(p => p.featured).length
      })),
      fileTypeDistribution: this.getFileTypeDistribution(knowledgeSpace.categories),
      lastUpdated: knowledgeSpace.lastUpdated
    };

    return stats;
  }

  /**
   * Get popular categories (by pack count)
   * @param {number} limit - Number of categories to return
   * @returns {Promise<Array>} Popular categories
   */
  async getPopularCategories(limit = 5) {
    const knowledgeSpace = await this.getKnowledgeSpace();

    return knowledgeSpace.categories
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        packCount: cat.knowledgePacks.length,
        description: cat.description
      }))
      .sort((a, b) => b.packCount - a.packCount)
      .slice(0, limit);
  }

  /**
   * Get recently updated knowledge packs
   * @param {number} limit - Number of packs to return
   * @returns {Promise<Array>} Recently updated packs
   */
  async getRecentlyUpdated(limit = 10) {
    const knowledgeSpace = await this.getKnowledgeSpace();

    const allPacks = knowledgeSpace.categories.flatMap(cat =>
      cat.knowledgePacks.map(pack => ({
        ...pack,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryId: cat.id
      }))
    );

    return allPacks
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      .slice(0, limit);
  }

  /**
   * Build query string from options
   * @param {Object} options - Query options
   * @returns {string} Query string
   */
  buildQueryString(options) {
    const params = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Get file type distribution
   * @param {Array} categories - Knowledge space categories
   * @returns {Array} File type distribution
   */
  getFileTypeDistribution(categories) {
    const distribution = {};

    categories.forEach(category => {
      category.knowledgePacks.forEach(pack => {
        const ext = pack.extension || 'unknown';
        if (!distribution[ext]) {
          distribution[ext] = { count: 0, totalSize: 0 };
        }
        distribution[ext].count++;
        distribution[ext].totalSize += pack.size;
      });
    });

    return Object.entries(distribution).map(([extension, data]) => ({
      extension,
      count: data.count,
      totalSize: data.totalSize
    }));
  }

  /**
   * Clear client cache
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * React Hook for Knowledge Space
 */
export function useKnowledgeSpace(options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const client = useMemo(() => new KnowledgeSpaceClient(), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await client.getKnowledgeSpace(options);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(options)]);

  return { data, loading, error, refetch: () => fetchData() };
}

/**
 * Vue Composable for Knowledge Space
 */
export function useKnowledgeSpaceVue(options = {}) {
  const { ref, computed } = Vue;

  const data = ref(null);
  const loading = ref(true);
  const error = ref(null);

  const client = new KnowledgeSpaceClient();

  const fetchData = async () => {
    try {
      loading.value = true;
      error.value = null;
      const result = await client.getKnowledgeSpace(options);
      data.value = result;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  Vue.watch(() => options, fetchData, { deep: true, immediate: true });

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    client
  };
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = { KnowledgeSpaceClient, useKnowledgeSpace, useKnowledgeSpaceVue };
} else if (typeof window !== 'undefined') {
  // Browser
  window.KnowledgeSpaceClient = KnowledgeSpaceClient;
  window.useKnowledgeSpace = useKnowledgeSpace;
  window.useKnowledgeSpaceVue = useKnowledgeSpaceVue;
}