# db-nerd 🤓 🗄️

> **The fast, lightweight, native-feel database studio for developers who care about milliseconds.**
> Open-source alternative with zero bloat, instant cold start (< 0.4s), and ~50MB RAM footprint.

---

## ⚡ Highlights

- **Native Speed & Zero Bloat:** Built with **Tauri v2 + Rust Core + WebKit**. No JVM, no heavy bundled Chromium, no 2GB RAM hogging.
- **120 FPS Canvas Data Grid:** Powered by `@glideapps/glide-data-grid` — smooth scrolling and in-place cell editing across 1,000,000+ rows.
- **Multi-Engine MVP Support:**
  - 🐘 **PostgreSQL** 12–16+
  - 🐬 **MySQL** 5.7 / 8.0 & MariaDB
  - 🟥 **Redis** (Key-Value tree browser, live TTL countdown, hash/list/set editors)
  - ❄️ **Snowflake** Cloud Data Warehouse (Account, Warehouse, Database, Role)
- **Nested Connection Groups & Environment Tags:**
  - 🔴 **PROD** (Red, with Safety Warning Mode before `UPDATE`/`DROP`)
  - 🟡 **STAGING** (Amber)
  - 🟢 **LOCAL** (Green)
- **SQL Studio with Smart IntelliSense:**
  - In-Memory Schema Trie index for instant autocomplete (< 0.8ms).
  - Smart Foreign Key JOIN condition suggestions (`ON o.user_id = u.id`).
  - On-the-fly keyword auto-capitalize (`select` ➔ `SELECT`).
- **Query History & Audit Log:**
  - Filter by connection and group by date.
  - 1-click **Copy SQL** and **Run in Editor**.
  - Local SQLite FTS5 full-text search.
- **Observability & Activity Monitor:**
  - Live Processlist (`pg_stat_activity` / `SHOW PROCESSLIST`).
  - **1-Click "Kill Query"** button for runaway slow queries.
  - Buffer Cache Hit Ratio, TPS, Connection Pool meter, and Table Bloat Inspector.

---

## 🚀 Quickstart

### 1. Start Local Test Databases
Spin up isolated PostgreSQL, MySQL, and Redis test containers on `localhost`:
```bash
docker compose up -d
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run in Desktop Development Mode (Hot-Reload)
```bash
pnpm tauri dev
```

### 4. Build Native macOS `.dmg` Installer
```bash
pnpm tauri build
# Output: src-tauri/target/release/bundle/dmg/db-nerd_0.1.0_aarch64.dmg
```

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UI LAYER (TypeScript / React)            │
│  • Data Grid: @glideapps/glide-data-grid (Canvas 120 FPS)   │
│  • SQL Editor: CodeMirror 6 (@codemirror/lang-sql)          │
│  • UI System: Tailwind CSS v4 + Lucide Icons                │
│  • State: Zustand (Dirty Delta Tracker, Connection Tree)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Typed IPC (Fast Binary Stream)
┌──────────────────────────────▼──────────────────────────────┐
│                    NATIVE SHELL: Tauri v2                   │
│         (macOS WebKit runtime, binary ~20MB, RAM ~50MB)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     BACKEND CORE (Rust)                     │
│  • DB Drivers: sqlx (PostgreSQL, MySQL, SQLite)             │
│  • Redis Driver: redis-rs (tokio async)                     │
│  • SSH Tunneling: russh / ssh2                              │
│  • Data Streaming: tokio-stream                             │
│  • Schema In-Memory Indexer: Radix Trie + FK Graph          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📄 License
MIT © 2026 Khoa Nguyen & db-nerd Contributors.
