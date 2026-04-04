/**
 * Default dot paths when actionConfig.sqlResponseLayout is "convention" (or unset).
 * Custom layout uses sqlPath* fields from the task actionConfig.
 */
export const SQL_API_RESPONSE_CONVENTION = {
  columns: 'data.columns',
  rows: 'data.rows',
  statusCode: 'code',
  message: 'message',
  /** Submit (and sometimes poll) response — override with sqlJobHandlePath when async */
  jobHandle: 'statementHandle',
};

/**
 * Resolved paths for reading columns, rows, status, and async handle from API JSON.
 * @param {object} [actionConfig] - task node actionConfig
 */
/**
 * Parse sqlPollDoneValues from textarea (newlines or commas).
 * @param {string} [raw]
 * @returns {string[]}
 */
export function parseSqlPollDoneValues(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function resolveSqlApiResponsePaths(actionConfig) {
  const custom = actionConfig?.sqlResponseLayout === 'custom';
  const jh =
    (actionConfig?.sqlJobHandlePath && String(actionConfig.sqlJobHandlePath).trim()) ||
    SQL_API_RESPONSE_CONVENTION.jobHandle;
  if (custom) {
    return {
      layout: 'custom',
      columns: (actionConfig?.sqlPathColumns || '').trim(),
      rows: (actionConfig?.sqlPathRows || '').trim(),
      statusCode: (actionConfig?.sqlPathStatusCode || '').trim(),
      statusOkValue: actionConfig?.sqlPathStatusOkValue,
      message: (actionConfig?.sqlPathMessage || '').trim(),
      jobHandle: jh,
    };
  }
  return {
    layout: 'convention',
    columns: SQL_API_RESPONSE_CONVENTION.columns,
    rows: SQL_API_RESPONSE_CONVENTION.rows,
    statusCode: SQL_API_RESPONSE_CONVENTION.statusCode,
    statusOkValue: undefined,
    message: SQL_API_RESPONSE_CONVENTION.message,
    jobHandle: jh,
  };
}
