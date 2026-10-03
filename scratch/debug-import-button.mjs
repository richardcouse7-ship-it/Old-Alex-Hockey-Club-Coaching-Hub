import { spawn } from 'child_process';
import http from 'http';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\Users\\richa\\.gemini\\antigravity\\brain\\ab2e7ad7-a0f5-4962-9062-8d7c3f933da0\\scratch\\test-chrome-profile-debug';
const PORT = 9335;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.consoleLogs = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        } else if (data.method === 'Runtime.consoleAPICalled') {
          this.consoleLogs.push({
            type: data.params.type,
            text: data.params.args.map((a) => a.value || a.description).join(' '),
          });
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }
}

async function run() {
  console.log('Launching Chrome on port', PORT);
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1440,900',
    ],
    { stdio: 'ignore' }
  );

  await wait(2000);

  try {
    const list = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = list.find((t) => t.type === 'page') || list[0];
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Page.navigate', { url: 'http://localhost:3000/' });

    await wait(3000);

    // 1. Test clicking "Import Weekly Schedule" in the Sidebar (from Dashboard tab!)
    console.log('--- Test 1: Sidebar Import Button Click ---');
    const sidebarClickResult = await client.evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('Import Weekly Schedule') || (b.title && b.title.includes('Import Weekly Schedule'))
      );
      if (!btn) return { error: 'Sidebar import button not found' };
      btn.click();
      return { clicked: true, text: btn.innerText.trim() };
    })()`);
    console.log('Sidebar click:', sidebarClickResult);
    await wait(1000);

    const modalState1 = await client.evaluate(`(() => {
      const modal = document.querySelector('[role="dialog"]');
      const title = modal?.querySelector('#import-modal-title, h2, h3')?.innerText;
      return {
        activeModal: window.__store.getState().activeModal,
        dialogPresent: modal !== null,
        title
      };
    })()`);
    console.log('Modal state after Sidebar click:', modalState1);

    // Close modal
    await client.evaluate(`window.__store.getState().closeModal()`);
    await wait(500);

    // 2. Test clicking "Import" on Sunday Timetable toolbar
    console.log('--- Test 2: Sunday Timetable Toolbar Import Button Click ---');
    await client.evaluate(`window.__store.getState().setCurrentTab('timetable')`);
    await wait(1000);

    const timetableClickResult = await client.evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.trim() === 'Import' && b.title && b.title.toLowerCase().includes('import')
      );
      if (!btn) return { error: 'Timetable toolbar import button not found' };
      btn.click();
      return { clicked: true, text: btn.innerText.trim() };
    })()`);
    console.log('Timetable click:', timetableClickResult);
    await wait(1000);

    const modalState2 = await client.evaluate(`(() => {
      const modal = document.querySelector('[role="dialog"]');
      const title = modal?.querySelector('#import-modal-title, h2, h3')?.innerText;
      return {
        activeModal: window.__store.getState().activeModal,
        dialogPresent: modal !== null,
        title
      };
    })()`);
    console.log('Modal state after Timetable click:', modalState2);

    // 3. Test clicking "Load Screenshot Master" inside the modal
    console.log('--- Test 3: Load Screenshot Master inside Modal ---');
    const loadSampleResult = await client.evaluate(`(() => {
      const sampleBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.innerText.includes('Load Screenshot Master')
      );
      if (!sampleBtn) return { error: 'Load Screenshot Master button not found' };
      sampleBtn.click();
      return { clicked: true };
    })()`);
    console.log('Load Sample click:', loadSampleResult);
    await wait(1000);

    const parsedModalState = await client.evaluate(`(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr')).length;
      const targetDateInput = document.querySelector('input[type="date"]')?.value;
      const confirmBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.innerText.includes('Confirm & Apply Schedule')
      );
      return {
        rowsParsedInTable: rows,
        targetDate: targetDateInput,
        confirmButtonEnabled: confirmBtn && !confirmBtn.disabled
      };
    })()`);
    console.log('Parsed Modal State:', parsedModalState);

    // Check console errors
    const errors = client.consoleLogs.filter(l => l.type === 'error');
    console.log('Console errors count:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }

    if (
      modalState1.dialogPresent &&
      modalState2.dialogPresent &&
      parsedModalState.rowsParsedInTable === 17 &&
      parsedModalState.confirmButtonEnabled &&
      errors.length === 0
    ) {
      console.log('SUCCESS: All Import flows verified with 0 errors!');
    } else {
      console.log('FAILED checks');
    }

  } finally {
    chromeProcess.kill();
  }
}

run().catch(console.error);
