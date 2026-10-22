import React from 'react';

export interface ConnectorIconProps {
  engine: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

export interface ConnectorMetadata {
  id: string;
  label: string;
  iconSrc: string;
  tag: string;
  defaultPort: number;
  category: 'sql' | 'nosql' | 'cloud' | 'embedded';
}

export const CONNECTOR_METADATA: Record<string, ConnectorMetadata> = {
  postgres: { id: 'postgres', label: 'PostgreSQL', iconSrc: '/connectors/postgres.png', tag: 'Pg', defaultPort: 5432, category: 'sql' },
  postgresql: { id: 'postgres', label: 'PostgreSQL', iconSrc: '/connectors/postgres.png', tag: 'Pg', defaultPort: 5432, category: 'sql' },
  mysql: { id: 'mysql', label: 'MySQL', iconSrc: '/connectors/mysql.png', tag: 'Ms', defaultPort: 3306, category: 'sql' },
  redis: { id: 'redis', label: 'Redis', iconSrc: '/connectors/redis.png', tag: 'Re', defaultPort: 6379, category: 'nosql' },
  snowflake: { id: 'snowflake', label: 'Snowflake', iconSrc: '/connectors/snowflake.png', tag: 'Nf', defaultPort: 443, category: 'cloud' },
  sqlite: { id: 'sqlite', label: 'SQLite', iconSrc: '/connectors/sqlite.png', tag: 'Sl', defaultPort: 0, category: 'embedded' },
  mongodb: { id: 'mongodb', label: 'MongoDB', iconSrc: '/connectors/mongodb.png', tag: 'Mg', defaultPort: 27017, category: 'nosql' },
  duckdb: { id: 'duckdb', label: 'DuckDB', iconSrc: '/connectors/duckdb.png', tag: 'Du', defaultPort: 0, category: 'embedded' },
  clickhouse: { id: 'clickhouse', label: 'ClickHouse', iconSrc: '/connectors/clickhouse.png', tag: 'Ch', defaultPort: 8123, category: 'sql' },
  sqlserver: { id: 'sqlserver', label: 'Microsoft SQL Server', iconSrc: '/connectors/sqlserver.png', tag: 'Ss', defaultPort: 1433, category: 'sql' },
  mssql: { id: 'sqlserver', label: 'Microsoft SQL Server', iconSrc: '/connectors/sqlserver.png', tag: 'Ss', defaultPort: 1433, category: 'sql' },
  redshift: { id: 'redshift', label: 'Amazon Redshift', iconSrc: '/connectors/redshift.svg', tag: 'Rs', defaultPort: 5439, category: 'cloud' },
  mariadb: { id: 'mariadb', label: 'MariaDB & SingleStore', iconSrc: '/connectors/mariadb.svg', tag: 'Ma', defaultPort: 3306, category: 'sql' },
  cassandra: { id: 'cassandra', label: 'Cassandra', iconSrc: '/connectors/cassandra.svg', tag: 'Cs', defaultPort: 9042, category: 'nosql' },
  bigquery: { id: 'bigquery', label: 'BigQuery', iconSrc: '/connectors/bigquery.svg', tag: 'Bq', defaultPort: 443, category: 'cloud' },
  dynamodb: { id: 'dynamodb', label: 'DynamoDB (Beta)', iconSrc: '/connectors/dynamodb.svg', tag: 'Dn', defaultPort: 8000, category: 'nosql' },
  elasticsearch: { id: 'elasticsearch', label: 'Elasticsearch', iconSrc: '/connectors/elasticsearch.svg', tag: 'Es', defaultPort: 9200, category: 'nosql' },
  libsql: { id: 'libsql', label: 'LibSQL', iconSrc: '/connectors/libsql.svg', tag: 'Ls', defaultPort: 8080, category: 'embedded' },
  cloudflare_d1: { id: 'cloudflare_d1', label: 'Cloudflare D1', iconSrc: '/connectors/cloudflare_d1.svg', tag: 'D1', defaultPort: 8787, category: 'cloud' },
  oracle: { id: 'oracle', label: 'Oracle', iconSrc: '/connectors/oracle.svg', tag: 'Oc', defaultPort: 1521, category: 'sql' },
  cockroach: { id: 'cockroach', label: 'CockroachDB', iconSrc: '/connectors/cockroach.svg', tag: 'Cr', defaultPort: 26257, category: 'sql' },
  greenplum: { id: 'greenplum', label: 'Greenplum', iconSrc: '/connectors/greenplum.svg', tag: 'Gp', defaultPort: 5432, category: 'sql' },
  vertica: { id: 'vertica', label: 'Vertica', iconSrc: '/connectors/vertica.svg', tag: 'Ve', defaultPort: 5433, category: 'sql' },
  generic: { id: 'generic', label: 'Generic Database', iconSrc: '/connectors/generic.png', tag: 'Db', defaultPort: 5432, category: 'sql' },
};

/**
 * Full List of TablePlus-style connectors in display order
 */
export const ALL_TABLEPLUS_CONNECTORS: ConnectorMetadata[] = [
  CONNECTOR_METADATA.postgres,
  CONNECTOR_METADATA.redshift,
  CONNECTOR_METADATA.mysql,
  CONNECTOR_METADATA.mariadb,
  CONNECTOR_METADATA.sqlserver,
  CONNECTOR_METADATA.cassandra,
  CONNECTOR_METADATA.clickhouse,
  CONNECTOR_METADATA.bigquery,
  CONNECTOR_METADATA.dynamodb,
  CONNECTOR_METADATA.elasticsearch,
  CONNECTOR_METADATA.libsql,
  CONNECTOR_METADATA.cloudflare_d1,
  CONNECTOR_METADATA.mongodb,
  CONNECTOR_METADATA.snowflake,
  CONNECTOR_METADATA.redis,
  CONNECTOR_METADATA.sqlite,
  CONNECTOR_METADATA.duckdb,
  CONNECTOR_METADATA.oracle,
  CONNECTOR_METADATA.cockroach,
  CONNECTOR_METADATA.greenplum,
  CONNECTOR_METADATA.vertica,
];

export const ConnectorIcon: React.FC<ConnectorIconProps> = ({
  engine,
  size = 'md',
  className = '',
  alt,
}) => {
  const normalized = (engine || 'generic').toLowerCase();
  const meta = CONNECTOR_METADATA[normalized] || CONNECTOR_METADATA.generic;

  const sizeClasses = {
    xs: 'w-3.5 h-3.5 rounded',
    sm: 'w-5 h-5 rounded-md',
    md: 'w-7 h-7 rounded-lg',
    lg: 'w-9 h-9 rounded-xl',
    xl: 'w-12 h-12 rounded-2xl',
  }[size];

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
      <img
        src={meta.iconSrc}
        alt={alt || meta.label}
        className="w-full h-full object-contain rounded-[inherit] select-none pointer-events-none drop-shadow-sm"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/connectors/generic.png';
        }}
      />
    </div>
  );
};
