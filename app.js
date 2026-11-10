/**
 * Meridian Fixed Asset Automation Suite Web App Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const inputGrade = document.getElementById('input-grade');
  const inputSection = document.getElementById('input-section');
  const selectItemType = document.getElementById('select-item-type');
  const customContainer = document.getElementById('custom-type-container');
  const customCodeInput = document.getElementById('custom-type-code');
  const customMcbInput = document.getElementById('custom-type-mcb');
  const inputStartUnit = document.getElementById('input-start-unit');
  const inputEndUnit = document.getElementById('input-end-unit');
  const inputStartGlobal = document.getElementById('input-start-global');

  // Badges & Preview Elements
  const totalCountBadge = document.getElementById('total-count-badge');
  const roomRangeBadge = document.getElementById('room-range-badge');
  const globalRangeBadge = document.getElementById('global-range-badge');
  const tableRowCount = document.getElementById('table-row-count');

  // Formula Elements
  const formulaRoom = document.getElementById('formula-room');
  const formulaType = document.getElementById('formula-type');
  const formulaId = document.getElementById('formula-id');
  const captionRoom = document.getElementById('caption-room');
  const captionType = document.getElementById('caption-type');
  const captionId = document.getElementById('caption-id');

  // Meta Elements
  const metaDesc = document.getElementById('meta-desc');
  const metaTagName = document.getElementById('meta-tag-name');
  const metaTagNo = document.getElementById('meta-tag-no');

  // Table
  const tableBody = document.getElementById('preview-table-body');
  const exportCsvBtn = document.getElementById('export-csv-btn');

  // Bookmarklet & Script Copy
  const bookmarkletLink = document.getElementById('bookmarklet-link');
  const copyScriptBtn = document.getElementById('copy-script-btn');
  const copyScriptBtn2 = document.getElementById('copy-script-btn-2');

  let generatedItems = [];

  // Item Types mapping
  function getItemTypeInfo() {
    const val = selectItemType.value;
    const selectedOpt = selectItemType.options[selectItemType.selectedIndex];
    if (val === 'CUSTOM') {
      const code = (customCodeInput.value.trim() || 'CUST').toUpperCase();
      const mcbText = (customMcbInput.value.trim() || 'CUSTOM ITEM').toUpperCase();
      return { code, mcbText, cat: 'FURNITURES' };
    }
    return {
      code: val,
      mcbText: selectedOpt.getAttribute('data-mcb') || 'STUDENT TABLES',
      cat: selectedOpt.getAttribute('data-cat') || 'FURNITURES'
    };
  }

  // Generate & Update View
  function regenerate() {
    const grade = inputGrade.value.trim() || '3';
    const section = (inputSection.value.trim() || 'D').toLowerCase();
    const typeInfo = getItemTypeInfo();
    const startUnit = parseInt(inputStartUnit.value, 10) || 1;
    const endUnit = parseInt(inputEndUnit.value, 10) || startUnit;
    const startGlobal = parseInt(inputStartGlobal.value, 10) || 1;

    // Custom visibility
    customContainer.style.display = selectItemType.value === 'CUSTOM' ? 'flex' : 'none';

    const safeEndUnit = Math.max(startUnit, endUnit);
    const totalCount = safeEndUnit - startUnit + 1;

    // Badges
    const startUnitPad = startUnit < 10 ? `0${startUnit}` : `${startUnit}`;
    const endUnitPad = safeEndUnit < 10 ? `0${safeEndUnit}` : `${safeEndUnit}`;
    const endGlobal = startGlobal + totalCount - 1;

    totalCountBadge.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'}`;
    roomRangeBadge.textContent = `${grade}${section}-${startUnitPad} → ${grade}${section}-${endUnitPad}`;
    globalRangeBadge.textContent = `${startGlobal} → ${endGlobal}`;
    tableRowCount.textContent = `${totalCount}`;

    // Formula elements for first item
    const firstRoomStr = `${grade}${section}-${startUnitPad}`;
    formulaRoom.textContent = firstRoomStr;
    formulaType.textContent = typeInfo.code;
    formulaId.textContent = `${startGlobal}`;

    captionRoom.textContent = firstRoomStr;
    captionType.textContent = `${typeInfo.code} (${typeInfo.mcbText})`;
    captionId.textContent = `${startGlobal}`;

    const firstItemName = `MM/${firstRoomStr}/FURN/${typeInfo.code}/${startGlobal}`;
    const firstTagNo = `MM/MM-${startGlobal}`;

    metaDesc.textContent = firstItemName;
    metaTagName.textContent = firstItemName;
    metaTagNo.textContent = firstTagNo;

    // Generate table rows
    generatedItems = [];
    tableBody.innerHTML = '';

    for (let u = startUnit; u <= safeEndUnit; u++) {
      const uPad = u < 10 ? `0${u}` : `${u}`;
      const gId = startGlobal + (u - startUnit);
      const itemName = `MM/${grade}${section}-${uPad}/FURN/${typeInfo.code}/${gId}`;
      const tagNo = `MM/MM-${gId}`;

      const itemObj = {
        index: u - startUnit + 1,
        itemName,
        tagNo,
        category: 'ASSETS-MADHAPUR',
        subCategory: typeInfo.cat,
        itemType: typeInfo.mcbText,
        uom: 'Nos',
        classification: 'General',
        depreciation: 'Straight Line (1%)'
      };

      generatedItems.push(itemObj);

      // Only display first 100 rows in DOM if large
      if (generatedItems.length <= 100) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${itemObj.index}</td>
          <td>${itemObj.itemName}</td>
          <td>${itemObj.tagNo}</td>
          <td>${itemObj.category}</td>
          <td>${itemObj.subCategory}</td>
          <td>${itemObj.itemType}</td>
          <td>${itemObj.uom}</td>
          <td>${itemObj.classification}</td>
          <td>${itemObj.depreciation}</td>
        `;
        tableBody.appendChild(tr);
      }
    }

    if (totalCount > 100) {
      const trNotice = document.createElement('tr');
      trNotice.innerHTML = `
        <td colspan="9" style="text-align:center; color:#6b7280; font-style:italic; padding: 12px;">
          Showing first 100 items of ${totalCount}. Export to CSV to view full dataset.
        </td>
      `;
      tableBody.appendChild(trNotice);
    }
  }

  // Listeners
  [inputGrade, inputSection, selectItemType, customCodeInput, customMcbInput, inputStartUnit, inputEndUnit, inputStartGlobal].forEach((el) => {
    el.addEventListener('input', regenerate);
    el.addEventListener('change', regenerate);
  });

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    if (!generatedItems.length) return;
    const headers = ['Index', 'Item Name', 'Asset Tag No', 'Category', 'Sub Category', 'Item Type', 'UOM', 'Classification', 'Depreciation Method'];
    const rows = generatedItems.map(item => [
      item.index,
      `"${item.itemName}"`,
      `"${item.tagNo}"`,
      `"${item.category}"`,
      `"${item.subCategory}"`,
      `"${item.itemType}"`,
      `"${item.uom}"`,
      `"${item.classification}"`,
      `"${item.depreciation}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const grade = inputGrade.value.trim() || '3';
    const section = (inputSection.value.trim() || 'D').toUpperCase();
    link.setAttribute('href', url);
    link.setAttribute('download', `Meridian_Assets_Grade_${grade}${section}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Setup Bookmarklet & Copy code
  fetch('mcb-automation-runner.js')
    .then(r => r.text())
    .then(scriptText => {
      // Build minified bookmarklet code
      const bookmarkletCode = `javascript:(function(){${encodeURIComponent(scriptText)}})();`;
      bookmarkletLink.setAttribute('href', bookmarkletCode);

      function handleCopy(btn) {
        navigator.clipboard.writeText(scriptText).then(() => {
          const original = btn.textContent;
          btn.textContent = '✅ Copied Script!';
          setTimeout(() => { btn.textContent = original; }, 2000);
        });
      }

      copyScriptBtn.addEventListener('click', () => handleCopy(copyScriptBtn));
      copyScriptBtn2.addEventListener('click', () => handleCopy(copyScriptBtn2));
    })
    .catch(err => {
      console.warn('Could not load runner script for bookmarklet generator:', err);
    });

  // Initial generation
  regenerate();
});

