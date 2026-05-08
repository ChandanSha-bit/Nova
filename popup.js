// Main popup logic
let currentPassword = null;
let autoLockTimeout = null;

// Initialize app
async function init() {
  showScreen('splash-screen');
  
  await VaultStorage.init();
  
  setTimeout(async () => {
    const hasPassword = await VaultStorage.hasPassword();
    const settings = await VaultStorage.getSettings();
    
    if (!hasPassword) {
      showScreen('create-password-screen');
    } else if (settings.calculatorMode) {
      showScreen('calculator-screen');
    } else {
      showScreen('login-screen');
    }
  }, 1500);
}

// Screen management
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');
}

// Create password
document.getElementById('create-btn').addEventListener('click', async () => {
  const password = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-password').value;
  const errorEl = document.getElementById('create-error');

  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters';
    return;
  }

  if (password !== confirm) {
    errorEl.textContent = 'Passwords do not match';
    return;
  }

  const hash = await VaultEncrypt.hashPassword(password);
  await VaultStorage.setPasswordHash(hash);
  currentPassword = password;
  
  showScreen('dashboard-screen');
  loadDashboard();
  startAutoLock();
});

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  const hash = await VaultEncrypt.hashPassword(password);
  const storedHash = await VaultStorage.getPasswordHash();

  if (hash !== storedHash) {
    errorEl.textContent = 'Incorrect password';
    return;
  }

  currentPassword = password;
  showScreen('dashboard-screen');
  loadDashboard();
  startAutoLock();
});

// Calculator mode
let calcExpression = '';
let calcResult = null;
let showingResult = false;

function initCalculator() {
  const display = document.getElementById('calc-display');
  display.value = '';
  
  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const value = btn.textContent;
      
      if (value === 'C') {
        calcExpression = '';
        calcResult = null;
        showingResult = false;
        display.value = '';
      } else if (value === '=') {
        // Check for secret PIN first
        const settings = await VaultStorage.getSettings();
        if (calcExpression === settings.calculatorPin) {
          // Success animation
          document.body.style.transition = 'background 0.5s';
          document.body.style.background = 'var(--primary)';
          setTimeout(() => {
            document.body.style.background = '';
            showScreen('login-screen');
          }, 300);
          calcExpression = '';
          display.value = '';
          return;
        }
        
        // Calculate result
        try {
          if (calcExpression) {
            // Replace visual operators with JS operators
            let jsExpr = calcExpression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
            calcResult = eval(jsExpr);
            display.value = calcResult;
            showingResult = true;
          }
        } catch (error) {
          display.value = 'Error';
          calcExpression = '';
          showingResult = false;
        }
      } else if (['+', '−', '×', '÷'].includes(value)) {
        if (showingResult && calcResult !== null) {
          calcExpression = calcResult + value;
          showingResult = false;
        } else if (calcExpression && !['+', '−', '×', '÷'].includes(calcExpression.slice(-1))) {
          calcExpression += value;
        } else if (calcExpression === '' && value === '−') {
           calcExpression = '−';
        }
        display.value = calcExpression;
      } else if (value === '+/-') {
          if (calcExpression.startsWith('−')) calcExpression = calcExpression.substring(1);
          else calcExpression = '−' + calcExpression;
          display.value = calcExpression;
      } else if (value === '%') {
          try {
              let jsExpr = calcExpression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
              calcResult = eval(jsExpr) / 100;
              display.value = calcResult;
              calcExpression = calcResult.toString();
              showingResult = true;
          } catch(e) { display.value = 'Error'; }
      } else {
        // Number or decimal point
        if (showingResult) {
          calcExpression = value;
          showingResult = false;
        } else {
          calcExpression += value;
        }
        display.value = calcExpression;
      }
    });
  });
}

setTimeout(initCalculator, 100);

