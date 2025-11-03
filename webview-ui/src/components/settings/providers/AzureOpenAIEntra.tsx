import { useCallback } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"

import type { ProviderSettings } from "@roo-code/types"

import { useAppTranslation } from "@src/i18n/TranslationContext"

import { inputEventTransform } from "../transforms"

type AzureOpenAIEntraProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
}

export const AzureOpenAIEntra = ({ apiConfiguration, setApiConfigurationField }: AzureOpenAIEntraProps) => {
	const { t } = useAppTranslation()

	const handleInputChange = useCallback(
		<K extends keyof ProviderSettings, E>(
			field: K,
			transform: (event: E) => ProviderSettings[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				setApiConfigurationField(field, transform(event as E))
			},
		[setApiConfigurationField],
	)

	return (
		<>
			<VSCodeTextField
				value={apiConfiguration?.azureOpenAiBaseUrl || ""}
				type="url"
				onInput={handleInputChange("azureOpenAiBaseUrl")}
				placeholder="https://your-resource.openai.azure.com/"
				className="w-full">
				<label className="block font-medium mb-1">{t("settings:providers.azureOpenAiBaseUrl")}</label>
			</VSCodeTextField>

			<VSCodeTextField
				value={apiConfiguration?.azureOpenAiDeploymentName || ""}
				onInput={handleInputChange("azureOpenAiDeploymentName")}
				placeholder="gpt-4"
				className="w-full">
				<label className="block font-medium mb-1">{t("settings:providers.azureOpenAiDeploymentName")}</label>
			</VSCodeTextField>

			<VSCodeTextField
				value={apiConfiguration?.azureOpenAiApiVersion || ""}
				onInput={handleInputChange("azureOpenAiApiVersion")}
				placeholder="2024-02-01"
				className="w-full">
				<label className="block font-medium mb-1">{t("settings:providers.azureOpenAiApiVersion")}</label>
			</VSCodeTextField>

			<VSCodeTextField
				value={apiConfiguration?.azureADTenantId || ""}
				onInput={handleInputChange("azureADTenantId")}
				placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
				className="w-full">
				<label className="block font-medium mb-1">{t("settings:providers.azureADTenantId")}</label>
			</VSCodeTextField>

			<VSCodeTextField
				value={apiConfiguration?.azureADClientId || ""}
				onInput={handleInputChange("azureADClientId")}
				placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
				className="w-full">
				<label className="block font-medium mb-1">{t("settings:providers.azureADClientId")}</label>
			</VSCodeTextField>

			<VSCodeTextField
				value={apiConfiguration?.azureADClientSecret || ""}
				type="password"
				onInput={handleInputChange("azureADClientSecret")}
				placeholder="Your Azure AD client secret"
				className="w-full">
				<label className="block font-medium mb-1">{t("settings:providers.azureADClientSecret")}</label>
			</VSCodeTextField>

			<div className="text-sm text-vscode-descriptionForeground -mt-2">
				{t("settings:providers.apiKeyStorageNotice")}
			</div>

			<div className="text-xs text-vscode-descriptionForeground mt-2 p-2 bg-vscode-input-background rounded border">
				<strong>🔒 Security Note:</strong> This provider uses Azure Entra ID authentication and does not require
				API keys. Ensure your service principal has the &quot;Cognitive Services OpenAI User&quot; role
				assigned.
			</div>
		</>
	)
}
