# Development & Testing Guide — db-nerd 🤓

This guide explains how to set up, develop, and test db-nerd locally on macOS.

---

## Prerequisites

Ensure you have the following toolchains installed:
* **Node.js:** `>= v20` (v24 recommended)
* **Package Manager:** `pnpm >= v10`
* **Rust:** `>= 1.80` (`rustc` & `cargo`)
* **Docker & Docker Compose** (for test database containers)

---

## 1. Quickstart Development Setup

### Step A: Clone & Install Dependencies
```bash
cd /Users/khoa.nguyen/Workings/Personal/db-nerd
pnpm install
```

### Step B: Launch Test Databases
Spin up isolated PostgreSQL, MySQL, and Redis test databases with a single command:
```bash
docker compose up -d
```

Verify containers are running:
```bash
docker compose ps
```

| Container | Host / Port | Default Credentials |
| :--- | :--- | :--- |
| **PostgreSQL** | `localhost:5432` | user: `dev_user`, pass: `dev_password`, db: `ecom_prod_db` |
| **MySQL** | `localhost:3306` | user: `dev_user`, pass: `dev_password`, db: `analytics_staging` |
| **Redis** | `localhost:6379` | (no password) |

---

## 2. Running in Hot-Reload Development Mode

To launch the native desktop application with instant Vite Hot Module Replacement (HMR):
```bash
pnpm tauri dev
```

* **Frontend Changes (`src/**/*.tsx`):** Hot-reloaded in `< 50ms` without restarting the window.
* **Rust Backend Changes (`src-tauri/**/*.rs`):** Incrementally compiled by Cargo in `~2–3s`.

---

## 3. Automated Testing

### Test Frontend Components:
```bash
pnpm test
```

### Test Rust Backend Drivers & Pool:
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

---

## 4. Packaging the Native macOS `.dmg` Installer

When releasing a new build:

```bash
# Build for Apple Silicon (M1/M2/M3/M4):
pnpm tauri build

# Build Universal Binary (Intel + Apple Silicon):
pnpm tauri build --target universal-apple-darwin
```

The resulting release artifacts will be saved at:
* **DMG Installer:** `src-tauri/target/release/bundle/dmg/db-nerd_0.1.0_aarch64.dmg`
* **Application Bundle:** `src-tauri/target/release/bundle/macos/db-nerd.app`
