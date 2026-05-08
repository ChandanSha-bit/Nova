// New storage management using IndexedDB
// Replaces chrome.storage.local for better capacity and binary file support

const VaultStorage = {
  initialized: false,

  // Initialize storage
  async init() {
    if (this.initialized) return;
    await VaultDB.init();
    this.initialized = true;
  },

  // Password management
  async setPasswordHash(hash) {
    await VaultDB.setMetadata('passwordHash', hash);
  },

  async getPasswordHash() {
    return await VaultDB.getMetadata('passwordHash');
  },

  async hasPassword() {
    const hash = await this.getPasswordHash();
    return !!hash;
  },

  // Settings management
  async getSettings() {
    const settings = await VaultDB.getMetadata('settings');
    return settings || {
      calculatorMode: false,
      calculatorPin: '2580',
      autoLockTimer: 60
    };
  },

  async saveSettings(settings) {
    await VaultDB.setMetadata('settings', settings);
  },

  // Notes
  async addNote(title, content, password) {
    const encryptedTitle = await VaultEncrypt.encrypt(title, password);
    const encryptedContent = await VaultEncrypt.encrypt(content, password);

    const note = {
      id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 11),
      title: encryptedTitle,
      content: encryptedContent,
      createdAt: Date.now()
    };

    return await VaultDB.addNote(note);
  },

  async getAllNotes() {
    return await VaultDB.getAllNotes();
  },

  async deleteNote(id) {
    return await VaultDB.deleteNote(id);
  },

  // Links
  async addLink(title, url, password) {
    const encryptedTitle = await VaultEncrypt.encrypt(title, password);
    const encryptedUrl = await VaultEncrypt.encrypt(url, password);

    const link = {
      id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 11),
      title: encryptedTitle,
      url: encryptedUrl,
      createdAt: Date.now()
    };

    return await VaultDB.addLink(link);
  },

  async getAllLinks() {
    return await VaultDB.getAllLinks();
  },

  async deleteLink(id) {
    return await VaultDB.deleteLink(id);
  },

  // Files (images, PDFs, videos)
  async addFile(title, fileData, fileType, fileSize, password) {
    // Encrypt the file data (base64 string)
    const encryptedTitle = await VaultEncrypt.encrypt(title, password);
    const encryptedData = await VaultEncrypt.encrypt(fileData, password);

    const file = {
      id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 11),
      title: encryptedTitle,
      data: encryptedData,
      type: fileType, // 'image', 'pdf', 'video'
      size: fileSize,
      createdAt: Date.now()
    };

    return await VaultDB.addFile(file);
  },

  async getFilesByType(type) {
    return await VaultDB.getFilesByType(type);
  },

  async deleteFile(id) {
    return await VaultDB.deleteFile(id);
  },

  // Storage info
  async getStorageInfo() {
    const used = await VaultDB.getStorageUsed();
    const limit = VaultDB.STORAGE_LIMIT;
    const percentage = (used / limit) * 100;

    return {
      used,
      limit,
      percentage: percentage.toFixed(2),
      usedMB: (used / (1024 * 1024)).toFixed(2),
      limitMB: (limit / (1024 * 1024)).toFixed(0)
    };
  },

  // Export vault (for backup)
  async exportVault() {
    const data = await VaultDB.exportVault();
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-backup-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    // Update backup reminder timestamp
    await VaultDB.updateBackupReminder();
  },

  // Import vault (from backup)
  async importVault(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await VaultDB.importVault(data);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  },

  // Check if backup reminder is needed
  async shouldShowBackupReminder() {
    return await VaultDB.shouldRemindBackup();
  }
};
