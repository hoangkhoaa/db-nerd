# Contributing to DBNerd 🤓

We welcome contributions from developers who care about native speed, clean code, and zero bloat!

---

## Code of Conduct & Values

1. **Performance Budget First:** Every PR must respect our core promise: **cold start < 0.4s** and **idle RAM ~50MB**. Avoid heavy third-party dependencies unless strictly justified.
2. **Native Craftsmanship:** Follow Apple Human Interface Guidelines and modern developer tool aesthetics (Linear/Raycast style).

---

## Development Workflow

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your modifications following our code formatting standards:
   ```bash
   pnpm lint
   cargo fmt --manifest-path src-tauri/Cargo.toml
   ```
3. Commit with Conventional Commits syntax:
   * `feat: add Snowflake OAuth login flow`
   * `fix: correct Redis TTL countdown edge case`
   * `perf: optimize schema trie construction`
4. Open a Pull Request on GitHub.
