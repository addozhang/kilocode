import type { ModelInfo } from "../model.js"

// https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
export type AzureOpenAIModelId = keyof typeof azureOpenAIModels

export const azureOpenAIDefaultModelId: AzureOpenAIModelId = "gpt-4"

export const azureOpenAIModels = {
	"gpt-4o": {
		maxTokens: 4096,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 5.0, // $5.00 per million tokens
		outputPrice: 15.0, // $15.00 per million tokens
		description: `Azure OpenAI GPT-4o model with multimodal capabilities including vision`,
	},
	"gpt-4o-mini": {
		maxTokens: 16384,
		contextWindow: 128_000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0.15, // $0.15 per million tokens
		outputPrice: 0.6, // $0.60 per million tokens
		description: `Azure OpenAI GPT-4o Mini model with vision support, optimized for speed and cost`,
	},
	"gpt-4-turbo": {
		maxTokens: 4096,
		contextWindow: 128_000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 10.0, // $10.00 per million tokens
		outputPrice: 30.0, // $30.00 per million tokens
		description: `Azure OpenAI GPT-4 Turbo model with large context window`,
	},
	"gpt-4": {
		maxTokens: 8192,
		contextWindow: 8192,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 30.0, // $30.00 per million tokens
		outputPrice: 60.0, // $60.00 per million tokens
		description: `Azure OpenAI GPT-4 base model`,
	},
	"gpt-4-32k": {
		maxTokens: 8192,
		contextWindow: 32768,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 60.0, // $60.00 per million tokens
		outputPrice: 120.0, // $120.00 per million tokens
		description: `Azure OpenAI GPT-4 32K model with extended context`,
	},
	"gpt-35-turbo": {
		maxTokens: 4096,
		contextWindow: 16385,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0.5, // $0.50 per million tokens
		outputPrice: 1.5, // $1.50 per million tokens
		description: `Azure OpenAI GPT-3.5 Turbo model`,
	},
	"gpt-35-turbo-16k": {
		maxTokens: 4096,
		contextWindow: 16385,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 3.0, // $3.00 per million tokens
		outputPrice: 4.0, // $4.00 per million tokens
		description: `Azure OpenAI GPT-3.5 Turbo 16K model with extended context`,
	},
} as const satisfies Record<string, ModelInfo>

export const AZURE_OPENAI_DEFAULT_TEMPERATURE = 0.3
