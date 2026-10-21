# Database Drivers & Connection Guide — db-nerd 🤓

db-nerd provides first-class support for SQL, In-Memory NoSQL, and Cloud Data Warehouses out of the box.

---

## 1. Supported MVP Engines

| Engine | Driver / Rust Crate | Features |
| :--- | :--- | :--- |
| **PostgreSQL** (12 – 16+) | `sqlx` (`runtime-tokio-rustls`) | Async connection pooling, SSL/TLSv1.3, Unix domain sockets, JSONB tree viewer, `pg_stat_activity` process monitoring. |
| **MySQL** (5.7, 8.0 & MariaDB) | `sqlx` (`runtime-tokio-rustls`) | TCP & socket connections, Explain query plan, multi-result sets, user privileges inspection. |
| **Redis** (6.x – 7.x) | `redis-rs` + `tokio` | Hierarchical Key-Value browser (e.g. `user:1001:profile`), live TTL countdown, type inspector (`STRING`, `HASH`, `LIST`, `SET`, `ZSET`, `JSON`), cluster mode. |
| **Snowflake** | Snowflake SQL API / REST | Account identifier, Virtual Warehouse controls (`COMPUTE_WH`), Database & Schema hierarchy, Role switching (`SYSADMIN`), OAuth & Key-pair authentication. |

---

## 2. SSH Bastion & Tunneling

For databases running inside isolated VPCs (AWS RDS, GCP Cloud SQL, private on-premise servers), db-nerd supports direct SSH tunneling through Bastion jump hosts:

* **Authentication Modes:**
  * Password
  * Private Key (RSA, Ed25519, ECDSA)
  * macOS SSH Agent (`SSH_AUTH_SOCK`)
* **Tunnel Lifecycle:** The tunnel socket is managed asynchronously in the background by the Rust core, with automatic heartbeat keep-alive and exponential backoff reconnection.

---

## 3. Environment Protection (Safe Mode)

To safeguard production data:
* **🔴 Production Group (PROD):**
  * Displays a prominent luminous red indicator on the titlebar and status bar.
  * Prompts for explicit user confirmation before executing any `UPDATE` or `DELETE` statement lacking a `WHERE` clause, or any destructive DDL (`DROP`, `TRUNCATE`, `ALTER TABLE`).
* **🟡 Staging Group (QA):**
  * Warns on high-impact queries.
* **🟢 Local Development (DEV):**
  * Zero confirmations for instant feedback loops.
