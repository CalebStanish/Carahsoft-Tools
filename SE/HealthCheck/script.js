const applianceBody = document.getElementById('applianceBody');
const addRowBtn = document.getElementById('addRowBtn');
const generateEmailBtn = document.getElementById('generateEmailBtn');
const copyEmailBtn = document.getElementById('copyEmailBtn');
const savePdfBtn = document.getElementById('savePdfBtn');
const supportFiles = document.getElementById('supportFiles');
const imageFiles = document.getElementById('imageFiles');
const supportDropzone = document.getElementById('supportDropzone');
const imageDropzone = document.getElementById('imageDropzone');
const fileList = document.getElementById('fileList');
const imagePreview = document.getElementById('imagePreview');
const emailOutput = document.getElementById('emailOutput');
const stepProgress = document.getElementById('stepProgress');
const stepDoneCheckboxes = document.querySelectorAll('.step-done');
const notesField = document.getElementById('notes');
const addBulletBtn = document.getElementById('addBulletBtn');
const addLineBtn = document.getElementById('addLineBtn');
const MAX_APPLIANCE_ROWS = 12;
let pastedImageFiles = [];

function getValue(id) {
    const element = document.getElementById(id);
    if (!element) {
        return 'N/A';
    }
    if (element.type === 'checkbox') {
        return element.checked ? 'Yes' : 'No';
    }
    return element.value.trim() || 'N/A';
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getTextLines(id) {
    const element = document.getElementById(id);
    if (!element || typeof element.value !== 'string') {
        return [];
    }

    return element.value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/^[-*]\s*/, '').trim())
        .filter((line) => line.length > 0);
}

function buildBulletText(id) {
    const lines = getTextLines(id);
    if (!lines.length) {
        return 'N/A';
    }
    return lines.map((line) => `- ${line}`).join('\n');
}

function buildBulletListHtml(id) {
    const lines = getTextLines(id);
    if (!lines.length) {
        return '<p>N/A</p>';
    }

    const items = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('');
    return `<ul>${items}</ul>`;
}

function insertAtCursor(textarea, text) {
    if (!textarea) {
        return;
    }

    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);

    textarea.value = `${before}${text}${after}`;
    const caret = start + text.length;
    textarea.selectionStart = caret;
    textarea.selectionEnd = caret;
    textarea.focus();
}

function getInputValue(input) {
    if (input.type === 'checkbox') {
        return input.checked ? 'Yes' : 'No';
    }
    return input.value.trim() || 'N/A';
}

function getRowColumnMap(row) {
    const cols = Array.from(row.querySelectorAll('input[data-col], select[data-col]'));
    const rowData = {};

    cols.forEach((field) => {
        const key = field.dataset.col;
        const value = getInputValue(field);
        if (!rowData[key]) {
            rowData[key] = [];
        }
        rowData[key].push(value);
    });

    const combined = {};
    Object.keys(rowData).forEach((key) => {
        const values = rowData[key].filter((v) => v !== 'N/A');
        combined[key] = values.length ? values.join(', ') : 'N/A';
    });
    return combined;
}

function syncHaStateForRow(row) {
    const haCheckbox = row.querySelector('input[data-col="HA"]');
    if (!haCheckbox) {
        return;
    }
    const enableSecondNode = haCheckbox.checked;
    row.classList.toggle('ha-disabled', !enableSecondNode);
    const haOnlyFields = row.querySelectorAll('.ha-only');
    haOnlyFields.forEach((element) => {
        if (element.tagName === 'INPUT') {
            element.disabled = !enableSecondNode;
            if (!enableSecondNode) {
                element.value = '';
            }
        }
        element.classList.toggle('hidden', !enableSecondNode);
    });
}

