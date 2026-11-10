/**
 * Meridian School MyClassboard (MCB) Fixed Asset Automation Runner
 * Injected script for: meridian.myclassboard.com/Home/Inventory
 * 
 * Works without Python! Can run via:
 * 1. Bookmarklet
 * 2. Chrome/Edge Extension
 * 3. Browser DevTools Console
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (document.getElementById('mcb-asset-automation-hud')) {
    alert('MCB Asset Automation Assistant is already active on this page!');
    return;
  }

  // Predefined Item Types based on video analysis & Meridian inventory standard
  const ITEM_TYPES = [
    { label: 'Student Tables', code: 'ST', mcbText: 'STUDENT TABLES', cat: 'FURNITURES', defaultUom: 'Nos' },
    { label: 'Student Chairs', code: 'SC', mcbText: 'STUDENT CHAIRS', cat: 'FURNITURES', defaultUom: 'Nos' },
    { label: 'Executive Chairs', code: 'EC', mcbText: 'EXECUTIVE CHAIRS', cat: 'FURNITURES', defaultUom: 'Nos' },
    { label: 'Executive Tables', code: 'ET', mcbText: 'EXECUTIVE TABLES', cat: 'FURNITURES', defaultUom: 'Nos' },
    { label: 'Visitor Chairs', code: 'VC', mcbText: 'VISITOR CHAIRS', cat: 'FURNITURES', defaultUom: 'Nos' },
    { label: 'Green / White Boards', code: 'BD', mcbText: 'BOARDS', cat: 'FURNITURES', defaultUom: 'Nos' },
    { label: 'Teacher Table', code: 'TT', mcbText: 'TEACHER TABLES', cat: 'FURNITURES', defaultUom: 'Nos' },
    { label: 'Cupboard / Almirah', code: 'CP', mcbText: 'CUPBOARDS', cat: 'FURNITURES', defaultUom: 'Nos' }
  ];

  // Helper sleep function
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Helper to trigger events (React/Vue/Angular/Select2/jQuery safe)
  function setNativeValue(element, value) {
    if (!element) return;
    const lastValue = element.value;
    element.value = value;
    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);
    const changeEvent = new Event('change', { bubbles: true });
    element.dispatchEvent(changeEvent);

    // If jQuery or Select2 is present
    if (window.jQuery && window.jQuery(element).length) {
      window.jQuery(element).val(value).trigger('change');
    }
  }

  // Helper to find select option by text
  function selectOptionByText(selectEl, textSubstr) {
    if (!selectEl) return false;
    const target = textSubstr.trim().toLowerCase();
    for (let i = 0; i < selectEl.options.length; i++) {
      const opt = selectEl.options[i];
      if (opt.text.toLowerCase().includes(target) || opt.value.toLowerCase().includes(target)) {
        selectEl.selectedIndex = i;
        setNativeValue(selectEl, opt.value);
        return true;
      }
    }
    return false;
  }

  // Helper to scan table and find last numbers
  function scanTableForLastNumbers(grade, section, typeCode) {
    const rows = document.querySelectorAll('table tbody tr');
    let maxUnit = 0;
    let maxGlobalId = 0;
    let matchedItems = [];

    // Pattern: MM/<grade><sec>-<unit>/FURN/<typeCode>/<globalId>
    // Example: MM/3d-05/FURN/ST/477 or MM/3C-28/FURN/ST/472
    const targetRoomStr = `${grade}${section}`.toLowerCase();

    rows.forEach((row) => {
      const text = row.innerText || '';
      // Look for MM/...
      const matches = text.match(/MM\/([0-9A-Za-z]+)-(\d+)\/([A-Za-z]+)\/([A-Za-z]+)\/(\d+)/g);
      if (matches) {
        matches.forEach((itemStr) => {
          const parts = itemStr.match(/MM\/([0-9A-Za-z]+)-(\d+)\/([A-Za-z]+)\/([A-Za-z]+)\/(\d+)/);
          if (parts) {
            const room = parts[1].toLowerCase();
            const unit = parseInt(parts[2], 10);
            const cat = parts[3];
            const type = parts[4].toUpperCase();
            const globalId = parseInt(parts[5], 10);

            if (globalId > maxGlobalId) {
              maxGlobalId = globalId;
            }

            if (room === targetRoomStr && (!typeCode || type === typeCode.toUpperCase())) {
              matchedItems.push({ itemStr, unit, globalId });
              if (unit > maxUnit) {
                maxUnit = unit;
              }
            }
          }
        });
      }
    });

    return { maxUnit, maxGlobalId, count: matchedItems.length, matchedItems };
  }

  // Create Floating UI HUD
  const hud = document.createElement('div');
  hud.id = 'mcb-asset-automation-hud';
  hud.innerHTML = `
    <div class="mcb-hud-header">
      <div class="mcb-hud-title">
        <span class="mcb-logo">🏫</span>
        <span>Meridian Asset Assistant</span>
      </div>
      <div class="mcb-hud-controls">
        <button id="mcb-hud-min-btn" title="Minimize">_</button>
        <button id="mcb-hud-close-btn" title="Close">&times;</button>
      </div>
    </div>
    
    <div id="mcb-hud-body" class="mcb-hud-body">
      <div class="mcb-hud-info">
        Designed for <strong>Inventory &rarr; Fixed Asset Items</strong>. Follows exact video rules by Lakshmi ma'am.
      </div>

      <div class="mcb-form-row">
        <div class="mcb-field col-6">
          <label>Grade (Class):</label>
          <input type="text" id="mcb-grade" placeholder="e.g. 3" value="3" />
        </div>
        <div class="mcb-field col-6">
          <label>Section:</label>
          <input type="text" id="mcb-section" placeholder="e.g. D" value="D" />
        </div>
      </div>

      <div class="mcb-form-row">
        <div class="mcb-field col-12">
          <label>Item Type:</label>
          <select id="mcb-item-type">
            ${ITEM_TYPES.map(
              (t) => `<option value="${t.code}" data-mcb="${t.mcbText}">${t.label} (${t.code})</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <div class="mcb-detection-card">
        <div class="mcb-detection-header">
          <span>Automatic Detection</span>
          <button id="mcb-scan-btn" class="mcb-btn-secondary" title="Scan current visible table">🔍 Detect Last Number</button>
        </div>
        <div id="mcb-detection-result" class="mcb-detection-text">
          Click "Detect Last Number" to read the current table.
        </div>
      </div>

      <div class="mcb-form-row">
        <div class="mcb-field col-6">
          <label>Start Unit # in Room:</label>
          <input type="number" id="mcb-start-unit" min="1" value="6" />
          <small class="mcb-hint">e.g. 06 for 3d-06</small>
        </div>
        <div class="mcb-field col-6">
          <label>End Unit # in Room:</label>
          <input type="number" id="mcb-end-unit" min="1" value="30" />
          <small class="mcb-hint">Continuous target (e.g. 30)</small>
        </div>
      </div>

      <div class="mcb-form-row">
        <div class="mcb-field col-12">
          <label>Starting Global Serial ID:</label>
          <input type="number" id="mcb-start-global-id" min="1" value="478" />
          <small class="mcb-hint">e.g. 478 &rarr; MM/3d-06/.../478 & MM/MM-478</small>
        </div>
      </div>

      <div class="mcb-preview-box">
        <strong>First Item Preview:</strong>
        <div id="mcb-preview-text" class="mcb-preview-tag">MM/3d-06/FURN/ST/478</div>
        <strong>Tag Preview:</strong>
        <div id="mcb-preview-tag-no" class="mcb-preview-tag-secondary">MM/MM-478</div>
      </div>

      <div class="mcb-progress-container" id="mcb-progress-container" style="display:none;">
        <div class="mcb-progress-bar-bg">
          <div id="mcb-progress-bar" class="mcb-progress-bar" style="width: 0%;"></div>
        </div>
        <div id="mcb-progress-label" class="mcb-progress-label">0 / 0 Completed</div>
      </div>

      <div class="mcb-actions">
        <button id="mcb-start-btn" class="mcb-btn-primary">🚀 Start Automation</button>
        <button id="mcb-stop-btn" class="mcb-btn-danger" style="display:none;">⏹ Stop</button>
      </div>

      <div class="mcb-log-window" id="mcb-log-window">
        <div>[Ready] Ready to start. Filter table or click "Detect Last Number".</div>
      </div>
    </div>
  `;

  // Inject styles
  const style = document.createElement('style');
  style.id = 'mcb-asset-automation-style';
  style.textContent = `
    #mcb-asset-automation-hud {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 360px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
      z-index: 99999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #1f2937;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .mcb-hud-header {
      background: #1e3a8a;
      color: #ffffff;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      font-weight: 600;
    }
    .mcb-hud-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
    }
    .mcb-hud-controls button {
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .mcb-hud-controls button:hover {
      color: #93c5fd;
    }
    .mcb-hud-body {
      padding: 14px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .mcb-hud-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 8px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 12px;
      line-height: 1.4;
    }
    .mcb-form-row {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    .col-6 { flex: 1; }
    .col-12 { flex: 100%; }
    .mcb-field label {
      display: block;
      font-weight: 600;
      margin-bottom: 4px;
      font-size: 12px;
      color: #374151;
    }
    .mcb-field input, .mcb-field select {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      box-sizing: border-box;
    }
    .mcb-field input:focus, .mcb-field select:focus {
      border-color: #2563eb;
      outline: none;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }
    .mcb-hint {
      display: block;
      color: #6b7280;
      font-size: 11px;
      margin-top: 2px;
    }
    .mcb-detection-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 12px;
    }
    .mcb-detection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .mcb-detection-text {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.4;
    }
    .mcb-preview-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    .mcb-preview-tag {
      font-family: monospace;
      color: #047857;
      font-weight: bold;
      font-size: 12.5px;
      margin: 2px 0 6px 0;
      word-break: break-all;
    }
    .mcb-preview-tag-secondary {
      font-family: monospace;
      color: #4338ca;
      font-weight: bold;
      font-size: 12px;
    }
    .mcb-progress-container {
      margin-bottom: 12px;
    }
    .mcb-progress-bar-bg {
      background: #e5e7eb;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
    }
    .mcb-progress-bar {
      background: #2563eb;
      height: 100%;
      transition: width 0.3s;
    }
    .mcb-progress-label {
      text-align: right;
      font-size: 11px;
      color: #4b5563;
      margin-top: 4px;
      font-weight: 600;
    }
    .mcb-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .mcb-btn-primary {
      flex: 1;
      background: #2563eb;
      color: white;
      border: none;
      padding: 9px 12px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    }
    .mcb-btn-primary:hover { background: #1d4ed8; }
    .mcb-btn-secondary {
      background: #ffffff;
      color: #374151;
      border: 1px solid #d1d5db;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    .mcb-btn-secondary:hover { background: #f3f4f6; }
    .mcb-btn-danger {
      flex: 1;
      background: #dc2626;
      color: white;
      border: none;
      padding: 9px 12px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }
    .mcb-btn-danger:hover { background: #b91c1c; }
    .mcb-log-window {
      background: #111827;
      color: #10b981;
      font-family: monospace;
      font-size: 11px;
      padding: 8px 10px;
      border-radius: 6px;
      height: 110px;
      overflow-y: auto;
      line-height: 1.4;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(hud);

  // Dragging functionality for HUD
  const header = hud.querySelector('.mcb-hud-header');
  let isDragging = false;
  let offsetX, offsetY;

  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    offsetX = e.clientX - hud.getBoundingClientRect().left;
    offsetY = e.clientY - hud.getBoundingClientRect().top;
    hud.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    hud.style.left = `${Math.max(10, e.clientX - offsetX)}px`;
    hud.style.top = `${Math.max(10, e.clientY - offsetY)}px`;
    hud.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // UI elements
  const closeBtn = document.getElementById('mcb-hud-close-btn');
  const minBtn = document.getElementById('mcb-hud-min-btn');
  const body = document.getElementById('mcb-hud-body');
  const gradeInput = document.getElementById('mcb-grade');
  const sectionInput = document.getElementById('mcb-section');
  const itemTypeSelect = document.getElementById('mcb-item-type');
  const scanBtn = document.getElementById('mcb-scan-btn');
  const startUnitInput = document.getElementById('mcb-start-unit');
  const endUnitInput = document.getElementById('mcb-end-unit');
  const startGlobalIdInput = document.getElementById('mcb-start-global-id');
  const previewText = document.getElementById('mcb-preview-text');
  const previewTagNo = document.getElementById('mcb-preview-tag-no');
  const startBtn = document.getElementById('mcb-start-btn');
  const stopBtn = document.getElementById('mcb-stop-btn');
  const logWindow = document.getElementById('mcb-log-window');
  const detectionResult = document.getElementById('mcb-detection-result');
  const progressContainer = document.getElementById('mcb-progress-container');
  const progressBar = document.getElementById('mcb-progress-bar');
  const progressLabel = document.getElementById('mcb-progress-label');

  let isRunning = false;

  function appendLog(msg, color = '#10b981') {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.style.color = color;
    div.textContent = `[${time}] ${msg}`;
    logWindow.appendChild(div);
    logWindow.scrollTop = logWindow.scrollHeight;
  }

  function updatePreview() {
    const grade = gradeInput.value.trim() || '3';
    const sec = (sectionInput.value.trim() || 'D').toLowerCase();
    const typeCode = itemTypeSelect.value;
    const startUnit = parseInt(startUnitInput.value, 10) || 1;
    const unitFormatted = startUnit < 10 ? `0${startUnit}` : `${startUnit}`;
    const globalId = parseInt(startGlobalIdInput.value, 10) || 1;

    const itemName = `MM/${grade}${sec}-${unitFormatted}/FURN/${typeCode}/${globalId}`;
    const tagNo = `MM/MM-${globalId}`;

    previewText.textContent = itemName;
    previewTagNo.textContent = tagNo;
  }

  [gradeInput, sectionInput, itemTypeSelect, startUnitInput, endUnitInput, startGlobalIdInput].forEach((el) => {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
  });

  // Minimize / Close
  closeBtn.addEventListener('click', () => {
    hud.remove();
    style.remove();
  });

  let isMinimized = false;
  minBtn.addEventListener('click', () => {
    isMinimized = !isMinimized;
    body.style.display = isMinimized ? 'none' : 'block';
    minBtn.textContent = isMinimized ? '+' : '_';
  });

  // Scan Table Button handler
  scanBtn.addEventListener('click', () => {
    const grade = gradeInput.value.trim();
    const sec = sectionInput.value.trim();
    const typeCode = itemTypeSelect.value;

    appendLog(`Scanning visible table for Grade ${grade}${sec} (${typeCode})...`, '#93c5fd');
    const result = scanTableForLastNumbers(grade, sec, typeCode);

    if (result.maxGlobalId > 0 || result.maxUnit > 0) {
      appendLog(`Found highest Global ID: ${result.maxGlobalId}`, '#34d399');
      appendLog(`Found highest Unit for ${grade}${sec}: ${result.maxUnit}`, '#34d399');

      startGlobalIdInput.value = result.maxGlobalId + 1;
      startUnitInput.value = result.maxUnit + 1;

      detectionResult.innerHTML = `
        <span style="color:#059669; font-weight:bold;">Detected from table:</span><br/>
        Last Room Unit: <strong>${result.maxUnit}</strong> &rarr; Next: <strong>${result.maxUnit + 1}</strong><br/>
        Last Global ID: <strong>${result.maxGlobalId}</strong> &rarr; Next: <strong>${result.maxGlobalId + 1}</strong>
      `;
    } else {
      appendLog('No matching items found in the current table. Please filter and click "Get", or enter start numbers manually.', '#fbbf24');
      detectionResult.innerHTML = `
        <span style="color:#d97706;">No records found for ${grade}${sec} in current view. Filter page and click 'Get' to load table.</span>
      `;
    }
    updatePreview();
  });

  // Helper to find input by associated label text or placeholder or id
  function findFieldByLabel(modal, labelSubstring) {
    const labels = modal.querySelectorAll('label, th, td, span');
    for (const lbl of labels) {
      if (lbl.textContent.toLowerCase().includes(labelSubstring.toLowerCase())) {
        // Check next sibling, parent next sibling, or for attribute
        if (lbl.htmlFor) {
          const el = modal.querySelector(`#${lbl.htmlFor}`);
          if (el) return el;
        }
        let parent = lbl.parentElement;
        for (let depth = 0; depth < 3 && parent; depth++) {
          const input = parent.querySelector('input, select, textarea');
          if (input && input !== lbl) return input;
          parent = parent.parentElement;
        }
      }
    }
    return null;
  }

  // Automation Loop
  startBtn.addEventListener('click', async () => {
    const grade = gradeInput.value.trim() || '3';
    const sec = (sectionInput.value.trim() || 'D').toLowerCase();
    const typeCode = itemTypeSelect.value;
    const selectedOption = itemTypeSelect.options[itemTypeSelect.selectedIndex];
    const mcbItemTypeText = selectedOption.getAttribute('data-mcb') || 'STUDENT TABLES';

    const startUnit = parseInt(startUnitInput.value, 10);
    const endUnit = parseInt(endUnitInput.value, 10);
    let currentGlobalId = parseInt(startGlobalIdInput.value, 10);

    if (isNaN(startUnit) || isNaN(endUnit) || isNaN(currentGlobalId)) {
      alert('Please enter valid numeric values for Start Unit, End Unit, and Global ID.');
      return;
    }

    if (endUnit < startUnit) {
      alert('End Unit must be greater than or equal to Start Unit.');
      return;
    }

    const totalItems = endUnit - startUnit + 1;
    if (!confirm(`Are you ready to create ${totalItems} items for ${grade}${sec.toUpperCase()} (Units ${startUnit} to ${endUnit}) starting from Global ID ${currentGlobalId}?`)) {
      return;
    }

    isRunning = true;
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    progressContainer.style.display = 'block';
    appendLog(`Starting creation of ${totalItems} items...`, '#60a5fa');

    let completed = 0;

    for (let unit = startUnit; unit <= endUnit; unit++) {
      if (!isRunning) {
        appendLog('Automation stopped by user.', '#f87171');
        break;
      }

      const unitFormatted = unit < 10 ? `0${unit}` : `${unit}`;
      const itemName = `MM/${grade}${sec}-${unitFormatted}/FURN/${typeCode}/${currentGlobalId}`;
      const tagNo = `MM/MM-${currentGlobalId}`;

      appendLog(`[${completed + 1}/${totalItems}] Creating: ${itemName}...`, '#93c5fd');

      try {
        // Step 1: Click "+ Add Item" button
        let addBtn = null;
        const allButtons = Array.from(document.querySelectorAll('button, a, input[type="button"]'));
        for (const btn of allButtons) {
          if (btn.textContent.includes('Add Item') || (btn.value && btn.value.includes('Add Item'))) {
            addBtn = btn;
            break;
          }
        }

        if (!addBtn) {
          throw new Error('Could not find "+ Add Item" button on page.');
        }

        addBtn.click();
        await sleep(1200);

        // Step 2: Locate Modal Dialog
        let modal = document.querySelector('.modal.show, .modal.in, div[role="dialog"], #myModal, #fixedAssetModal');
        if (!modal) {
          // Fallback: search for any div containing "Create/Edit Fixed Asset Items"
          const allDivs = document.querySelectorAll('div');
          for (const d of allDivs) {
            if (d.textContent.includes('Create/Edit Fixed Asset Items') && d.offsetHeight > 100) {
              modal = d;
              break;
            }
          }
        }

        if (!modal) {
          throw new Error('Modal dialog "Create/Edit Fixed Asset Items" did not open.');
        }

        // Step 3: Fill Fields in Modal
        // 3a. Category: ASSETS-MADHAPUR
        const catSelect = findFieldByLabel(modal, 'Category') || modal.querySelector('select');
        if (catSelect) {
          selectOptionByText(catSelect, 'MADHAPUR');
        }
        await sleep(500);

        // 3b. Sub Category: FURNITURES
        const subCatSelect = findFieldByLabel(modal, 'Sub Category');
        if (subCatSelect) {
          selectOptionByText(subCatSelect, 'FURNITURE');
        }
        await sleep(500);

        // 3c. Item Type: e.g. STUDENT TABLES / STUDENT CHAIRS
        const itemTypeField = findFieldByLabel(modal, 'Item Type');
        if (itemTypeField && itemTypeField.tagName === 'SELECT') {
          selectOptionByText(itemTypeField, mcbItemTypeText);
        }
        await sleep(400);

        // 3d. Item Name: MM/3d-06/FURN/ST/478
        const itemNameField = findFieldByLabel(modal, 'Item Name') || modal.querySelector('input[placeholder*="Item Name"], input[name*="ItemName"]');
        if (itemNameField) {
          setNativeValue(itemNameField, itemName);
        } else {
          throw new Error('Item Name field not found in modal.');
        }

        // 3e. UOM: Nos
        const uomField = findFieldByLabel(modal, 'UOM');
        if (uomField && uomField.tagName === 'SELECT') {
          selectOptionByText(uomField, 'Nos');
        }

        // 3f. Classification: General
        const classField = findFieldByLabel(modal, 'Classification');
        if (classField && classField.tagName === 'SELECT') {
          selectOptionByText(classField, 'General');
        }

        // 3g. GST %: 0
        const gstField = findFieldByLabel(modal, 'GST');
        if (gstField && gstField.tagName === 'SELECT') {
          selectOptionByText(gstField, '0');
        }

        // 3h. Item Description: same as Item Name
        const descField = findFieldByLabel(modal, 'Item Description') || modal.querySelector('textarea');
        if (descField) {
          setNativeValue(descField, itemName);
        }

        // 3i. Radios: Is Returnable: No, Warranty available: No, Service needed: No
        const radioLabels = modal.querySelectorAll('label');
        radioLabels.forEach((lbl) => {
          if (lbl.textContent.trim().toLowerCase() === 'no') {
            const radio = lbl.querySelector('input[type="radio"]') || document.getElementById(lbl.htmlFor);
            if (radio) {
              radio.checked = true;
              radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        });

        // 3j. Asset Tag Name: MM/3d-06/FURN/ST/478
        const tagField = findFieldByLabel(modal, 'Asset Tag Name');
        if (tagField) {
          setNativeValue(tagField, itemName);
        }

        // 3k. Asset Tag No: MM/MM-478
        const tagNoField = findFieldByLabel(modal, 'Asset Tag No');
        if (tagNoField) {
          setNativeValue(tagNoField, tagNo);
        }

        // 3l. Depreciation Method: Straight Line Depreciation Method
        const depMethodField = findFieldByLabel(modal, 'Depreciation Method');
        if (depMethodField && depMethodField.tagName === 'SELECT') {
          selectOptionByText(depMethodField, 'Straight Line');
        }

        // 3m. Depreciation Rate: 1
        const depRateField = findFieldByLabel(modal, 'Depreciation Rate');
        if (depRateField) {
          setNativeValue(depRateField, '1');
        }

        await sleep(500);

        // Step 4: Click Save
        const saveBtns = Array.from(modal.querySelectorAll('button, input[type="submit"]'));
        const saveBtn = saveBtns.find((b) => b.textContent.trim().toLowerCase() === 'save');
        if (!saveBtn) {
          throw new Error('Save button not found in modal.');
        }

        saveBtn.click();
        appendLog(`Saved ${itemName}. Waiting for confirmation...`, '#a7f3d0');
        await sleep(1500);

        // Step 5: Check for Success Popup & Click OK
        // Usually SweetAlert or standard alert dialog
        let okClicked = false;
        const popups = document.querySelectorAll('.swal2-container, .modal, div[role="dialog"], .bootbox');
        for (const popup of popups) {
          if (popup.textContent.includes('saved successfully') || popup.textContent.includes('successfully') || popup.textContent.includes('Success')) {
            const okBtn = Array.from(popup.querySelectorAll('button')).find((b) =>
              b.textContent.trim().toLowerCase().includes('ok')
            );
            if (okBtn) {
              okBtn.click();
              okClicked = true;
              break;
            }
          }
        }

        if (!okClicked) {
          // Check for any visible OK button
          const anyOk = Array.from(document.querySelectorAll('button')).find(
            (b) => b.textContent.trim().toLowerCase() === 'ok' && b.offsetParent !== null
          );
          if (anyOk) {
            anyOk.click();
          }
        }

        completed++;
        currentGlobalId++;
        const pct = Math.round((completed / totalItems) * 100);
        progressBar.style.width = `${pct}%`;
        progressLabel.textContent = `${completed} / ${totalItems} Completed (${pct}%)`;

        appendLog(`Successfully registered: ${itemName}`, '#34d399');
        await sleep(1200); // Friendly throttle
      } catch (err) {
        appendLog(`Error on unit ${unit}: ${err.message}`, '#f87171');
        const retry = confirm(`Error occurred while saving ${itemName}:\n${err.message}\n\nClick OK to retry this item, or Cancel to stop.`);
        if (!retry) {
          break;
        }
        unit--; // Retry same unit
      }
    }

    isRunning = false;
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    appendLog(`Automation finished! Total items created: ${completed}`, '#60a5fa');
    alert(`Automation finished!\nSuccessfully created ${completed} items for Grade ${grade}${sec.toUpperCase()}.`);
  });

  stopBtn.addEventListener('click', () => {
    isRunning = false;
    appendLog('Stopping automation...', '#fbbf24');
  });

  // Initial setup
  updatePreview();
  appendLog('Loaded MCB Fixed Asset Automation Assistant.', '#34d399');
})();