// Dashboard tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
    
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab + '-tab').classList.remove('hidden');
    
    // Load data for that tab
    if (tab.dataset.tab === 'notes') loadNotes();
    else if (tab.dataset.tab === 'links') loadLinks();
    else if (tab.dataset.tab === 'images') loadImages();
    else if (tab.dataset.tab === 'pdfs') loadPDFs();
  });
});

// Load dashboard
async function loadDashboard() {
  await loadNotes();
  await updateStorageInfo();
}

async function loadNotes() {
  const container = document.getElementById('notes-list');
  container.innerHTML = '';
  
  const notes = await VaultStorage.getAllNotes();
  
  if (notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <p class="empty-text">No encrypted notes found.<br>Use the + button to create one.</p>
      </div>
    `;
    return;
  }
  
  for (const note of notes) {
    const title = await VaultEncrypt.decrypt(note.title, currentPassword);
    const content = await VaultEncrypt.decrypt(note.content, currentPassword);
    
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <h4>${title}</h4>
      <p>${content.substring(0, 80)}${content.length > 80 ? '...' : ''}</p>
      <div class="item-actions">
        <button onclick="viewNote('${note.id}')">View</button>
        <button onclick="editNote('${note.id}')">Edit</button>
        <button onclick="deleteNote('${note.id}')" class="delete-btn">Delete</button>
      </div>
    `;
    container.appendChild(div);
  }
}

async function loadLinks() {
  const container = document.getElementById('links-list');
  container.innerHTML = '';
  
  const links = await VaultStorage.getAllLinks();
  
  if (links.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔗</div>
        <p class="empty-text">No secure links indexed.</p>
      </div>
    `;
    return;
  }
  
  for (const link of links) {
    const title = await VaultEncrypt.decrypt(link.title, currentPassword);
    const url = await VaultEncrypt.decrypt(link.url, currentPassword);
    
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <h4>${title}</h4>
      <p><a href="${url}" target="_blank">${url}</a></p>
      <div class="item-actions">
        <button onclick="window.open('${url}', '_blank')">Open</button>
        <button onclick="copyToClipboard('${url}')">Copy</button>
        <button onclick="editLink('${link.id}')">Edit</button>
        <button onclick="deleteLink('${link.id}')" class="delete-btn">Delete</button>
      </div>
    `;
    container.appendChild(div);
  }
}

async function loadImages() {
  const container = document.getElementById('images-list');
  container.innerHTML = '';
  
  const images = await VaultStorage.getFilesByType('image');
  
  if (images.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🖼️</div>
        <p class="empty-text">Private gallery is empty.</p>
      </div>
    `;
    return;
  }
  
  for (const image of images) {
    const title = await VaultEncrypt.decrypt(image.title, currentPassword);
    const data = await VaultEncrypt.decrypt(image.data, currentPassword);
    
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <h4>${title}</h4>
      <img src="${data}" onclick="viewImage('${data}', '${title}')" />
      <div class="item-actions">
        <button onclick="viewImage('${data}', '${title}')" title="View">View</button>
        <button onclick="downloadFile('${data}', '${title}.png')" title="Download">Save</button>
        <button onclick="deleteFile('${image.id}')" class="delete-btn" title="Delete">Del</button>
      </div>
    `;
    container.appendChild(div);
  }
}

async function loadPDFs() {
  const container = document.getElementById('pdfs-list');
  container.innerHTML = '';
  
  const pdfs = await VaultStorage.getFilesByType('pdf');
  
  if (pdfs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <p class="empty-text">No secure documents stored.</p>
      </div>
    `;
    return;
  }
  
  for (const pdf of pdfs) {
    const title = await VaultEncrypt.decrypt(pdf.title, currentPassword);
    const data = await VaultEncrypt.decrypt(pdf.data, currentPassword);
    
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <h4>${title}</h4>
      <p>📄 PDF Document</p>
      <div class="item-actions">
        <button onclick="viewPDF('${data}')">Open</button>
        <button onclick="downloadFile('${data}', '${title}.pdf')">Download</button>
        <button onclick="deleteFile('${pdf.id}')" class="delete-btn">Delete</button>
      </div>
    `;
    container.appendChild(div);
  }
}

