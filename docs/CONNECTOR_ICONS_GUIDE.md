# DBNerd Database Connector Icons Guide

This guide defines the design system, asset conventions, and AI agent prompts for generating database connector icons in **DBNerd** matching Apple macOS squircle aesthetics (inspired by TablePlus).

---

## 1. Directory & File Organization

All database connector icons are arranged under:
```
public/connectors/
├── postgres.png          # PostgreSQL
├── redshift.svg          # Amazon Redshift
├── mysql.png             # MySQL
├── mariadb.svg           # MariaDB & SingleStore
├── sqlserver.png         # Microsoft SQL Server
├── cassandra.svg         # Apache Cassandra
├── clickhouse.png        # ClickHouse
├── bigquery.svg          # Google BigQuery
├── dynamodb.svg          # AWS DynamoDB
├── elasticsearch.svg     # Elasticsearch
├── libsql.svg            # LibSQL / Turso
├── cloudflare_d1.svg     # Cloudflare D1
├── mongodb.png           # MongoDB
├── snowflake.png         # Snowflake
├── redis.png             # Redis
├── sqlite.png            # SQLite
├── duckdb.png            # DuckDB
├── oracle.svg            # Oracle Database
├── cockroach.svg         # CockroachDB
├── greenplum.svg         # Greenplum
├── vertica.svg           # Vertica
└── generic.png           # Fallback / Generic Database
```

---

## 2. Design System Specifications

| Attribute | Specification |
| :--- | :--- |
| **Shape** | macOS Squircle (superellipse, `rx="22"` on a 100x100 viewBox) |
| **Aspect Ratio** | `1:1` square |
| **Style** | 3D stylized, glassmorphism, subtle neon glow, dark navy/slate backdrop |
| **Shadows & Glare** | Soft top glass specular glare + subtle bottom drop-shadow |
| **Framing** | No surrounding laptop, phone, or monitor frames; pure icon art |
| **Text** | No labels or typography inside the icon graphic itself |

---

## 3. Agent Prompt Formula for Generating New Connectors

When generating new database connector icons using AI tools (Imagen, Midjourney, Gemini Image Gen):

### The Standard Prompt Formula:
```text
Square app icon for [DATABASE_NAME] database connector, macOS style, sleek 3D stylized [SUBJECT / MOTIF], modern glassmorphism, vibrant [PRIMARY_COLOR] and [SECONDARY_COLOR], dark navy squircle background, no external frames, no device mockups, no text, clean minimalist icon asset, 1:1 aspect ratio
```

### Prompt Examples by Connector:

* **PostgreSQL (`postgres`)**:
  > `Square app icon for PostgreSQL database connector, macOS style, sleek 3D stylized neon elephant head with glowing sapphire tusks, modern glassmorphism, vibrant electric blue and cyan, dark navy squircle background, no external frames, no text, clean minimalist icon asset, 1:1 aspect ratio`

* **MySQL (`mysql`)**:
  > `Square app icon for MySQL database connector, macOS style, sleek 3D stylized jumping dolphin, modern glassmorphism, iridescent turquoise and gold accents, dark navy squircle background, no external frames, no text, clean minimalist icon asset, 1:1 aspect ratio`

* **Redis (`redis`)**:
  > `Square app icon for Redis database connector, macOS style, sleek 3D stacked layered ruby crystal cube, glowing crimson core, modern glassmorphism, vibrant scarlet and neon red, dark navy squircle background, no external frames, no text, clean minimalist icon asset, 1:1 aspect ratio`

* **ClickHouse (`clickhouse`)**:
  > `Square app icon for ClickHouse database connector, macOS style, sleek 3D vertical audio equalizer volume bars, glowing amber and lemon yellow, modern glassmorphism, dark navy squircle background, no external frames, no text, clean minimalist icon asset, 1:1 aspect ratio`