function addInventoryRow() {
    const existingRows = applianceBody.querySelectorAll('tr').length;
    if (existingRows >= MAX_APPLIANCE_ROWS) {
        alert(`You can add up to ${MAX_APPLIANCE_ROWS} appliances.`);
        return;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" data-col="Applience Name"></td>
        <td>
            <select data-col="Appliance Type">
                <option value="GM">GM</option>
                <option value="GMC">GMC</option>
                <option value="Services">Services</option>
                <option value="Discovery">Discovery</option>
                <option value="Reporting">Reporting</option>
            </select>
        </td>
        <td class="bool-col"><label class="inline-check compact-check"><input type="checkbox" data-col="DHCP"></label></td>
        <td class="bool-col"><label class="inline-check compact-check"><input type="checkbox" data-col="DNS"></label></td>
        <td><input type="text" data-col="Location"></td>
        <td><input type="text" data-col="HW Type"></td>
        <td class="bool-col"><label class="inline-check compact-check"><input type="checkbox" data-col="HA"></label></td>
        <td>
            <div class="pair-input">
                <input type="text" data-col="CPU" class="percent-only" inputmode="decimal" placeholder="Node 1 %">
                <span class="ha-only">,</span>
                <input class="ha-only percent-only" type="text" data-col="CPU" inputmode="decimal" placeholder="Node 2 %">
            </div>
        </td>
        <td><input type="text" data-col="DB" class="percent-only" inputmode="decimal" placeholder="%"></td>
        <td>
            <div class="pair-input">
                <input type="text" data-col="Mem" class="percent-only" inputmode="decimal" placeholder="Node 1 %">
                <span class="ha-only">,</span>
                <input class="ha-only percent-only" type="text" data-col="Mem" inputmode="decimal" placeholder="Node 2 %">
            </div>
        </td>
        <td>
            <div class="pair-input">
                <input type="text" data-col="Disk" class="percent-only" inputmode="decimal" placeholder="Node 1 %">
                <span class="ha-only">,</span>
                <input class="ha-only percent-only" type="text" data-col="Disk" inputmode="decimal" placeholder="Node 2 %">
            </div>
        </td>
        <td><input type="text" data-col="QPS"></td>
        <td><input type="text" data-col="LPS"></td>
        <td>
            <select data-col="PSU Type">
                <option value="Single">Single</option>
                <option value="Dual">Dual</option>
            </select>
        </td>
        <td>
            <select data-col="PSU Status">
                <option value="Good">Good</option>
                <option value="Warning">Warning</option>
                <option value="Critical">Critical</option>
                <option value="Offline">Offline</option>
            </select>
        </td>
        <td class="bool-col"><label class="inline-check compact-check"><input type="checkbox" data-col="Redundant PSU"></label></td>
        <td><input type="text" data-col="Virtual or HW"></td>
        <td class="action-col"><button type="button" class="btn secondary remove-row">X</button></td>
    `;
    applianceBody.appendChild(row);
    syncHaStateForRow(row);
}

function bindRowRemoval(event) {
    if (event.target.classList.contains('remove-row')) {
        const row = event.target.closest('tr');
        const rowCount = applianceBody.querySelectorAll('tr').length;
        if (row && rowCount > 1) {
            row.remove();
        }
    }
}

function sanitizePercentInputValue(value) {
    if (typeof value !== 'string') {
        return '';
    }

    const hasPercent = value.includes('%');
    const numeric = value
        .replace(/[^\d.]/g, '')
        .replace(/(\..*)\./g, '$1');

    return `${numeric}${hasPercent ? '%' : ''}`;
}

function bindPercentOnlyInputs(event) {
    const target = event.target;
    if (!target || !target.matches('input.percent-only')) {
        return;
    }

    const sanitized = sanitizePercentInputValue(target.value);
    if (target.value !== sanitized) {
        target.value = sanitized;
    }
}

function bindHaToggle(event) {
    const target = event.target;
    if (target && target.matches('input[data-col="HA"]')) {
        const row = target.closest('tr');
        if (row) {
            syncHaStateForRow(row);
        }
    }
}

function handleInventoryEnterNavigation(event) {
    if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    const target = event.target;
    if (!target || !target.matches('input[type="text"], select')) {
        return;
    }

    event.preventDefault();

    const focusable = Array.from(
        applianceBody.querySelectorAll('input[type="text"]:not([disabled]), select:not([disabled])')
    );
    const currentIndex = focusable.indexOf(target);
    if (currentIndex < 0) {
        return;
    }

    const next = focusable[currentIndex + 1];
    if (next) {
        next.focus();
        if (next.tagName === 'INPUT') {
            next.select();
        }
    }
}

function renderFileList(files) {
    fileList.innerHTML = '';
    Array.from(files).forEach((file) => {
        const li = document.createElement('li');
        li.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
        fileList.appendChild(li);
    });
}

function renderImagePreviews(files) {
    imagePreview.innerHTML = '';
    Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name;
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

function getAllImageFiles() {
    return [...Array.from(imageFiles.files), ...pastedImageFiles];
}

function refreshImagePreview() {
    renderImagePreviews(getAllImageFiles());
}

function createPastedImageFile(blob) {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const extension = blob.type && blob.type.includes('png') ? 'png' : 'jpg';
    const name = `PastedImage-${timestamp}-${pastedImageFiles.length + 1}.${extension}`;
    return new File([blob], name, { type: blob.type || 'image/png' });
}

function handleImagePaste(event) {
    const activeElement = document.activeElement;
    const isTypingIntoTextField =
        activeElement &&
        (activeElement.tagName === 'TEXTAREA' ||
            (activeElement.tagName === 'INPUT' && ['text', 'search', 'email', 'url', 'tel', 'password'].includes(activeElement.type)));
    if (isTypingIntoTextField || !event.clipboardData) {
        return;
    }

    const imageItems = Array.from(event.clipboardData.items).filter((item) => item.type.startsWith('image/'));
    if (!imageItems.length) {
        return;
    }

    event.preventDefault();
    imageItems.forEach((item) => {
        const blob = item.getAsFile();
        if (blob) {
            pastedImageFiles.push(createPastedImageFile(blob));
        }
    });
    refreshImagePreview();
}

function applyFilesToInput(inputElement, files) {
    const dt = new DataTransfer();
    Array.from(files).forEach((file) => dt.items.add(file));
    inputElement.files = dt.files;
}

function addDropzoneBehavior(dropzone, inputElement, onFilesApplied) {
    if (!dropzone || !inputElement) {
        return;
    }

    const stop = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    ['dragenter', 'dragover'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (event) => {
            stop(event);
            dropzone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (event) => {
            stop(event);
            dropzone.classList.remove('drag-over');
        });
    });

    dropzone.addEventListener('drop', (event) => {
        const droppedFiles = event.dataTransfer ? event.dataTransfer.files : null;
        if (!droppedFiles || !droppedFiles.length) {
            return;
        }
        applyFilesToInput(inputElement, droppedFiles);
        onFilesApplied(inputElement.files);
    });
}

function buildInventoryText() {
    const rows = Array.from(applianceBody.querySelectorAll('tr'));
    if (!rows.length) {
        return 'None captured';
    }

    return rows
        .map((row, index) => {
            const data = getRowColumnMap(row);
            const values = Object.keys(data).map((key) => `${key}: ${data[key]}`);
            return `${index + 1}. ${values.join(' | ')}`;
        })
        .join('\n');
}

function getInventoryRows() {
    return Array.from(applianceBody.querySelectorAll('tr')).map((row) => getRowColumnMap(row));
}

function buildInventoryTableHtml() {
    const rows = getInventoryRows();
    if (!rows.length) {
        return '<p>None captured</p>';
    }

    const headers = Object.keys(rows[0]);
    const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
    const rowHtml = rows
        .map((row) => {
            const tds = headers.map((header) => `<td>${escapeHtml(row[header] || 'N/A')}</td>`).join('');
            return `<tr>${tds}</tr>`;
        })
        .join('');

    return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowHtml}</tbody></table>`;
}

function buildStepCompletionHtml() {
    const stepItems = Array.from(stepDoneCheckboxes).map((checkbox) => {
        const label = checkbox.closest('label');
        const stepText = label ? label.textContent.trim() : `Step ${checkbox.dataset.step}`;
        return `<li>${escapeHtml(stepText)}: ${checkbox.checked ? 'Complete' : 'Pending'}</li>`;
    });

    return `<ul>${stepItems.join('')}</ul>`;
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(`Unable to read file: ${file.name}`));
        reader.readAsDataURL(file);
    });
}