// Helper functions
function viewImage(data, title) {
  const modal = document.createElement('div');
  modal.className = 'modal image-viewer-modal';
  modal.innerHTML = `
    <div class="modal-content glass">
      <div class="modal-header">
        <h3>${title}</h3>
      </div>
      <div class="modal-body">
        <img src="${data}" />
      </div>
      <div class="modal-actions">
        <button class="primary-btn close-image-btn">Close</button>
      </div>
    </div>
  `;
  
  const closeBtn = modal.querySelector('.close-image-btn');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  document.body.appendChild(modal);
}

function viewPDF(data) {
  // Convert base64 to blob URL for proper PDF viewing
  try {
    const byteCharacters = atob(data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error opening PDF:', error);
    alert('Error opening PDF file');
  }
}

function downloadFile(data, filename) {
  const a = document.createElement('a');
  a.href = data;
  a.download = filename;
  a.click();
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show brief success message
    const msg = document.createElement('div');
    msg.textContent = 'Copied!';
    msg.style.cssText = 'position:fixed;top:10px;right:10px;background:#10B981;color:white;padding:8px 12px;border-radius:4px;z-index:9999;';
    document.body.appendChild(msg);
    setTimeout(() => document.body.removeChild(msg), 2000);
  });
}

async function deleteNote(id) {
  if (confirm('Delete this note?')) {
    await VaultStorage.deleteNote(id);
    await loadNotes();
    await updateStorageInfo();
  }
}

async function deleteLink(id) {
  if (confirm('Delete this link?')) {
    await VaultStorage.deleteLink(id);
    await loadLinks();
    await updateStorageInfo();
  }
}

async function deleteFile(id) {
  if (confirm('Delete this file?')) {
    await VaultStorage.deleteFile(id);
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    if (activeTab === 'images') await loadImages();
    else if (activeTab === 'pdfs') await loadPDFs();
    await updateStorageInfo();
  }
}

// View and edit functions
async function viewNote(id) {
  const note = await VaultDB.getItem('notes', id);
  const title = await VaultEncrypt.decrypt(note.title, currentPassword);
  const content = await VaultEncrypt.decrypt(note.content, currentPassword);
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="screen-header" style="margin-bottom: 12px; text-align: left;">
        <h3 style="font-size: 16px;">${title}</h3>
      </div>
      <div class="modal-body note-view-content" style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); font-family: inherit;">
        ${content}
      </div>
      <div class="modal-actions" style="margin-top: 15px;">
        <button class="primary-btn" onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function editNote(id) {
  const note = await VaultDB.getItem('notes', id);
  const title = await VaultEncrypt.decrypt(note.title, currentPassword);
  const content = await VaultEncrypt.decrypt(note.content, currentPassword);
  
  document.getElementById('note-title').value = title;
  document.getElementById('note-content').value = content;
  document.getElementById('note-modal').classList.remove('hidden');
  
  // Change save button to update
  const saveBtn = document.getElementById('save-note-btn');
  saveBtn.textContent = 'Update';
  saveBtn.onclick = async () => {
    const newTitle = document.getElementById('note-title').value;
    const newContent = document.getElementById('note-content').value;
    
    if (!newTitle || !newContent) {
      alert('Please enter title and content');
      return;
    }
    
    // Delete old note and add updated one
    await VaultStorage.deleteNote(id);
    await VaultStorage.addNote(newTitle, newContent, currentPassword);
    
    document.getElementById('note-modal').classList.add('hidden');
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = null; // Reset to original handler
    await loadNotes();
  };
}

