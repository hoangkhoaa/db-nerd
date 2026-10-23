import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const MEDIA_DIR = path.join(REPO_ROOT, 'media');

async function main() {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }

  const chromePath =
    process.env.CHROME_BIN ||
    (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : 'google-chrome');

  const chromeProcess = spawn(
    chromePath,
    [
      '--headless=new',
      '--remote-debugging-port=9227',
      '--no-sandbox',
      '--disable-gpu',
      '--window-size=1360,860',
      'http://localhost:1420',
    ],
    { stdio: 'ignore' }
  );

  const cleanup = () => {
    try {
      chromeProcess.kill();
    } catch (e) {}
  };
  process.on('exit', cleanup);

  console.log('Connecting to Chrome CDP on port 9227...');
  await new Promise((r) => setTimeout(r, 2000));

  let versionData;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9227/json/version');
      versionData = await res.json();
      break;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!versionData) {
    console.error('Failed to connect to Chrome on 9227');
    cleanup();
    process.exit(1);
  }

  const listRes = await fetch('http://127.0.0.1:9227/json/list');
  const pages = await listRes.json();
  const page = pages.find((p) => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const resolver = pending.get(msg.id);
      pending.delete(msg.id);
      resolver(msg.result);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise((resolve) => {
    if (ws.readyState === WebSocket.OPEN) resolve();
    else ws.onopen = resolve;
  });

  console.log('Initializing CDP protocols...');
  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1360,
    height: 860,
    deviceScaleFactor: 2, // Retina 2x high-res
    mobile: false,
  });

  const capture = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      const filePath = path.join(MEDIA_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`✅ Saved: ${filePath} (${(res.data.length / 1024).toFixed(0)} KB base64)`);
    }
  };

  const evalJs = async (fnString) => {
    const res = await send('Runtime.evaluate', {
      expression: `(${fnString})()`,
      returnByValue: true,
      awaitPromise: true,
    });
    return res && res.result ? res.result.value : null;
  };

  // Wait for initial render
  await new Promise((r) => setTimeout(r, 2000));

  // ==========================================
  // 1. HERO PREVIEW: SQL Studio in Dark Mode
  // ==========================================
  console.log('\n--- 1. Capturing Studio Preview (Hero) ---');
  await evalJs(`() => {
    const store = window.__APP_STORE__?.getState?.();
    if (store) {
      document.documentElement.classList.add('dark');
      store.setThemeMode('dark');
      store.closeAllModals?.();
      // Ensure right inspector is open
      if (!store.isRightInspectorOpen) store.toggleRightInspector();
      // Ensure sidebar is open
      if (!store.isSidebarOpen) store.toggleSidebar();
      // Open SQL tab
      const sqlTab = store.tabs.find(t => t.type === 'sql');
      if (sqlTab) store.setActiveTabId(sqlTab.id);
      else store.openNewQueryTab();
    }
  }`);
  await new Promise((r) => setTimeout(r, 800));
  await capture('studio-preview.png');

  // =========================================================================
  // 2. INLINE CELL EDITING & AUTO UPDATE QUERY MODAL (Latest feature!)
  // =========================================================================
  console.log('\n--- 2. Capturing Inline Cell Editing & UPDATE Modal ---');
  await evalJs(`() => {
    const cells = Array.from(document.querySelectorAll('td'));
    const targetCell = cells.find(td => td.textContent && td.textContent.includes('sarah.connor@cyberdyne.net'));
    if (targetCell) {
      targetCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    }
  }`);
  await new Promise((r) => setTimeout(r, 500));

  await evalJs(`() => {
    const input = document.querySelector('input:focus') || document.querySelector('input[type="text"]');
    if (input) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, 'sarah.connor@resistance.mil');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    }
  }`);
  await new Promise((r) => setTimeout(r, 600));

  await evalJs(`() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const reviewBtn = buttons.find(b => b.textContent && b.textContent.includes('Review & Execute SQL'));
    if (reviewBtn) reviewBtn.click();
  }`);
  await new Promise((r) => setTimeout(r, 800));
  await capture('inline-edit-modal.png');

  // Close the modal
  await evalJs(`() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const cancelBtn = buttons.find(b => b.textContent && b.textContent.includes('Cancel (Esc)'));
    if (cancelBtn) cancelBtn.click();
  }`);
  await new Promise((r) => setTimeout(r, 500));

  // ==========================================
  // 3. TABLE CANVAS DATA GRID VIEW
  // ==========================================
  console.log('\n--- 3. Capturing Table Data Grid View ---');
  await evalJs(`() => {
    const store = window.__APP_STORE__?.getState?.();
    if (store) {
      store.openTableGridTab('user_orders');
      if (!store.isFilterBarOpen) store.toggleFilterBar();
      store.setFilterWhereText("status = 'shipped' AND total_amount > 50");
      store.setFilterOrderByText("id DESC");
    }
  }`);
  await new Promise((r) => setTimeout(r, 800));
  await capture('table-grid-view.png');

  // ==========================================
  // 4. CONNECTION MANAGER & SSH BASTION
  // ==========================================
  console.log('\n--- 4. Capturing Connection Manager Modal ---');
  await evalJs(`() => {
    const store = window.__APP_STORE__?.getState?.();
    if (store) {
      store.setConnectionModalOpen(true);
    }
  }`);
  await new Promise((r) => setTimeout(r, 500));

  // Expand SSH Bastion section and scroll down slightly
  await evalJs(`() => {
    const checkbox = Array.from(document.querySelectorAll('input[type="checkbox"]')).find(cb => {
      return cb.parentElement && cb.parentElement.textContent.includes('SSH Bastion');
    });
    if (checkbox && !checkbox.checked) {
      checkbox.click();
    }
    const rightPanel = document.querySelector('.overflow-y-auto');
    if (rightPanel) rightPanel.scrollBy({ top: 160, behavior: 'instant' });
  }`);
  await new Promise((r) => setTimeout(r, 800));
  await capture('connection-manager.png');

  // Close Connection Modal
  await evalJs(`() => {
    const store = window.__APP_STORE__?.getState?.();
    if (store) store.setConnectionModalOpen(false);
  }`);
  await new Promise((r) => setTimeout(r, 500));

  // ==========================================
  // 5. PRODUCTION SAFE MODE & CONFIRMATION
  // ==========================================
  console.log('\n--- 5. Capturing Safe Mode Safeguard ---');
  await evalJs(`() => {
    const store = window.__APP_STORE__?.getState?.();
    if (store) {
      store.setConnectionSafeMode(store.activeConnection.id, 'safe-2');
      const sql = "DELETE FROM user_orders WHERE status = 'cancelled';";
      store.openNewQueryTab(sql);
      store.runSqlQuery(store.activeTabId, sql);
    }
  }`);
  await new Promise((r) => setTimeout(r, 800));
  await capture('safe-mode-production.png');

  // Cancel Safe Mode action
  await evalJs(`() => {
    const store = window.__APP_STORE__?.getState?.();
    if (store) store.cancelSafetyAction();
  }`);
  await new Promise((r) => setTimeout(r, 500));

  // ==========================================
  // 6. QUERY HISTORY & AUDIT LOG
  // ==========================================
  console.log('\n--- 6. Capturing Query History Modal ---');
  await evalJs(`() => {
    const store = window.__APP_STORE__?.getState?.();
    if (store) store.setHistoryModalOpen(true);
  }`);
  await new Promise((r) => setTimeout(r, 800));
  await capture('query-history.png');

  // Close Query History Modal
  await evalJs(`() => {
    const store = window.__APP_STORE__?.getState?.();
    if (store) store.setHistoryModalOpen(false);
  }`);
  await new Promise((r) => setTimeout(r, 500));

  // ==========================================
  // 7. OBSERVABILITY & ACTIVITY MONITOR
  // ==========================================
  console.log('\n--- 7. Capturing Observability Dashboard ---');
  await evalJs(`() => {
    const store = window.__APP_STORE__?.getState?.();
    if (store) {
      store.setActiveTab('stats');
      store.openAllTableStatsTab();
    }
  }`);
  await new Promise((r) => setTimeout(r, 800));
  await capture('observability-dashboard.png');

  // ==========================================
  // 8. LIGHT MODE (TablePlus macOS Elegance)
  // ==========================================
  console.log('\n--- 8. Capturing Light Mode ---');
  await evalJs(`() => {
    const store = window.__APP_STORE__?.getState?.();
    if (store) {
      document.documentElement.classList.remove('dark');
      store.setThemeMode('light');
      const sqlTab = store.tabs.find(t => t.type === 'sql');
      if (sqlTab) store.setActiveTabId(sqlTab.id);
    }
  }`);
  await new Promise((r) => setTimeout(r, 800));
  await capture('light-mode.png');

  // Restore dark mode for dev
  await evalJs(`() => {
    const store = window.__APP_STORE__?.getState?.();
    if (store) {
      document.documentElement.classList.add('dark');
      store.setThemeMode('dark');
    }
  }`);

  console.log('\n🎉 All real app snapshots captured successfully into media/!\n');
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
