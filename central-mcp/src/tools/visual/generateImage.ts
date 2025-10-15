/**
 * ComfyUI Image Generation MCP Tool
 * Allows agents to generate images through Central-MCP → RunPod ComfyUI
 *
 * Usage by agents:
 *   "Generate an image of a futuristic dashboard interface"
 *   "Create a diagram showing the system architecture"
 *   "Design a logo for Central-MCP"
 */

import Database from 'better-sqlite3';
import { join } from 'path';

interface ComfyUIWorkflow {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  cfg_scale?: number;
  sampler?: string;
  scheduler?: string;
  model?: string;
}

interface ComfyUIService {
  endpoint: string;
  api_key?: string;
  status: string;
}

/**
 * Get ComfyUI service endpoint from database
 */
function getComfyUIEndpoint(): ComfyUIService {
  const dbPath = join(process.cwd(), 'src', 'database', 'registry.db');
  const db = new Database(dbPath);

  const service = db.prepare(`
    SELECT endpoint, api_key, status
    FROM external_services
    WHERE service_type = ? AND status = ?
  `).get('image_generation', 'active') as ComfyUIService | undefined;

  db.close();

  if (!service) {
    throw new Error(
      '❌ ComfyUI not configured. Run: npm run setup-comfyui'
    );
  }

  return service;
}

/**
 * Create default SDXL text-to-image workflow
 */
function createSDXLWorkflow(params: ComfyUIWorkflow): any {
  return {
    "3": {
      "inputs": {
        "seed": params.seed || Math.floor(Math.random() * 1000000),
        "steps": params.steps || 20,
        "cfg": params.cfg_scale || 8,
        "sampler_name": params.sampler || "euler",
        "scheduler": params.scheduler || "normal",
        "denoise": 1,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": params.model || "sd_xl_base_1.0.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "5": {
      "inputs": {
        "width": params.width || 1024,
        "height": params.height || 1024,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "text": params.prompt,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": params.negative_prompt || "low quality, blurry, distorted, text, watermark",
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["4", 2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "central_mcp",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    }
  };
}

/**
 * Wait for ComfyUI workflow to complete
 */
async function waitForCompletion(
  endpoint: string,
  promptId: string,
  timeout: number = 120000
): Promise<string | null> {
  const startTime = Date.now();
  const pollInterval = 1000; // 1 second

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`${endpoint}/history/${promptId}`);
      const history = await response.json();

      if (history[promptId]?.status?.completed) {
        // Extract image URL from outputs
        const outputs = history[promptId].outputs;
        const saveImageNode = Object.values(outputs).find(
          (node: any) => node.images && node.images.length > 0
        );

        if (saveImageNode && 'images' in saveImageNode) {
          const filename = saveImageNode.images[0].filename;
          const subfolder = saveImageNode.images[0].subfolder || '';
          const type = saveImageNode.images[0].type || 'output';

          // Construct image URL
          const imageUrl = `${endpoint}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${type}`;
          return imageUrl;
        }
      }

      // Check for errors
      if (history[promptId]?.status?.status_str === 'error') {
        const error = history[promptId].status.messages;
        throw new Error(`ComfyUI error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ComfyUI error')) {
        throw error;
      }
      // Continue polling on network errors
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  return null; // Timeout
}

/**
 * Log image generation to database
 */
function logImageGeneration(params: {
  prompt: string;
  promptId: string;
  imageUrl: string;
  duration: number;
  agentLetter?: string;
}) {
  const dbPath = join(process.cwd(), 'src', 'database', 'registry.db');
  const db = new Database(dbPath);

  db.prepare(`
    INSERT INTO image_generations (
      prompt_id, prompt, image_url, duration_ms, agent_letter, created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(
    params.promptId,
    params.prompt,
    params.imageUrl,
    params.duration,
    params.agentLetter || null
  );

  db.close();
}

/**
 * Main image generation function
 */
export async function generateImage(params: ComfyUIWorkflow & { agentLetter?: string }) {
  console.log('🎨 Generating image via ComfyUI...');
  console.log(`   Prompt: ${params.prompt.substring(0, 100)}...`);

  const startTime = Date.now();

  try {
    // Get ComfyUI endpoint
    const service = getComfyUIEndpoint();
    const endpoint = service.endpoint;

    // Create workflow
    const workflow = createSDXLWorkflow(params);

    // Queue prompt
    const response = await fetch(`${endpoint}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(service.api_key && { 'Authorization': `Bearer ${service.api_key}` })
      },
      body: JSON.stringify({ prompt: workflow, client_id: 'central-mcp' })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ComfyUI API error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const promptId = result.prompt_id;

    if (!promptId) {
      throw new Error('No prompt_id returned from ComfyUI');
    }

    console.log(`   Prompt ID: ${promptId}`);
    console.log('   Waiting for generation...');

    // Wait for completion
    const imageUrl = await waitForCompletion(endpoint, promptId);

    if (!imageUrl) {
      throw new Error('Image generation timeout (120 seconds)');
    }

    const duration = Date.now() - startTime;

    // Log to database
    try {
      logImageGeneration({
        prompt: params.prompt,
        promptId,
        imageUrl,
        duration,
        agentLetter: params.agentLetter
      });
    } catch (error) {
      console.error('Failed to log image generation:', error);
      // Non-fatal, continue
    }

    console.log(`✅ Image generated in ${(duration / 1000).toFixed(1)}s`);
    console.log(`   URL: ${imageUrl}`);

    return {
      success: true,
      prompt_id: promptId,
      image_url: imageUrl,
      prompt: params.prompt,
      duration_ms: duration,
      duration_seconds: Math.round(duration / 1000),
      comfyui_endpoint: endpoint,
      parameters: {
        width: params.width || 1024,
        height: params.height || 1024,
        steps: params.steps || 20,
        cfg_scale: params.cfg_scale || 8,
        seed: params.seed || 'random'
      },
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Image generation failed:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      prompt: params.prompt,
      duration_ms: Date.now() - startTime
    };
  }
}

/**
 * MCP Tool Definition
 */
export const generateImageTool = {
  name: 'generate_image',
  description: `Generate images using ComfyUI on RunPod. Perfect for:
  - UI mockups and design concepts
  - Diagrams and flowcharts
  - Logos and branding
  - Visual documentation
  - Marketing materials

The image will be generated using Stable Diffusion XL on your RunPod ComfyUI instance.`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed description of the image to generate. Be specific about style, composition, colors, etc.'
      },
      negative_prompt: {
        type: 'string',
        description: 'What to avoid in the image (default: "low quality, blurry, distorted, text, watermark")'
      },
      width: {
        type: 'number',
        description: 'Image width in pixels (default: 1024, recommended: 512, 768, 1024)',
        default: 1024
      },
      height: {
        type: 'number',
        description: 'Image height in pixels (default: 1024, recommended: 512, 768, 1024)',
        default: 1024
      },
      steps: {
        type: 'number',
        description: 'Number of diffusion steps (default: 20, range: 10-50)',
        default: 20
      },
      cfg_scale: {
        type: 'number',
        description: 'How closely to follow the prompt (default: 8, range: 1-20)',
        default: 8
      },
      seed: {
        type: 'number',
        description: 'Random seed for reproducibility (default: random)'
      }
    },
    required: ['prompt']
  }
};

export default generateImage;