async function editLink(id) {
  const link = await VaultDB.getItem('links', id);
  const title = await VaultEncrypt.decrypt(link.title, currentPassword);
  const url = await VaultEncrypt.decrypt(link.url, currentPassword);
  
  document.getElementById('link-title').value = title;
  document.getElementById('link-url').value = url;
  document.getElementById('link-modal').classList.remove('hidden');
  
  // Change save button to update
  const saveBtn = document.getElementById('save-link-btn');
  saveBtn.textContent = 'Update';
  saveBtn.onclick = async () => {
    const newTitle = document.getElementById('link-title').value;
    const newUrl = document.getElementById('link-url').value;
    
    if (!newTitle || !newUrl) {
      alert('Please enter title and URL');
      return;
    }
    
    // Delete old link and add updated one
    await VaultStorage.deleteLink(id);
    await VaultStorage.addLink(newTitle, newUrl, currentPassword);
    
    document.getElementById('link-modal').classList.add('hidden');
    document.getElementById('link-title').value = '';
    document.getElementById('link-url').value = '';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = null; // Reset to original handler
    await loadLinks();
  };
}

// Add note
document.getElementById('add-note-btn').addEventListener('click', () => {
  document.getElementById('note-modal').classList.remove('hidden');
});

document.getElementById('save-note-btn').addEventListener('click', async () => {
  const title = document.getElementById('note-title').value;
  const content = document.getElementById('note-content').value;
  
  if (!title || !content) {
    alert('Please enter title and content');
    return;
  }
  
  await VaultStorage.addNote(title, content, currentPassword);
  
  document.getElementById('note-modal').classList.add('hidden');
  document.getElementById('note-title').value = '';
  document.getElementById('note-content').value = '';
  await loadNotes();
  await updateStorageInfo();
});

document.getElementById('cancel-note-btn').addEventListener('click', () => {
  document.getElementById('note-modal').classList.add('hidden');
  document.getElementById('note-title').value = '';
  document.getElementById('note-content').value = '';
});

// Add link
document.getElementById('add-link-btn').addEventListener('click', () => {
  document.getElementById('link-modal').classList.remove('hidden');
});

document.getElementById('save-link-btn').addEventListener('click', async () => {
  const title = document.getElementById('link-title').value;
  const url = document.getElementById('link-url').value;
  
  if (!title || !url) {
    alert('Please enter title and URL');
    return;
  }
  
  await VaultStorage.addLink(title, url, currentPassword);
  
  document.getElementById('link-modal').classList.add('hidden');
  document.getElementById('link-title').value = '';
  document.getElementById('link-url').value = '';
  await loadLinks();
  await updateStorageInfo();
});

document.getElementById('cancel-link-btn').addEventListener('click', () => {
  document.getElementById('link-modal').classList.add('hidden');
  document.getElementById('link-title').value = '';
  document.getElementById('link-url').value = '';
});

// Add image
document.getElementById('add-image-btn').addEventListener('click', () => {
  document.getElementById('image-modal').classList.remove('hidden');
});

document.getElementById('save-image-btn').addEventListener('click', async () => {
  const title = document.getElementById('image-title').value;
  const file = document.getElementById('image-file').files[0];
  
  if (!title || !file) {
    alert('Please enter a title and select an image');
    return;
  }
  
  if (file.size > 50 * 1024 * 1024) {
    alert('Image is too large. Maximum size is 50MB.');
    return;
  }
  
  try {
    // Check storage limit
    const canAdd = await VaultDB.canAddFile(file.size);
    if (!canAdd) {
      alert('Storage limit exceeded. Maximum total storage is 500MB.');
      return;
    }
    
    const base64 = await fileToBase64(file);
    await VaultStorage.addFile(title, base64, 'image', file.size, currentPassword);
    
    document.getElementById('image-modal').classList.add('hidden');
    document.getElementById('image-title').value = '';
    document.getElementById('image-file').value = '';
    await loadImages();
    await updateStorageInfo();
  } catch (error) {
    console.error('Error saving image:', error);
    alert('Error saving image: ' + error.message);
  }
});

