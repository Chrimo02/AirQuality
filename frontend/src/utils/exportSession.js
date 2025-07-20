// src/utils/exportSession.js
export function exportSessionData(rows, format = 'csv') {
  if (!rows || !rows.length) return;

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `session_data_${Date.now()}.json`);
    return;
  }

  // CSV
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => r[h] ?? '').join(','))
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `session_data_${Date.now()}.csv`);
}

function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
