---
name: update-readme
description: >-
  Use this skill whenever the user asks to update the README, update screenshots,
  or refresh documentation from real app snapshots ("update readme", "update lại readme", "chụp lại ảnh readme").
---

# Update README & Real App Screenshots Workflow

Automated workflow to capture live, high-resolution 2x Retina screenshots from the running DBNerd app and synchronize the project `README.md`.

## Workflow Steps

1. **Check Dev Server**:
   Ensure `http://localhost:1420` is reachable.
   ```bash
   curl -s http://localhost:1420 > /dev/null || pnpm run dev
   ```

2. **Capture Real App Screenshots**:
   Execute the automated headless Chrome CDP script:
   ```bash
   pnpm run update-readme
   ```
   This script triggers `window.__APP_STORE__` and DOM actions in headless Chrome, capturing:
   - `media/studio-preview.png`: Hero SQL editor with TablePlus sub-tabs and autocomplete
   - `media/inline-edit-modal.png`: Inline cell editing & UPDATE generator modal
   - `media/table-grid-view.png`: Glide data grid with WHERE/ORDER BY filter bar
   - `media/connection-manager.png`: Connection groups & SSH Bastion jump host form
   - `media/safe-mode-production.png`: Production Safe Mode password challenge
   - `media/query-history.png`: Query history timeline & execution audit log
   - `media/observability-dashboard.png`: PostgreSQL real-time stats & storage usage
   - `media/light-mode.png`: Clean macOS light mode

3. **Update README.md**:
   Review `README.md` to ensure all newly introduced features, keyboard shortcuts, and architecture notes match the codebase.

4. **Verify TypeScript & Production Build**:
   ```bash
   pnpm run build
   ```

5. **Commit and Push to Main (Owner)**:
   Stage all files, commit with the owner author tag, and push:
   ```bash
   git add media/ scripts/ README.md package.json AGENTS.md .agents/
   git commit --author="khoa-nguyen <anhkhoa.nguyen2610@gmail.com>" -m "docs: refresh README with real app retina screenshots"
   git push origin main
   ```
