# gentle-omarchy

[![pi-package](https://img.shields.io/badge/pi--package-verified-brightgreen)](https://pi.dev/packages)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Omarchy Linux](https://img.shields.io/badge/Omarchy-Hyprland-blueviolet)](https://omarchy.org)

> Real-time dynamic [Omarchy](https://omarchy.org/) desktop theme synchronization for **Gentle Shell**.

When you switch themes in Omarchy (`omarchy theme set`), **`gentle-omarchy`** detects the palette transition and re-themes Gentle Shell live on your screen without restarting your session, without breaking terminal borders, and without layout shifts.

---

## The Problem It Solves

Omarchy themes are completely custom: every theme defines its own `colors.toml` (accent colors, background shades, borders, status highlights, terminal palette). 

By default, Gentle Shell ships with curated static themes (like `Gentleman-Cute`). If you change your desktop theme in Omarchy (e.g. from *Tokyo Night* to *Catppuccin* or a custom community theme), your terminal emulator and desktop windows change color, but the agent's TUI remains stuck in its previous palette.

**`gentle-omarchy`** bridges this gap. It turns Gentle Shell into a reactive citizen of your Omarchy desktop environment.

---

## Key Features

- **Live In-Session Reactivity**: Change themes via `omarchy theme set "Catppuccin"` or `omarchy theme set "Tokyo Night"` — Gentle Shell repaints its colors dynamically while you are typing.
- **100% Custom Theme Support**: Works seamlessly with Omarchy stock themes (`/usr/share/omarchy/themes/`) as well as user-authored custom themes (`~/.config/omarchy/themes/`).
- **Dual Reactivity Pipeline**:
  1. **In-Process Watcher (`inotify` / `fs.watch`)**: Watches the active Omarchy theme state file (`~/.local/state/omarchy/current/theme/pi.json`) for sub-second hot-reloads.
  2. **Automated System Hook**: Auto-provisions `~/.config/omarchy/hooks/theme-set.d/gentle-shell` so system-wide theme events persist across reboots and new sessions.
- **Gentleman Frame & TUI Harmony**: Fully compatible with Gentle Shell's floating prompt layout, panel buttons, bottom shell bar, and modal Vim editing badges.
- **Zero Configuration**: Starts working immediately upon installation with intelligent fallbacks.

---

## Installation

### With Gentle Shell Package Manager

From GitHub:
```bash
gentle-shell install git:github.com/juniorcorzo/gentle-omarchy
```

From local directory (for development or manual clone):
```bash
gentle-shell install /path/to/gentle-omarchy
```

Once published on npm:
```bash
gentle-shell install npm:gentle-omarchy
```

---

## Setup & Activation

Ensure your `~/.gentle-shell/agent/settings.json` specifies:

```json
{
  "theme": "omarchy-system"
}
```

Or switch to it interactively by pressing `/gentle:customize` and selecting **`omarchy-system`** in the **Themes** tab.

---

## Interactive Slash Commands

| Command | Description |
|---|---|
| `/omarchy:sync` | Forces an immediate re-read of the desktop theme and applies it to the active TUI. |
| `/omarchy:status` | Displays the current desktop theme name, hook state, and file watcher health. |
| `/omarchy:hook` | Re-installs or repairs the `theme-set.d` hook in `~/.config/omarchy/hooks/`. |

---

## How It Works (Architecture)

```text
┌────────────────────────┐
│  omarchy theme set     │  (User switches desktop theme)
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Omarchy Template Engine│  (Compiles colors.toml with pi.json.tpl)
└───────────┬────────────┘
            │ Writes
            ▼
┌───────────────────────────────────────────────┐
│ ~/.local/state/omarchy/current/theme/pi.json  │
└───────────┬───────────────────────────────────┘
            │
      ┌─────┴────────────────────────┐
      │                              │
      ▼ (Live Session)               ▼ (System Hook)
┌──────────────────────────┐   ┌──────────────────────────────────────────┐
│ gentle-omarchy Watcher   │   │ ~/.config/omarchy/hooks/theme-set.d/     │
│ (fs.watch / inotify)     │   │ gentle-shell sync script                 │
└───────────┬──────────────┘   └──────────────────┬───────────────────────┘
            │                                     │
            └─────────────────┬───────────────────┘
                              │
                              ▼ Updates
┌───────────────────────────────────────────────┐
│ ~/.gentle-shell/agent/themes/                 │
│                 omarchy-system.json           │
└─────────────────────────────┬─────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────┐
│ Gentle Shell Theme Engine                     │
│ (Atomic redraw of borders, text & badges)     │
└───────────────────────────────────────────────┘
```

1. **Omarchy Theme Compilation**: Omarchy evaluates the active theme's `colors.toml` and renders `pi.json` inside `~/.local/state/omarchy/current/theme/`.
2. **Event & File Synchronization**: `gentle-omarchy` captures this event via an in-memory debounced file watcher and the system `theme-set.d` automation hook.
3. **Atomic Theme Re-application**: The plugin writes the updated JSON into Gentle Shell's themes directory and calls `ctx.ui.setTheme("omarchy-system")` to refresh the TUI canvas.

---

## Troubleshooting

### Theme didn't update after `omarchy theme set`
1. Run `/omarchy:status` to verify that the watcher and hook are active.
2. Run `/omarchy:sync` to manually force a sync.
3. Verify that your Omarchy theme contains valid color definitions by checking `omarchy theme current`.

---

## Contributing

Contributions, bug reports, and suggestions are welcome! Feel free to open an issue or submit a pull request on GitHub.

---

## License

[MIT License](LICENSE) © 2026 [Junior Corzo](https://github.com/juniorcorzo)
