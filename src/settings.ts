import type { App } from "obsidian";
import { Setting, PluginSettingTab } from "obsidian";
import type RealTimeSync from "../main";

export interface PluginSettings {
	domain: string;
	https: boolean;
	workspaceName: string;
	workspacePass: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	domain: "127.0.0.1:8080",
	https: false,
	workspaceName: "",
	workspacePass: "",
};

export class SettingTab extends PluginSettingTab {
	plugin: RealTimeSync;

	constructor(app: App, plugin: RealTimeSync) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Server URL")
			.setDesc("Server to connect")
			.addText((text) =>
				text
					.setPlaceholder("127.0.0.1:8080")
					.setValue(this.plugin.settings.domain)
					.onChange(async (value) => {
						this.plugin.settings.domain = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName("HTTPS").addToggle((toggle) =>
			toggle.onChange(async (value) => {
				this.plugin.settings.https = value;
				await this.plugin.saveSettings();
			}),
		);

		new Setting(containerEl)
			.setName("Workspace name")
			.setDesc("Remote workspace to sync with")
			.addText((text) =>
				text
					.setPlaceholder("workspace")
					.setValue(this.plugin.settings.workspaceName)
					.onChange(async (value) => {
						this.plugin.settings.workspaceName = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Workspace password")
			.setDesc("Remote workspace password")
			.addText((text) =>
				text
					.setPlaceholder("********")
					.setValue(maskString(this.plugin.settings.workspacePass))
					.onChange(async (value) => {
						// text.setValue(maskString(value));
						this.plugin.settings.workspacePass = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}

const maskString = (s: string) => "*".repeat(s.length);