async function buildPdfImageBlocksHtml() {
    const images = getAllImageFiles();
    if (!images.length) {
        return '<p>None</p>';
    }

    const imageHtml = await Promise.all(
        images.map(async (file, index) => {
            try {
                const src = await fileToDataUrl(file);
                return `<div class="image-block"><p><strong>Image ${index + 1}:</strong> ${escapeHtml(file.name)}</p><img src="${src}" alt="${escapeHtml(file.name)}"></div>`;
            } catch (error) {
                return `<p>Image ${index + 1}: ${escapeHtml(file.name)} (unable to embed)</p>`;
            }
        })
    );

    return imageHtml.join('');
}

async function waitForFrameImagesToLoad(doc) {
    const images = Array.from(doc.images);
    if (!images.length) {
        return;
    }

    await Promise.all(
        images.map((img) => {
            if (img.complete) {
                return Promise.resolve();
            }
            return new Promise((resolve) => {
                const done = () => resolve();
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
            });
        })
    );
}

async function buildPdfReportHtml() {
    const fileNames = Array.from(supportFiles.files).map((file) => file.name);
    const imageNames = getAllImageFiles().map((file) => file.name);
    const imageBlocksHtml = await buildPdfImageBlocksHtml();

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Health Check Report - ${escapeHtml(getValue('customerName'))}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 24px; line-height: 1.35; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    h2 { margin: 20px 0 8px; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    p { margin: 4px 0; }
    ul { margin: 6px 0 0 18px; padding: 0; }
    .meta { margin-bottom: 12px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; table-layout: fixed; }
    th, td { border: 1px solid #ccc; padding: 4px; text-align: left; vertical-align: top; word-break: break-word; }
    th { background: #f3f6fb; }
    .block { break-inside: avoid; }
    .image-block { margin: 10px 0 14px; break-inside: avoid; page-break-inside: avoid; }
    .image-block img { display: block; width: 100%; height: auto; max-height: 9.5in; object-fit: contain; border: 1px solid #ddd; }
    @page { size: letter; margin: 0.5in; }
  </style>
</head>
<body>
  <h1>SE Health Check Report</h1>
  <div class="meta">
    <p><strong>Customer:</strong> ${escapeHtml(getValue('customerName'))}</p>
    <p><strong>Date:</strong> ${escapeHtml(getValue('healthCheckDate'))}</p>
    <p><strong>Prepared By:</strong> ${escapeHtml(getValue('preparedBy'))}</p>
    <p><strong>Customer Contact:</strong> ${escapeHtml(getValue('customerContact'))}</p>
    <p><strong>Progress:</strong> ${escapeHtml(stepProgress.textContent)}</p>
  </div>

  <div class="block">
    <h2>Step Completion</h2>
    ${buildStepCompletionHtml()}
  </div>

  <div class="block">
    <h2>Step 1: Grid Overview</h2>
    <p><strong>NIOS Version:</strong> ${escapeHtml(getValue('niosVersion'))}</p>
    <p><strong>Grid Name:</strong> ${escapeHtml(getValue('gridName'))}</p>
  </div>

  <div class="block">
    <h2>Step 2: Backup Check</h2>
    <p><strong>Backups Exist:</strong> ${escapeHtml(getValue('backupExists'))}</p>
    <p><strong>Schedule Configured:</strong> ${escapeHtml(getValue('backupScheduleConfigured'))}</p>
    <p><strong>Notes:</strong> ${escapeHtml(getValue('backupNotes'))}</p>
  </div>

  <div class="block">
    <h2>Step 3: Capacity Report</h2>
    <p><strong>Notes:</strong> ${escapeHtml(getValue('capacityNotes'))}</p>
  </div>

  <div class="block">
    <h2>Step 4: License Review</h2>
    <p><strong>Notes:</strong> ${escapeHtml(getValue('licenseNotes'))}</p>
  </div>

  <div class="block">
    <h2>Step 5: DHCP Capacity and FO</h2>
    <p><strong>Total Utilization:</strong> ${escapeHtml(getValue('dhcpUtilization'))}</p>
    <p><strong>Total Leases:</strong> ${escapeHtml(getValue('totalLeases'))}</p>
    <p><strong>FO Enabled:</strong> ${escapeHtml(getValue('foEnabled'))}</p>
    <p><strong>FO Name:</strong> ${escapeHtml(getValue('foName'))}</p>
    <p><strong>Primary/Secondary:</strong> ${escapeHtml(getValue('foRole'))}</p>
    <p><strong>FO Balanced:</strong> ${escapeHtml(getValue('foBalanced'))}</p>
    <p><strong>Notes:</strong> ${escapeHtml(getValue('dhcpFoNotes'))}</p>
  </div>

  <div class="block">
    <h2>Step 6: Lease Time</h2>
    <p><strong>Lease Time:</strong> ${escapeHtml(getValue('leaseTime'))}</p>
    <p><strong>Notes:</strong> ${escapeHtml(getValue('leaseNotes'))}</p>
  </div>

  <div class="block">
    <h2>Step 7: DNS Review</h2>
    <p><strong>Authoritative - Internal DNS:</strong> ${escapeHtml(getValue('authInternal'))}</p>
    <p><strong>Forwarding - Internal DNS:</strong> ${escapeHtml(getValue('fwdInternal'))}</p>
    <p><strong>Authoritative - External DNS:</strong> ${escapeHtml(getValue('authExternal'))}</p>
    <p><strong>Forwarding - External DNS:</strong> ${escapeHtml(getValue('fwdExternal'))}</p>
    <p><strong>Authoritative - Default DNS:</strong> ${escapeHtml(getValue('authDefault'))}</p>
    <p><strong>Forwarding - Default DNS:</strong> ${escapeHtml(getValue('fwdDefault'))}</p>
    <p><strong>Logging Queries and Responses:</strong> ${escapeHtml(getValue('dnsLoggingQr'))}</p>
    <p><strong>RPZ Used:</strong> ${escapeHtml(getValue('dnsRpzUsed'))}</p>
    <p><strong>Notes:</strong> ${escapeHtml(getValue('dnsNotes'))}</p>
  </div>

  <div class="block">
    <h2>Step 8: Recursion and Limits</h2>
    <p><strong>Current Recursion Limit:</strong> ${escapeHtml(getValue('recursionLimit'))}</p>
    <p><strong>Max Clients Querying:</strong> ${escapeHtml(getValue('maxClientsAtTime'))}</p>
    <p><strong>Recursion Client Quota:</strong> ${escapeHtml(getValue('recursionClientQuota'))}</p>
    <p><strong>Member Is DNS Server:</strong> ${escapeHtml(getValue('dnsServerIsMember'))}</p>
    <p><strong>Notes:</strong> ${escapeHtml(getValue('recursionNotes'))}</p>
  </div>

  <div class="block">
    <h2>Step 9: BloxConnect</h2>
    <p><strong>Status:</strong> ${escapeHtml(getValue('bloxconnectStatus'))}</p>
  </div>

  <div class="block">
    <h2>General Notes</h2>
    ${buildBulletListHtml('notes')}
    <h2>Recommended Next Steps</h2>
    ${buildBulletListHtml('nextSteps')}
  </div>

  <div class="block">
    <h2>Attachments</h2>
    <p><strong>Files:</strong> ${escapeHtml(fileNames.length ? fileNames.join(', ') : 'None')}</p>
    <p><strong>Images:</strong> ${escapeHtml(imageNames.length ? imageNames.join(', ') : 'None')}</p>
  </div>

  <div class="block">
    <h2>Screenshot Images</h2>
    ${imageBlocksHtml}
  </div>

  <div class="block">
    <h2>Appendix: Appliance Inventory</h2>
    ${buildInventoryTableHtml()}
  </div>
</body>
</html>`;
}

function updateStepProgress() {
    const total = stepDoneCheckboxes.length;
    const completed = Array.from(stepDoneCheckboxes).filter((el) => el.checked).length;
    stepProgress.textContent = `${completed} / ${total} complete`;
}

function buildEmail() {
    const fileNames = Array.from(supportFiles.files).map((file) => file.name);
    const imageNames = getAllImageFiles().map((file) => file.name);
    const inventoryText = buildInventoryText();

    return `Subject: ${getValue('customerName')} - DDI Health Check Report

Hello,

Please find the DDI health check report below.

**Executive Summary**
- Customer: ${getValue('customerName')}
- Date: ${getValue('healthCheckDate')}
- Prepared By: ${getValue('preparedBy')}
- Customer Contact: ${getValue('customerContact')}
- Step Completion: ${stepProgress.textContent}

**1) Grid Overview**
- NIOS Version: ${getValue('niosVersion')}
- Grid Name: ${getValue('gridName')}

**2) Backup Check**
- Backups Exist: ${getValue('backupExists')}
- Schedule Configured: ${getValue('backupScheduleConfigured')}
- Notes: ${getValue('backupNotes')}

**3) Capacity Report**
- Notes: ${getValue('capacityNotes')}

**4) License Review**
- Notes: ${getValue('licenseNotes')}

**5) DHCP Capacity and FO**
- Total Utilization: ${getValue('dhcpUtilization')}
- Total Leases: ${getValue('totalLeases')}
- FO Enabled: ${getValue('foEnabled')}
- FO Name: ${getValue('foName')}
- Primary/Secondary: ${getValue('foRole')}
- FO Balanced: ${getValue('foBalanced')}
- Notes: ${getValue('dhcpFoNotes')}

