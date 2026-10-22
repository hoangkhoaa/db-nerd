# Architecture Blueprint — DBNerd 🤓 🗄️

This document details the high-performance system architecture of **DBNerd**, explaining how it achieves a **< 0.4s cold start**, **~50MB RAM footprint**, and **120 FPS data grid virtualization**.

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UI LAYER (TypeScript / React)            │
│  • Data Grid: @glideapps/glide-data-grid (HTML5 Canvas)     │
│  • SQL Editor: CodeMirror 6 with Lezer AST & Autocomplete   │
│  • UI System: Tailwind CSS v4 + Lucide Icons                │
│  • State: Zustand (Dirty Delta Tracker, Connection Tree)   │
│└──────────────────────────────┬──────────────────────────────┘
                                │ High-Speed IPC (Binary Stream / Arrow)
┌──────────────────────────────▼──────────────────────────────┐
│                    NATIVE SHELL: Tauri v2                   │
│         (macOS WebKit runtime, binary ~20MB, RAM ~50MB)     │
└──────────────────────────────┬──────────────────────────────┘
                                │ Native Rust System Calls
┌──────────────────────────────▼──────────────────────────────┐
│                     BACKEND CORE (Rust)                     │
│  • Connection Pool: sqlx (Postgres, MySQL, SQLite)          │
│  • Redis Engine: redis-rs (Tokio async)                     │
│  • SSH Tunneling: russh / ssh2 (Bastion Jump Hosts)         │
│  • Schema In-Memory Indexer: Radix Trie + Foreign Key Graph │
│  • Offline Local Storage: Embedded SQLite with FTS5         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Pillars of Performance

### A. The 50MB RAM Budget (No JVM, No Bundled Chromium)
* **Zero JVM Overhead:** Unlike Java-based clients that demand 1.5GB+ heap allocations and cause Garbage Collection (GC) pauses, DBNerd's backend is 100% native Rust with zero GC latency.
* **OS-Provided WebKit:** Tauri v2 reuses the system-level WebKit framework already resident in macOS memory, eliminating the 150MB+ footprint of an embedded Chromium browser.

### B. Canvas Virtualized Data Grid (120 FPS)
* Standard HTML table clients instantiate tens of thousands of DOM `<div>` nodes, causing severe layout thrashing and dropped frames.
* DBNerd draws table cells directly onto an **HTML5 Canvas using Apple Metal GPU acceleration**. Memory is proportional only to the visible viewport (typically ~40–50 visible rows), rendering millions of rows effortlessly.

### C. In-Memory Schema Indexer (< 0.8ms Autocomplete)
* Queries `information_schema` and `pg_constraint` exactly once on connection.
* Builds an **in-memory Radix Trie** for $O(k)$ prefix lookups.
* Constructs a **Foreign Key Dependency Graph** to intelligently predict `JOIN ... ON` constraints before you type them.

### D. Dirty Delta Tracking (Safe Atomic Commits)
* Cell edits are recorded in an in-memory delta map (`useDirtyStore`) rather than mutating base data structures directly.
* Edits can be discarded instantly or committed within an atomic SQL transaction:
  ```sql
  BEGIN;
  UPDATE user_orders SET status = 'refunded' WHERE id = 1035;
  COMMIT;
  ```

---

## 3. Directory Layout

```text
db-nerd/
├── src-tauri/               # Native Rust Backend Core
│   ├── Cargo.toml          # Rust dependencies (sqlx, tokio, tauri)
│   ├── tauri.conf.json     # Tauri window & DMG bundle configuration
│   └── src/
│       ├── main.rs         # Tauri application entry point
│       └── lib.rs          # Core command handlers & connection registry
├── src/                    # Frontend Presentation Layer (React + TS)
│   ├── components/
│   │   ├── layout/         # Titlebar, Sidebar, TabBar
│   │   ├── grid/           # Glide Data Grid canvas wrapper
│   │   ├── editor/         # CodeMirror 6 SQL editor & autocomplete
│   │   ├── connection/     # Connection manager & import wizards
│   │   └── stats/          # Instance observability & processlist
│   ├── stores/             # Zustand stores (connection, dirty state, tabs)
│   └── types/              # Typed contracts for connections & queries
├── docs/                   # Architectural & Developer Guides
├── media/                  # High-resolution screenshots & assets
└── docker-compose.yml      # Local isolated test databases (PG, MySQL, Redis)
```
