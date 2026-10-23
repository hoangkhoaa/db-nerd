export interface SqlStatement {
  text: string;
  trimmedText: string;
  from: number;
  to: number;
  contentFrom: number;
  contentTo: number;
}

export function splitSqlStatements(sql: string): SqlStatement[] {
  const len = sql.length;
  if (!sql.trim()) return [];

  const statements: SqlStatement[] = [];
  let stmtStart = 0;
  let i = 0;

  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag: string | null = null;
  let hasFoundSemicolon = false;

  while (i < len) {
    const ch = sql[i];
    const next = i + 1 < len ? sql[i + 1] : '';

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      i++;
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    if (inSingleQuote) {
      if (ch === '\\' && i + 1 < len) {
        i += 2;
        continue;
      }
      if (ch === "'") {
        if (next === "'") {
          i += 2;
          continue;
        }
        inSingleQuote = false;
      }
      i++;
      continue;
    }

    if (inDoubleQuote) {
      if (ch === '\\' && i + 1 < len) {
        i += 2;
        continue;
      }
      if (ch === '"') {
        if (next === '"') {
          i += 2;
          continue;
        }
        inDoubleQuote = false;
      }
      i++;
      continue;
    }

    if (inBacktick) {
      if (ch === '`') inBacktick = false;
      i++;
      continue;
    }

    if (dollarTag !== null) {
      if (ch === '$' && sql.startsWith(dollarTag, i)) {
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      i++;
      continue;
    }

    // Normal code
    if (ch === '-' && next === '-') {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (ch === '#') {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      i++;
      continue;
    }
    if (ch === '"') {
      inDoubleQuote = true;
      i++;
      continue;
    }
    if (ch === '`') {
      inBacktick = true;
      i++;
      continue;
    }
    if (ch === '$') {
      const dollarMatch = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (dollarMatch) {
        dollarTag = dollarMatch[0];
        i += dollarTag.length;
        continue;
      }
    }

    if (ch === ';') {
      hasFoundSemicolon = true;
      const rawText = sql.slice(stmtStart, i + 1);
      const trimmed = rawText.trim();
      if (trimmed.length > 0 && trimmed !== ';') {
        const leadingWhitespace = rawText.search(/\S/);
        const lastNonWs = rawText.search(/\S\s*$/);
        const contentStart = leadingWhitespace >= 0 ? stmtStart + leadingWhitespace : stmtStart;
        const contentEnd = lastNonWs >= 0 ? stmtStart + lastNonWs + 1 : i + 1;
        statements.push({
          text: rawText,
          trimmedText: trimmed,
          from: stmtStart,
          to: i + 1,
          contentFrom: contentStart,
          contentTo: contentEnd,
        });
      }
      stmtStart = i + 1;
      i++;
      continue;
    }

    i++;
  }

  if (stmtStart < len) {
    const rawText = sql.slice(stmtStart);
    const trimmed = rawText.trim();
    if (trimmed.length > 0) {
      const leadingWhitespace = rawText.search(/\S/);
      const lastNonWs = rawText.search(/\S\s*$/);
      const contentStart = leadingWhitespace >= 0 ? stmtStart + leadingWhitespace : stmtStart;
      const contentEnd = lastNonWs >= 0 ? stmtStart + lastNonWs + 1 : len;
      statements.push({
        text: rawText,
        trimmedText: trimmed,
        from: stmtStart,
        to: len,
        contentFrom: contentStart,
        contentTo: contentEnd,
      });
    }
  }

  if (!hasFoundSemicolon && statements.length <= 1) {
    const paragraphStatements = splitByBlankLines(sql);
    if (paragraphStatements.length > 1) {
      return paragraphStatements;
    }
  }

  return statements;
}

function splitByBlankLines(sql: string): SqlStatement[] {
  const result: SqlStatement[] = [];
  const regex = /(?:^|\n\s*\n)([\s\S]+?)(?=(?:\n\s*\n)|$)/g;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const fullMatch = match[0];
    const content = match[1];
    const trimmed = content.trim();
    if (trimmed.length > 0) {
      const matchIndex = match.index + (fullMatch.length - content.length);
      const leadingWs = content.search(/\S/);
      const lastNonWs = content.search(/\S\s*$/);
      result.push({
        text: content,
        trimmedText: trimmed,
        from: matchIndex,
        to: matchIndex + content.length,
        contentFrom: matchIndex + (leadingWs >= 0 ? leadingWs : 0),
        contentTo: matchIndex + (lastNonWs >= 0 ? lastNonWs + 1 : content.length),
      });
    }
  }
  return result;
}

export interface TargetQuery {
  query: string;
  isSelection: boolean;
  from?: number;
  to?: number;
  statementIndex?: number;
  totalStatements?: number;
}

export function getQueryToExecute(
  doc: string,
  selectionFrom: number,
  selectionTo: number
): TargetQuery {
  // 1. If selection exists
  if (selectionFrom !== selectionTo) {
    const start = Math.min(selectionFrom, selectionTo);
    const end = Math.max(selectionFrom, selectionTo);
    const selected = doc.slice(start, end).trim();
    if (selected.length > 0) {
      return {
        query: selected,
        isSelection: true,
        from: start,
        to: end,
      };
    }
  }

  // 2. Cursor based
  const statements = splitSqlStatements(doc);
  if (statements.length === 0) {
    return {
      query: doc.trim(),
      isSelection: false,
    };
  }

  if (statements.length === 1) {
    return {
      query: statements[0].trimmedText,
      isSelection: false,
      from: statements[0].contentFrom,
      to: statements[0].contentTo,
      statementIndex: 0,
      totalStatements: 1,
    };
  }

  const cursorPos = selectionTo;

  for (let i = 0; i < statements.length; i++) {
    const cur = statements[i];
    const next = statements[i + 1];

    if (cursorPos >= cur.contentFrom && cursorPos <= cur.to) {
      return {
        query: cur.trimmedText,
        isSelection: false,
        from: cur.contentFrom,
        to: cur.contentTo,
        statementIndex: i,
        totalStatements: statements.length,
      };
    }

    if (next && cursorPos > cur.to && cursorPos < next.contentFrom) {
      return {
        query: cur.trimmedText,
        isSelection: false,
        from: cur.contentFrom,
        to: cur.contentTo,
        statementIndex: i,
        totalStatements: statements.length,
      };
    }
  }

  if (cursorPos >= statements[statements.length - 1].to) {
    const last = statements[statements.length - 1];
    return {
      query: last.trimmedText,
      isSelection: false,
      from: last.contentFrom,
      to: last.contentTo,
      statementIndex: statements.length - 1,
      totalStatements: statements.length,
    };
  }

  const first = statements[0];
  return {
    query: first.trimmedText,
    isSelection: false,
    from: first.contentFrom,
    to: first.contentTo,
    statementIndex: 0,
    totalStatements: statements.length,
  };
}