**6) Lease Time**
- Lease Time: ${getValue('leaseTime')}
- Notes: ${getValue('leaseNotes')}

**7) DNS Review**
- Authoritative - Internal DNS: ${getValue('authInternal')}
- Forwarding - Internal DNS: ${getValue('fwdInternal')}
- Authoritative - External DNS: ${getValue('authExternal')}
- Forwarding - External DNS: ${getValue('fwdExternal')}
- Authoritative - Default DNS: ${getValue('authDefault')}
- Forwarding - Default DNS: ${getValue('fwdDefault')}
- Logging Queries and Responses: ${getValue('dnsLoggingQr')}
- RPZ Used: ${getValue('dnsRpzUsed')}
- Notes: ${getValue('dnsNotes')}

**8) Recursion and Limits**
- Current Recursion Limit: ${getValue('recursionLimit')}
- Max Clients Querying: ${getValue('maxClientsAtTime')}
- Recursion Client Quota: ${getValue('recursionClientQuota')}
- Member Is DNS Server: ${getValue('dnsServerIsMember')}
- Notes: ${getValue('recursionNotes')}

**9) BloxConnect**
- Status: ${getValue('bloxconnectStatus')}

**General Notes**
${buildBulletText('notes')}

**Recommended Next Steps**
${buildBulletText('nextSteps')}

