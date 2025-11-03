import { AzureOpenAI } from "openai"
import { ClientSecretCredential } from "@azure/identity"
import { Anthropic } from "@anthropic-ai/sdk"
import type { ChatCompletionMessageParam, ChatCompletionContentPart } from "openai/resources/chat/completions"

import type { ModelInfo, ProviderSettings } from "@roo-code/types"

import { BaseProvider } from "./base-provider"
import { ApiStream, ApiStreamTextChunk, ApiStreamUsageChunk, ApiStreamError } from "../transform/stream"
import { countTokens } from "../../utils/countTokens"

export class AzureOpenAIEntraHandler extends BaseProvider {
	private client: AzureOpenAI | null = null
	private model: { id: string; info: ModelInfo }
	private options: ProviderSettings

	constructor(options: ProviderSettings) {
		super()
		this.options = options

		// Set up model info - use openAiCustomModelInfo if available, otherwise use defaults
		const modelId = options.azureOpenAiDeploymentName || "gpt-4"
		this.model = {
			id: modelId,
			info: {
				maxTokens: this.getMaxTokensForModel(modelId), // Dynamically determine max tokens
				contextWindow: 128000,
				supportsImages: modelId.includes("vision") || modelId.includes("gpt-4o"),
				supportsPromptCache: false,
				inputPrice: 0.01, // Placeholder pricing
				outputPrice: 0.03,
				description: `Azure OpenAI ${modelId} with Entra ID authentication`,
			},
		}

		if (!this.options.modelTemperature) {
			this.options.modelTemperature = 0.3 // Default temperature
		}
	}

	private getMaxTokensForModel(modelId: string): number {
		// Azure OpenAI models have specific token limits based on common GPT models
		// These values are based on Azure OpenAI documentation and common model capabilities

		// GPT-5 series (if available in Azure OpenAI)
		if (modelId.includes("gpt-5-preview")) {
			return 32768
		} else if (modelId.includes("gpt-5-turbo")) {
			return 32768
		} else if (modelId.includes("gpt-5-mini")) {
			return 16384
		} else if (modelId.includes("gpt-5")) {
			return 32768
		}
		// GPT-4o series
		else if (modelId.includes("gpt-4o-mini")) {
			return 16384
		} else if (modelId.includes("gpt-4o")) {
			return 16384
		}
		// GPT-4 series
		else if (modelId.includes("gpt-4-turbo")) {
			return 4096
		} else if (modelId.includes("gpt-4-32k")) {
			return 32768
		} else if (modelId.includes("gpt-4")) {
			return 8192
		}
		// GPT-3.5 series
		else if (modelId.includes("gpt-35-turbo-16k")) {
			return 16384
		} else if (modelId.includes("gpt-35-turbo")) {
			return 4096
		}

		// Default fallback for unknown models
		return 16384
	}

	private async getClient(): Promise<AzureOpenAI> {
		if (this.client) {
			return this.client
		}

		// 使用 @azure/identity SDK 获取凭据
		const credential = new ClientSecretCredential(
			this.options.azureADTenantId!,
			this.options.azureADClientId!,
			this.options.azureADClientSecret!,
		)

		// 初始化 Azure OpenAI 客户端，使用 azureADTokenProvider
		this.client = new AzureOpenAI({
			azureADTokenProvider: async () => {
				const token = await credential.getToken("https://cognitiveservices.azure.com/.default")
				return token.token
			},
			apiVersion: this.options.azureOpenAiApiVersion || "2024-02-01",
			endpoint: this.options.azureOpenAiBaseUrl,
			deployment: this.options.azureOpenAiDeploymentName,
		})

		return this.client
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		// Convert Anthropic format to OpenAI format
		const openaiMessages = this.convertToOpenAIMessages(systemPrompt, messages)

		const client = await this.getClient()
		const stream = await client.chat.completions.create({
			model: this.model.id,
			messages: openaiMessages,
			stream: true,
			max_completion_tokens: this.model.info.maxTokens,
			temperature: this.options.modelTemperature,
		})

		try {
			for await (const chunk of stream) {
				const delta = chunk.choices[0]?.delta
				if (delta?.content) {
					yield {
						type: "text",
						text: delta.content,
					} as ApiStreamTextChunk
				}
			}

			// Send completion signal
			yield {
				type: "usage",
				inputTokens: 0, // Would need to calculate actual usage
				outputTokens: 0,
				totalCost: 0,
			} as ApiStreamUsageChunk
		} catch (error) {
			yield {
				type: "error",
				error: error instanceof Error ? error.message : String(error),
				message: error instanceof Error ? error.message : String(error),
			} as ApiStreamError
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		return this.model
	}

	private convertToOpenAIMessages(
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
	): ChatCompletionMessageParam[] {
		const openaiMessages: ChatCompletionMessageParam[] = []

		// Add system message
		if (systemPrompt) {
			openaiMessages.push({
				role: "system",
				content: systemPrompt,
			})
		}

		// Convert user messages
		for (const message of messages) {
			if (message.role === "user") {
				const content = this.convertMessageContent(
					Array.isArray(message.content) ? message.content : [{ type: "text", text: message.content }],
				)
				openaiMessages.push({
					role: "user",
					content: content as string,
				})
			} else if (message.role === "assistant") {
				const content = this.convertMessageContent(
					Array.isArray(message.content) ? message.content : [{ type: "text", text: message.content }],
				)
				openaiMessages.push({
					role: "assistant",
					content: content as string,
				})
			}
		}

		return openaiMessages
	}

	private convertMessageContent(
		content: Anthropic.Messages.ContentBlockParam[],
	): string | ChatCompletionContentPart[] {
		if (content.length === 1 && content[0].type === "text") {
			return content[0].text
		}

		// Handle multimodal content
		const parts: ChatCompletionContentPart[] = []

		for (const block of content) {
			if (block.type === "text") {
				parts.push({
					type: "text",
					text: block.text,
				})
			} else if (block.type === "image") {
				if (block.source.type === "base64") {
					parts.push({
						type: "image_url",
						image_url: {
							url: `data:${block.source.media_type};base64,${block.source.data}`,
						},
					})
				}
			}
		}

		return parts
	}

	override async countTokens(content: Anthropic.Messages.ContentBlockParam[]): Promise<number> {
		// Use tiktoken for token counting
		return countTokens(content, { useWorker: true })
	}
}
