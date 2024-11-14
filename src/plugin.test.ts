import { afterEach, beforeEach, describe, mock, test } from "node:test";
import { RealTimePlugin } from "./plugin";
import { Disk } from "./storage/storage";
import { CreateVaultMock } from "./storage/storage.mock";
import fs from "node:fs/promises";
import { ApiClient, type File } from "./api";
import { HttpClient } from "./http";
import { WsClient } from "./ws";
import type { Vault } from "obsidian";
import assert from "node:assert";

describe("Disk storage integration tests", () => {
	let vaultRootDir: string;
	let vault: Vault;
	let apiClient: ApiClient;
	let plugin: RealTimePlugin;
	let wsClient: WsClient;

	beforeEach(async () => {
		vaultRootDir = await fs.mkdtemp("/tmp/storage_test");
		vault = CreateVaultMock(vaultRootDir);
		const storage = new Disk(vault);
		const httpClient = new HttpClient("http", "localhost", {});
		apiClient = new ApiClient(httpClient);
		wsClient = new WsClient("localhost");

		plugin = new RealTimePlugin(storage, apiClient, wsClient);
	});

	afterEach(async () => {
		await fs.rm(vaultRootDir, { recursive: true, force: true });
		mock.restoreAll();
	});

	test("should create a file on 'create'", async (t) => {
		const createFile = t.mock.method(apiClient, "createFile", (): File => {
			return {
				id: 1,
				workspace_path: "files/newFile.md",
				disk_path: "",
				hash: "",
				created_at: new Date().toString(),
				updated_at: new Date().toString(),
				mime_type: "",
				workspace_id: 1,
			};
		});

		await plugin.events.create({
			name: "newFile.md",
			path: "files/newFile.md",
			vault,
			parent: null,
		});

		// this should not trigger a call, since we already have the file in map
		await plugin.events.create({
			name: "newFile.md",
			path: "files/newFile.md",
			vault,
			parent: null,
		});

		assert.deepEqual(
			plugin.getFilePathToId(),
			new Map([["files/newFile.md", 1]]),
		);
		assert.strictEqual(createFile.mock.callCount(), 1);
	});

	test("should delete a file on 'delete'", async (t) => {
		const deleteFile = t.mock.method(apiClient, "deleteFile", () => { });
		const createFile = t.mock.method(apiClient, "createFile", (): File => {
			return {
				id: 1,
				workspace_path: "files/newFile.md",
				disk_path: "",
				hash: "",
				created_at: new Date().toString(),
				updated_at: new Date().toString(),
				mime_type: "",
				workspace_id: 1,
			};
		});

		await plugin.events.create({
			name: "newFile.md",
			path: "files/newFile.md",
			vault,
			parent: null,
		});

		assert.deepEqual(
			plugin.getFilePathToId(),
			new Map([["files/newFile.md", 1]]),
		);

		await plugin.events.delete({
			name: "newFile.md",
			path: "files/newFile.md",
			vault,
			parent: null,
		});

		assert.deepEqual(plugin.getFilePathToId(), new Map());
		assert.strictEqual(deleteFile.mock.callCount(), 1);
		assert.strictEqual(createFile.mock.callCount(), 1);
	});
});