**Appendix: Appliance Inventory**
${inventoryText}

**Attachments to Include**
- Files: ${fileNames.length ? fileNames.join(', ') : 'None'}
- Images: ${imageNames.length ? imageNames.join(', ') : 'None'}

Regards,
${getValue('preparedBy')}`;
}

function parseEmailDraft(draft) {
    const lines = draft.split('\n');
    let subject = 'Health Check Summary';
    let body = draft;

    if (lines.length && lines[0].startsWith('Subject:')) {
        subject = lines[0].replace('Subject:', '').trim() || subject;
        body = lines.slice(2).join('\n');
    }

    return { subject, body };
}

async function openDraftInMailClient(draft) {
    const { subject, body } = parseEmailDraft(draft);
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Try a fully prefilled draft first. Some clients support longer mailto URIs than others.
    if (mailto.length <= 6000) {
        window.location.href = mailto;
        return;
    }

    try {
        await navigator.clipboard.writeText(body);
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}`;
        alert('Email body is too large for auto-filled mailto. A draft opened with subject and the full body was copied to clipboard.');
    } catch (error) {
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}`;
        alert('Unable to auto-fill full body. A draft opened with subject only.');
    }
}

addRowBtn.addEventListener('click', addInventoryRow);
applianceBody.addEventListener('click', bindRowRemoval);
applianceBody.addEventListener('change', bindHaToggle);
applianceBody.addEventListener('input', bindPercentOnlyInputs);
applianceBody.addEventListener('keydown', handleInventoryEnterNavigation);
Array.from(applianceBody.querySelectorAll('tr')).forEach((row) => syncHaStateForRow(row));

supportFiles.addEventListener('change', (event) => renderFileList(event.target.files));
imageFiles.addEventListener('change', () => refreshImagePreview());
document.addEventListener('paste', handleImagePaste);
addDropzoneBehavior(supportDropzone, supportFiles, renderFileList);
addDropzoneBehavior(imageDropzone, imageFiles, () => refreshImagePreview());

if (addBulletBtn) {
    addBulletBtn.addEventListener('click', () => {
        const needsNewLine = notesField && notesField.value && !notesField.value.endsWith('\n');
        insertAtCursor(notesField, `${needsNewLine ? '\n' : ''}- `);
    });
}

if (addLineBtn) {
    addLineBtn.addEventListener('click', () => {
        insertAtCursor(notesField, '\n');
    });
}

stepDoneCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', updateStepProgress);
});
updateStepProgress();

generateEmailBtn.addEventListener('click', async () => {
    emailOutput.value = buildEmail();
    await openDraftInMailClient(emailOutput.value);
});

copyEmailBtn.addEventListener('click', async () => {
    if (!emailOutput.value.trim()) {
        emailOutput.value = buildEmail();
    }
    try {
        await navigator.clipboard.writeText(emailOutput.value);
        alert('Email draft copied to clipboard.');
    } catch (error) {
        alert('Unable to copy automatically. Please select and copy manually.');
    }
});

savePdfBtn.addEventListener('click', async () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameWindow = printFrame.contentWindow;
    if (!frameWindow) {
        alert('Unable to open print preview. Please try again.');
        printFrame.remove();
        return;
    }

    frameWindow.document.open();
    frameWindow.document.write(await buildPdfReportHtml());
    frameWindow.document.close();
    await waitForFrameImagesToLoad(frameWindow.document);
    frameWindow.focus();

    const cleanup = () => {
        printFrame.remove();
    };

    frameWindow.onafterprint = cleanup;
    setTimeout(() => {
        frameWindow.print();
        setTimeout(cleanup, 2000);
    }, 250);
});



