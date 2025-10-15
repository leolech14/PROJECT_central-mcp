/**
 * 999-X-Ray-Tool: Check Ollama Status
 * =====================================
 *
 * MCP Tool for checking Ollama connectivity and available models
 */

import type {
  CheckOllamaStatusArgs,
  XRayToolResponse,
  OllamaStatusResponse,
  OllamaModel
} from '../types/ultrathink.js';

export const checkOllamaStatusTool = {
  name: "check_ollama_status",
  description: "Check if Ollama is running and what models are available",
  inputSchema: {
    type: "object",
    properties: {
      ollama_url: {
        type: "string",
        description: "Ollama API URL (default: http://localhost:11434)",
        default: "http://localhost:11434"
      }
    }
  }
};

export async function handleCheckOllamaStatus(
  args: CheckOllamaStatusArgs
): Promise<XRayToolResponse> {
  const ollamaUrl = args.ollama_url || 'http://localhost:11434';

  try {
    // Check if Ollama is running
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json() as any;
      const models: OllamaModel[] = data.models || [];

      const statusResponse: OllamaStatusResponse = {
        connected: true,
        models: models.map(model => ({
          name: model.name,
          size: model.size || 0,
          digest: model.digest || '',
          modified_at: model.modified_at || ''
        }))
      };

      const report = generateStatusReport(ollamaUrl, statusResponse);

      return {
        success: true,
        message: `999-X-Ray-Tool: Ollama is connected and ready`,
        data: {
          status: statusResponse,
          report,
          ollama_url: ollamaUrl,
          recommended_models: getRecommendedModels(models)
        }
      };

    } else {
      // Ollama responded but with an error
      const statusResponse: OllamaStatusResponse = {
        connected: false,
        models: [],
        error: `HTTP ${response.status}: ${response.statusText}`
      };

      const report = generateErrorReport(ollamaUrl, statusResponse);

      return {
        success: false,
        message: `999-X-Ray-Tool: Ollama connection failed`,
        data: {
          status: statusResponse,
          report,
          ollama_url: ollamaUrl,
          troubleshooting: getTroubleshootingTips()
        },
        error: statusResponse.error || 'Unknown error'
      };
    }

  } catch (error) {
    // Network or connection error
    const statusResponse: OllamaStatusResponse = {
      connected: false,
      models: [],
      error: error instanceof Error ? error.message : String(error)
    };

    const report = generateErrorReport(ollamaUrl, statusResponse);

    return {
      success: false,
      message: `999-X-Ray-Tool: Cannot connect to Ollama`,
      data: {
        status: statusResponse,
        report,
        ollama_url: ollamaUrl,
        troubleshooting: getTroubleshootingTips()
      },
      error: statusResponse.error || 'Connection failed'
    };
  }
}

function generateStatusReport(ollamaUrl: string, status: OllamaStatusResponse): string {
  let report = `✅ **999-X-Ray-Tool: OLLAMA STATUS - CONNECTED**\n\n`;
  report += `🔗 URL: ${ollamaUrl}\n`;
  report += `🤖 Available models: ${status.models.length}\n\n`;

  if (status.models.length > 0) {
    report += `**Models:**\n`;
    status.models.forEach(model => {
      const size_gb = model.size / (1024 ** 3);
      report += `- ${model.name} (${size_gb.toFixed(1)}GB)\n`;
    });
  } else {
    report += `⚠️ No models available. Pull a model with:\n`;
    report += `\`\`\`bash\n`;
    report += `ollama pull llama3.1:8b\n`;
    report += `\`\`\`\n`;
  }

  return report;
}

function generateErrorReport(ollamaUrl: string, status: OllamaStatusResponse): string {
  let report = `❌ **999-X-Ray-Tool: OLLAMA STATUS - NOT CONNECTED**\n\n`;
  report += `🔗 URL: ${ollamaUrl}\n`;
  report += `❌ Error: ${status.error}\n\n`;

  return report;
}

function getRecommendedModels(models: OllamaModel[]): string[] {
  const recommended = [
    'llama3.1:8b',
    'llama3.1:70b',
    'qwen2.5:7b',
    'qwen2.5:14b',
    'qwen2.5:32b',
    'codellama:7b',
    'codellama:13b',
    'deepseek-coder:6.7b',
    'deepseek-coder:33b'
  ];

  // Filter to only show models that are available
  return recommended.filter(modelName =>
    models.some(model => model.name.includes(modelName.split(':')[0]))
  );
}

function getTroubleshootingTips(): string[] {
  return [
    "Check if Ollama is installed: `ollama --version`",
    "Start Ollama service: `ollama serve`",
    "Verify Ollama is running: `curl http://localhost:11434/api/tags`",
    "Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`",
    "Pull a model: `ollama pull llama3.1:8b`",
    "Check Ollama logs for errors"
  ];
}