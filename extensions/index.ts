/**
 * Gentle Omarchy - Live Omarchy theme integration for Gentle Shell and Pi
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, watch as fsWatch, type FSWatcher } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const OMARCHY_STATE_THEME = join(homedir(), ".local", "state", "omarchy", "current", "theme", "pi.json");
const OMARCHY_THEME_NAME_FILE = join(homedir(), ".local", "state", "omarchy", "current", "theme.name");
const OMARCHY_HOOKS_DIR = join(homedir(), ".config", "omarchy", "hooks", "theme-set.d");
const OMARCHY_HOOK_SCRIPT = join(OMARCHY_HOOKS_DIR, "gentle-shell");

const GENTLE_SHELL_THEMES_DIR = join(homedir(), ".gentle-shell", "agent", "themes");
const PI_AGENT_THEMES_DIR = join(homedir(), ".pi", "agent", "themes");
const TARGET_FILENAME = "omarchy-system.json";

function getActiveOmarchyThemeName(): string {
	try {
		if (existsSync(OMARCHY_THEME_NAME_FILE)) {
			return readFileSync(OMARCHY_THEME_NAME_FILE, "utf-8").trim();
		}
	} catch {}
	return "Unknown";
}

function installOmarchyHook(): boolean {
	try {
		if (!existsSync(join(homedir(), ".config", "omarchy"))) {
			return false; // Omarchy not configured
		}

		mkdirSync(OMARCHY_HOOKS_DIR, { recursive: true });

		const scriptContent = `#!/bin/bash
# Sync Omarchy theme to Gentle Shell and Pi
set -euo pipefail

SOURCE="$HOME/.local/state/omarchy/current/theme/pi.json"
if [ ! -f "$SOURCE" ]; then
  exit 0
fi

for THEME_DIR in "$HOME/.gentle-shell/agent/themes" "$HOME/.pi/agent/themes"; do
  mkdir -p "$THEME_DIR"
  rm -f "$THEME_DIR/${TARGET_FILENAME}"
  cp "$SOURCE" "$THEME_DIR/${TARGET_FILENAME}"
done
`;

		writeFileSync(OMARCHY_HOOK_SCRIPT, scriptContent, { mode: 0o755 });
		return true;
	} catch {
		return false;
	}
}

function syncThemeToAgent(ctx: ExtensionContext, notify = false): boolean {
	if (!existsSync(OMARCHY_STATE_THEME)) {
		if (notify) {
			ctx.ui.notify("Omarchy theme file not found in ~/.local/state/omarchy/current/theme/pi.json", "warning");
		}
		return false;
	}

	try {
		const raw = readFileSync(OMARCHY_STATE_THEME, "utf-8");

		// Sync to Gentle Shell themes folder
		for (const dir of [GENTLE_SHELL_THEMES_DIR, PI_AGENT_THEMES_DIR]) {
			try {
				mkdirSync(dir, { recursive: true });
				const dest = join(dir, TARGET_FILENAME);
				writeFileSync(dest, raw, "utf-8");
			} catch {}
		}

		// Apply theme live via Pi UI API
		const res = ctx.ui.setTheme("omarchy-system");
		const themeName = getActiveOmarchyThemeName();

		if (notify) {
			if (res.success) {
				ctx.ui.notify(`Synchronized Omarchy theme: ${themeName}`, "info");
			} else {
				ctx.ui.notify(`Theme synced but could not apply automatically: ${res.error || "unknown"}`, "warning");
			}
		}
		return res.success;
	} catch (err) {
		if (notify) {
			ctx.ui.notify(`Failed to sync Omarchy theme: ${err instanceof Error ? err.message : String(err)}`, "error");
		}
		return false;
	}
}

export default function (pi: ExtensionAPI) {
	let activeWatcher: FSWatcher | null = null;
	let debounceTimer: NodeJS.Timeout | null = null;

	function setupThemeWatcher(ctx: ExtensionContext) {
		if (activeWatcher) {
			try { activeWatcher.close(); } catch {}
			activeWatcher = null;
		}

		const watchDir = dirname(OMARCHY_STATE_THEME);
		if (!existsSync(watchDir)) return;

		try {
			activeWatcher = fsWatch(watchDir, (_event, filename) => {
				if (filename && !filename.includes("pi.json") && !filename.includes("theme")) {
					return;
				}
				if (debounceTimer) clearTimeout(debounceTimer);
				debounceTimer = setTimeout(() => {
					syncThemeToAgent(ctx, false);
				}, 150);
			});
		} catch {}
	}

	pi.on("session_start", (_event, ctx) => {
		// Ensure hook is in place
		installOmarchyHook();

		// Sync current theme on boot
		syncThemeToAgent(ctx, false);

		// Watch for desktop theme changes
		setupThemeWatcher(ctx);
	});

	// Commands
	pi.registerCommand("omarchy:sync", {
		description: "Synchronize and apply current Omarchy desktop theme to Gentle Shell",
		handler: async (_args, ctx) => {
			syncThemeToAgent(ctx, true);
		},
	});

	pi.registerCommand("omarchy:status", {
		description: "Show Omarchy theme synchronization status and current desktop theme",
		handler: async (_args, ctx) => {
			const themeName = getActiveOmarchyThemeName();
			const hasThemeFile = existsSync(OMARCHY_STATE_THEME);
			const hasHook = existsSync(OMARCHY_HOOK_SCRIPT);
			const watching = activeWatcher !== null;

			ctx.ui.notify(
				`Omarchy Theme: ${themeName} | Hook: ${hasHook ? "Active" : "Missing"} | Watcher: ${watching ? "Watching" : "Inactive"} | Source: ${hasThemeFile ? "OK" : "Missing"}`,
				"info",
			);
		},
	});

	pi.registerCommand("omarchy:hook", {
		description: "Reinstall or verify Omarchy system automation hook",
		handler: async (_args, ctx) => {
			const ok = installOmarchyHook();
			if (ok) {
				ctx.ui.notify(`Omarchy hook successfully installed at ${OMARCHY_HOOK_SCRIPT}`, "info");
			} else {
				ctx.ui.notify("Failed to install hook. Check permissions in ~/.config/omarchy/hooks", "error");
			}
		},
	});
}