document.getElementById('cancel-image-btn').addEventListener('click', () => {
  document.getElementById('image-modal').classList.add('hidden');
  document.getElementById('image-title').value = '';
  document.getElementById('image-file').value = '';
});

// Add PDF
document.getElementById('add-pdf-btn').addEventListener('click', () => {
  document.getElementById('pdf-modal').classList.remove('hidden');
});

document.getElementById('save-pdf-btn').addEventListener('click', async () => {
  const title = document.getElementById('pdf-title').value;
  const file = document.getElementById('pdf-file').files[0];
  
  if (!title || !file) {
    alert('Please enter a title and select a PDF');
    return;
  }
  
  if (file.size > 100 * 1024 * 1024) {
    alert('PDF is too large. Maximum size is 100MB.');
    return;
  }
  
  try {
    // Check storage limit
    const canAdd = await VaultDB.canAddFile(file.size);
    if (!canAdd) {
      alert('Storage limit exceeded. Maximum total storage is 500MB.');
      return;
    }
    
    const base64 = await fileToBase64(file);
    await VaultStorage.addFile(title, base64, 'pdf', file.size, currentPassword);
    
    document.getElementById('pdf-modal').classList.add('hidden');
    document.getElementById('pdf-title').value = '';
    document.getElementById('pdf-file').value = '';
    await loadPDFs();
    await updateStorageInfo();
  } catch (error) {
    console.error('Error saving PDF:', error);
    alert('Error saving PDF: ' + error.message);
  }
});

document.getElementById('cancel-pdf-btn').addEventListener('click', () => {
  document.getElementById('pdf-modal').classList.add('hidden');
  document.getElementById('pdf-title').value = '';
  document.getElementById('pdf-file').value = '';
});

// Helper function
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Settings
document.getElementById('settings-btn').addEventListener('click', async () => {
  const settings = await VaultStorage.getSettings();
  document.getElementById('calculator-mode-toggle').checked = settings.calculatorMode;
  document.getElementById('calculator-pin').value = settings.calculatorPin;
  document.getElementById('auto-lock-timer').value = settings.autoLockTimer;
  document.getElementById('settings-modal').classList.remove('hidden');
});

document.getElementById('save-settings-btn').addEventListener('click', async () => {
  const settings = {
    calculatorMode: document.getElementById('calculator-mode-toggle').checked,
    calculatorPin: document.getElementById('calculator-pin').value,
    autoLockTimer: parseInt(document.getElementById('auto-lock-timer').value)
  };
  
  await VaultStorage.saveSettings(settings);
  document.getElementById('settings-modal').classList.add('hidden');
  startAutoLock();
});

// Close settings modal by clicking outside
document.getElementById('settings-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('settings-modal')) {
    document.getElementById('settings-modal').classList.add('hidden');
  }
});

// Change password functionality
document.getElementById('change-password-btn').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.add('hidden');
  document.getElementById('change-password-modal').classList.remove('hidden');
});

document.getElementById('save-new-password-btn').addEventListener('click', async () => {
  const currentPwd = document.getElementById('current-password').value;
  const newPwd = document.getElementById('new-password-change').value;
  const confirmPwd = document.getElementById('confirm-new-password').value;
  const errorEl = document.getElementById('change-password-error');

  // Validate current password
  const currentHash = await VaultEncrypt.hashPassword(currentPwd);
  const storedHash = await VaultStorage.getPasswordHash();
  
  if (currentHash !== storedHash) {
    errorEl.textContent = 'Current password is incorrect';
    return;
  }

  if (newPwd.length < 6) {
    errorEl.textContent = 'New password must be at least 6 characters';
    return;
  }

  if (newPwd !== confirmPwd) {
    errorEl.textContent = 'New passwords do not match';
    return;
  }

  try {
    // Re-encrypt all data with new password
    await reencryptAllData(currentPwd, newPwd);
    
    // Update password hash
    const newHash = await VaultEncrypt.hashPassword(newPwd);
    await VaultStorage.setPasswordHash(newHash);
    
    // Update current password
    currentPassword = newPwd;
    
    // Close modal and clear fields
    document.getElementById('change-password-modal').classList.add('hidden');
    document.getElementById('current-password').value = '';
    document.getElementById('new-password-change').value = '';
    document.getElementById('confirm-new-password').value = '';
    errorEl.textContent = '';
    
    alert('Password changed successfully!');
  } catch (error) {
    errorEl.textContent = 'Error changing password: ' + error.message;
  }
});

