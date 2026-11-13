/**
 * Whitelist de Sanse -> Google Sheet "Sanse — Whitelist"
 * https://docs.google.com/spreadsheets/d/1zy9TV57p-RSSJ9hINzlEZS09P54c0qMMNognXXmr7RU/edit
 *
 * Instalación:
 * 1. Abre el Sheet > Extensiones > Apps Script.
 * 2. Pega este archivo completo y guarda.
 * 3. Implementar > Nueva implementación > Tipo: Aplicación web.
 *    Ejecutar como: Yo. Quién tiene acceso: Cualquier persona.
 * 4. Copia la URL que termina en /exec y pégala en login.html (WHITELIST_URL).
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = (e && e.parameter) || {};
    const email = String(p.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) {
      return out({ ok: false, error: 'correo_invalido' });
    }
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const last = sheet.getLastRow();
    if (last > 1) {
      const existentes = sheet.getRange(2, 2, last - 1, 1).getValues().flat();
      if (existentes.indexOf(email) !== -1) return out({ ok: true, duplicado: true });
    }
    const origen = String(p.origen || '').slice(0, 300);
    sheet.appendRow([new Date(), email, origen]);
    return out({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
