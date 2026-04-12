const { parentPort, workerData } = require('worker_threads');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: workerData.connectionString,
  ssl: workerData.disableSsl ? false : { rejectUnauthorized: false }
});

let txClient = null;
const responsePort = workerData.responsePort;

function convertSql(sql) {
  let index = 0;
  let converted = String(sql || '').replace(/\?/g, () => `$${++index}`);
  converted = converted.replace(/\bAUTOINCREMENT\b/gi, '');
  converted = converted.replace(/INTEGER PRIMARY KEY/gi, 'SERIAL PRIMARY KEY');
  converted = converted.replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  converted = converted.replace(/DATETIME/gi, 'TIMESTAMP');
  converted = converted.replace(/REAL/gi, 'DOUBLE PRECISION');
  converted = converted.replace(/INSERT OR REPLACE INTO attendance\s*\(\s*student_id\s*,\s*date\s*,\s*status\s*\)\s*VALUES\s*\(\s*\$1\s*,\s*\$2\s*,\s*\$3\s*\)/gi,
    'INSERT INTO attendance (student_id, date, status) VALUES ($1,$2,$3) ON CONFLICT (student_id, date) DO UPDATE SET status = EXCLUDED.status');
  converted = converted.replace(/date\('now',\s*'-6 day'\)/gi, "(CURRENT_DATE - INTERVAL '6 days')");
  converted = converted.replace(/datetime\('now',\s*'-6 day'\)/gi, "(CURRENT_TIMESTAMP - INTERVAL '6 days')");
  converted = converted.replace(/date\('now'\)/gi, 'CURRENT_DATE');
  converted = converted.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
  converted = converted.replace(/datetime\(MAX\(([^)]+)\)\)/gi, 'MAX($1)');
  converted = converted.replace(/datetime\(([^()]+)\)/gi, '$1');
  converted = converted.replace(/date\(([^()]+)\)/gi, 'DATE($1)');
  return converted;
}

function splitStatements(sql) {
  return String(sql || '')
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function execute(action, sql, params) {
  const runner = txClient || pool;
  if (action === 'exec') {
    for (const statement of splitStatements(sql)) {
      await runner.query(convertSql(statement));
    }
    return { ok: true };
  }

  if (action === 'begin') {
    txClient = await pool.connect();
    await txClient.query('BEGIN');
    return { ok: true };
  }

  if (action === 'commit') {
    if (txClient) {
      await txClient.query('COMMIT');
      txClient.release();
      txClient = null;
    }
    return { ok: true };
  }

  if (action === 'rollback') {
    if (txClient) {
      await txClient.query('ROLLBACK');
      txClient.release();
      txClient = null;
    }
    return { ok: true };
  }

  const convertedSql = convertSql(sql);

  if (action === 'run') {
    const isInsert = /^\s*insert\b/i.test(convertedSql);
    const finalSql = isInsert && !/\breturning\b/i.test(convertedSql)
      ? `${convertedSql} RETURNING id`
      : convertedSql;
    const result = await runner.query(finalSql, params || []);
    return {
      rows: result.rows || [],
      rowCount: result.rowCount || 0,
      lastInsertRowid: result.rows?.[0]?.id ?? null
    };
  }

  const result = await runner.query(convertedSql, params || []);
  return {
    rows: result.rows || [],
    rowCount: result.rowCount || 0
  };
}

parentPort.on('message', async (message) => {
  const { id, action, sql, params, shared } = message;
  const signal = new Int32Array(shared);
  try {
    const payload = await execute(action, sql, params);
    responsePort.postMessage({ id, ok: true, payload });
  } catch (error) {
    responsePort.postMessage({ id, ok: false, error: error.message || String(error) });
  } finally {
    Atomics.store(signal, 0, 1);
    Atomics.notify(signal, 0, 1);
  }
});