document.getElementById('cancel-change-password-btn').addEventListener('click', () => {
  document.getElementById('change-password-modal').classList.add('hidden');
  document.getElementById('current-password').value = '';
  document.getElementById('new-password-change').value = '';
  document.getElementById('confirm-new-password').value = '';
  document.getElementById('change-password-error').textContent = '';
});

// Re-encrypt all data with new password
async function reencryptAllData(oldPassword, newPassword) {
  // Re-encrypt notes
  const notes = await VaultStorage.getAllNotes();
  for (const note of notes) {
    const title = await VaultEncrypt.decrypt(note.title, oldPassword);
    const content = await VaultEncrypt.decrypt(note.content, oldPassword);
    
    note.title = await VaultEncrypt.encrypt(title, newPassword);
    note.content = await VaultEncrypt.encrypt(content, newPassword);
    
    await VaultDB.addItem('notes', note);
  }

  // Re-encrypt links
  const links = await VaultStorage.getAllLinks();
  for (const link of links) {
    const title = await VaultEncrypt.decrypt(link.title, oldPassword);
    const url = await VaultEncrypt.decrypt(link.url, oldPassword);
    
    link.title = await VaultEncrypt.encrypt(title, newPassword);
    link.url = await VaultEncrypt.encrypt(url, newPassword);
    
    await VaultDB.addItem('links', link);
  }

  // Re-encrypt files
  const files = await VaultDB.getAllFiles();
  for (const file of files) {
    const title = await VaultEncrypt.decrypt(file.title, oldPassword);
    const data = await VaultEncrypt.decrypt(file.data, oldPassword);
    
    file.title = await VaultEncrypt.encrypt(title, newPassword);
    file.data = await VaultEncrypt.encrypt(data, newPassword);
    
    await VaultDB.addItem('files', file);
  }
}

// Export/Import
document.getElementById('export-vault-btn').addEventListener('click', async () => {
  await VaultStorage.exportVault();
  alert('Vault exported successfully!');
});

document.getElementById('import-vault-btn').addEventListener('click', () => {
  document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  if (confirm('This will replace all current data. Continue?')) {
    try {
      await VaultStorage.importVault(file);
      alert('Vault imported successfully!');
      loadDashboard();
    } catch (error) {
      alert('Import failed: ' + error.message);
    }
  }
  e.target.value = '';
});

// Storage info
async function updateStorageInfo() {
  const info = await VaultStorage.getStorageInfo();
  const bar = document.getElementById('storage-bar');
  const text = document.getElementById('storage-text');
  const percentText = document.getElementById('storage-percent');
  
  bar.style.width = info.percentage + '%';
  text.textContent = `${info.usedMB} MB / ${info.limitMB} MB used`;
  percentText.textContent = `${info.percentage}%`;
}

// Auto lock
function startAutoLock() {
  if (autoLockTimeout) clearTimeout(autoLockTimeout);
  
  VaultStorage.getSettings().then(settings => {
    autoLockTimeout = setTimeout(() => {
      currentPassword = null;
      showScreen('login-screen');
    }, settings.autoLockTimer * 1000);
  });
}

document.addEventListener('mousemove', startAutoLock);
document.addEventListener('keypress', startAutoLock);

// Initialize
init();