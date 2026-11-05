# gentle-omarchy

[![pi-package](https://img.shields.io/badge/pi--package-verified-brightgreen)](https://pi.dev/packages)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

> Real-time dynamic Omarchy desktop theme synchronization for **Gentle Shell** and **Pi Coding Agent**.

When you change themes on your [Omarchy](https://omarchy.org/) Hyprland desktop (via `omarchy theme set`), **gentle-omarchy** automatically detects the palette change and applies it live to Gentle Shell in real time — with zero restarts, zero broken borders, and full harmony with your desktop environment.

---

## Features

- **Live Synchronization**: Switch themes in Omarchy (`omarchy theme set "Catppuccin"` or `"Tokyo Night"`), and Gentle Shell immediately updates its terminal colors.
- **Support for Custom Themes**: Works out of the box with stock themes as well as any custom theme created in `~/.config/omarchy/themes/`.
- **Dual Reactivity**:
  1. **File Watcher (`inotify`)**: Watches `~/.local/state/omarchy/current/theme/pi.json` for instant in-session updates.
  2. **Automation Hook**: Auto-installs `~/.config/omarchy/hooks/theme-set.d/gentle-shell` to ensure system-level persistence.
- **Gentle Shell / Gentleman Friendly**: Respects Gentle Shell's frame rules, floating prompt layout, status indicators, and Vim mode badges without causing layout shifts.

---

## Installation

### From local checkout

```bash
pi install /path/to/gentle-omarchy
```

### From Git (once pushed to GitHub)

```bash
pi install git:github.com/juniorcorzo/gentle-omarchy
```

### From npm (once published)

```bash
pi install npm:gentle-omarchy
```

---

## Configuration

In your `~/.gentle-shell/agent/settings.json` (or `~/.pi/agent/settings.json`), set:

```json
{
  "theme": "omarchy-system"
}
```

Or select **`omarchy-system`** interactively from `/gentle:customize` under the **Themes** tab.

---

## Commands

| Command | Description |
|---|---|
| `/omarchy:sync` | Forces an immediate re-read and re-application of the current Omarchy theme. |
| `/omarchy:status` | Shows the active desktop theme, hook status, and file watcher health. |
| `/omarchy:hook` | Re-installs or repairs the `theme-set.d` hook in `~/.config/omarchy/hooks/`. |

---

## How It Works

1. **Omarchy Compilation**: Omarchy generates `~/.local/state/omarchy/current/theme/pi.json` from `colors.toml` using its built-in `pi.json.tpl` template.
2. **Dynamic Sync**: `gentle-omarchy` mirrors this palette to `~/.gentle-shell/agent/themes/omarchy-system.json`.
3. **Hot-Reload**: Pi's `themeWatcher` detects the change and triggers an atomic redraw of all UI components and prompt frames.

---

## License

MIT © [Junior Corzo](https://github.com/juniorcorzo)