* **DuckDB (`duckdb`)**:
  > `Square app icon for DuckDB database connector, macOS style, sleek 3D stylized cyber yellow duck head wearing futuristic glowing sunglasses, modern glassmorphism, vibrant neon yellow and orange, dark navy squircle background, no external frames, no text, clean minimalist icon asset, 1:1 aspect ratio`

* **Snowflake (`snowflake`)**:
  > `Square app icon for Snowflake data warehouse connector, macOS style, sleek 3D geometric icy crystalline snowflake, modern glassmorphism, vibrant cyan and frosty white glow, dark navy squircle background, no external frames, no text, clean minimalist icon asset, 1:1 aspect ratio`

* **SQLite (`sqlite`)**:
  > `Square app icon for SQLite database connector, macOS style, sleek 3D sapphire glowing feather quill embedded in blue pill capsule, modern glassmorphism, vibrant royal blue and soft cyan, dark navy squircle background, no external frames, no text, clean minimalist icon asset, 1:1 aspect ratio`

* **MongoDB (`mongodb`)**:
  > `Square app icon for MongoDB database connector, macOS style, sleek 3D emerald jade glowing leaf flame, modern glassmorphism, vibrant forest green and neon lime, dark navy squircle background, no external frames, no text, clean minimalist icon asset, 1:1 aspect ratio`

* **Microsoft SQL Server (`sqlserver`)**:
  > `Square app icon for Microsoft SQL Server database connector, macOS style, sleek 3D cylindrical database stack with crimson neon rings, modern glassmorphism, vibrant Microsoft red and dark chrome, dark navy squircle background, no external frames, no text, clean minimalist icon asset, 1:1 aspect ratio`

* **Generic Database (`generic`)**:
  > `Square app icon for generic database server connector, macOS style, sleek 3D titanium server cylinder rack with emerald ring lights, modern glassmorphism, vibrant teal and steel silver, dark navy squircle background, no external frames, no text, clean minimalist icon asset, 1:1 aspect ratio`

---

## 4. Vector SVG Fallback Template

If image generation quota is restricted or pure vector scaling is preferred, create an SVG in `public/connectors/<engine_id>.svg` following this structure:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    
    <!-- Accent Motif Gradient -->
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    
    <!-- Glass Highlight -->
    <linearGradient id="glass" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    
    <!-- Soft Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- macOS Squircle Body -->
  <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#bg)" stroke="#334155" stroke-width="1.5"/>

  <!-- Centered Motif / Icon -->
  <g filter="url(#glow)">
    <!-- Custom connector vector paths here -->
  </g>

  <!-- Specular Glass Highlight -->
  <path d="M 2 24 C 2 11.8 11.8 2 24 2 L 76 2 C 88.2 2 98 11.8 98 24 L 98 42 C 60 50 40 32 2 48 Z" fill="url(#glass)"/>
</svg>
```

---

## 5. Integrating a New Connector in Code

When a new database connector is added:

1. **Add Asset**: Save file to `public/connectors/<engine_id>.png` (or `.svg`).
2. **Update Type**: Add the engine ID to `src/types/index.ts`:
   ```ts
   export type DatabaseEngine = 'postgres' | 'mysql' | ... | '<new_engine>' | (string & {});
   ```
3. **Register Metadata**: In `src/components/ConnectorIcon.tsx`:
   ```ts
   export const CONNECTOR_METADATA: Record<string, ConnectorMetadata> = {
     // ...
     new_engine: {
       id: 'new_engine',
       label: 'New Engine Label',
       iconSrc: '/connectors/new_engine.png',
       tag: 'Ne',
       defaultPort: 1234,
       category: 'sql', // 'sql' | 'nosql' | 'cloud' | 'embedded'
     },
   };
   ```
4. **Add to Display Catalog**: Add `CONNECTOR_METADATA.new_engine` to `ALL_TABLEPLUS_CONNECTORS` array in `ConnectorIcon.tsx`.
