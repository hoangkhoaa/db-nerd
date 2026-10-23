# DBNerd Agent Guidelines & Operational Memory

## 1. Git & Contribution Workflow (Trunk-Based)
- **Repository Owner**: Khoa Nguyen (`khoa-nguyen <anhkhoa.nguyen2610@gmail.com>`).
- **Owner Permissions**: Direct push to `main` branch. Commits authored by the owner should use:
  ```bash
  git commit --author="khoa-nguyen <anhkhoa.nguyen2610@gmail.com>" -m "<message>"
  git push origin main
  ```
- **Contributors**: Restricted from pushing directly to `main`. All contributor changes must go through Pull Requests (PRs).
- **Release Flow**: Automated semantic tagging & release notes from `main` (e.g. `v1.0.x`).

---

## 2. Automated "Update README" Flow (Memory Runbook)
Whenever the user asks to **"update readme"** (or **"update lại readme"**, **"refresh screenshots"**, etc.), ALWAYS execute this full automated flow without skipping steps:

1. **Verify Running Instance**:
   Ensure the local Vite dev server is running on `http://localhost:1420`:
   ```bash
   curl -s http://localhost:1420 > /dev/null || pnpm run dev
   ```
2. **Capture Real App Screenshots (Strictly No Mockups)**:
   Run the headless Chrome CDP screenshot pipeline:
   ```bash
   pnpm run update-readme
   ```
   This generates 8 live 2x Retina screenshots in `media/`:
   - `media/studio-preview.png` (Hero: SQL editor, TablePlus tabs, metrics, autocomplete)
   - `media/inline-edit-modal.png` (Inline cell editing & UPDATE SQL generator modal)
   - `media/table-grid-view.png` (120 FPS Glide data grid + inline filter bar)
   - `media/connection-manager.png` (Connection groups & SSH Bastion jump host)
   - `media/safe-mode-production.png` (Safe mode production password challenge)
   - `media/query-history.png` (Query history audit log & execution timeline)
   - `media/observability-dashboard.png` (Real-time instance observability & storage stats)
   - `media/light-mode.png` (Native macOS light theme)
3. **Sync Documentation in `README.md`**:
   Check if any newly implemented features, shortcuts, or benchmark numbers need updating in `README.md`.
4. **Compile & Verification**:
   Verify TypeScript & build integrity:
   ```bash
   pnpm run build
   ```
5. **Commit & Push to Main**:
   Stage changes, commit as owner, and push to `origin main`:
   ```bash
   git add media/ scripts/ README.md package.json AGENTS.md .agents/
   git commit --author="khoa-nguyen <anhkhoa.nguyen2610@gmail.com>" -m "docs: refresh README with real app retina screenshots"
   git push origin main
   ```

---

## 3. Engineering & UX Guidelines
- **Zero Sound Effects**: Never play audio, chimes, or sound effects on user actions.
- **No Layout Jitter**: Loading states and chasing borders must maintain fixed box dimensions so the UI never shakes or scales unexpectedly.
- **Safe Mode**: Production environments enforce validation and modal confirmation/password verification before write/mutation execution.
- **Performance & Observability**: Heartbeat connections must be throttled with smart health checks (avoid spam pinging / high RAM churn).
- **Multi-Query Support**: Similar to TablePlus, multiple SQL statements yield individual sub-tabs with execution timers and status indicators.
- **Inline Cell Editing**: Allows cell editing with dirty indicators and automatic `UPDATE <table> SET ... WHERE <pk> = ...` generation with copy / send to editor.
