// IndexedDB management for Vaultify
// Stores encrypted binary files with 500MB total cap

const VaultDB = {
  dbName: 'VaultifyDB',
  version: 1,
  db: null,
  STORAGE_LIMIT: 500 * 1024 * 1024, // 500MB

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('links')) {
          db.createObjectStore('links', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('type', 'type', { unique: false });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  },

  // Get total storage used
  async getStorageUsed() {
    const files = await this.getAllFiles();
    let total = 0;
    for (const file of files) {
      total += file.size || 0;
    }
    return total;
  },

  // Check if storage limit exceeded
  async canAddFile(fileSize) {
    const used = await this.getStorageUsed();
    return (used + fileSize) <= this.STORAGE_LIMIT;
  },

  // Add item to store
  async addItem(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  },

  // Get all items from store
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  // Delete item from store
  async deleteItem(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Get item by ID
  async getItem(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // File-specific methods
  async addFile(file) {
    const canAdd = await this.canAddFile(file.size);
    if (!canAdd) {
      throw new Error('Storage limit exceeded (500MB max)');
    }
    return this.addItem('files', file);
  },

  async getAllFiles() {
    return this.getAll('files');
  },

  async getFilesByType(type) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteFile(id) {
    return this.deleteItem('files', id);
  },

  // Notes methods
  async addNote(note) {
    return this.addItem('notes', note);
  },

  async getAllNotes() {
    return this.getAll('notes');
  },

  async deleteNote(id) {
    return this.deleteItem('notes', id);
  },

  // Links methods
  async addLink(link) {
    return this.addItem('links', link);
  },

  async getAllLinks() {
    return this.getAll('links');
  },

  async deleteLink(id) {
    return this.deleteItem('links', id);
  },

  // Metadata methods (for settings, password hash, etc.)
  async setMetadata(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getMetadata(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  },

  // Check if backup is needed (remind every 7 days)
  async shouldRemindBackup() {
    const lastBackup = await this.getMetadata('lastBackupReminder');
    if (!lastBackup) return true;
    
    const daysSinceBackup = (Date.now() - lastBackup) / (1000 * 60 * 60 * 24);
    return daysSinceBackup >= 7;
  },

  async updateBackupReminder() {
    await this.setMetadata('lastBackupReminder', Date.now());
  },

  // Export all data (for backup)
  async exportVault() {
    const notes = await this.getAllNotes();
    const links = await this.getAllLinks();
    const files = await this.getAllFiles();
    const settings = await this.getMetadata('settings');
    const passwordHash = await this.getMetadata('passwordHash');

    return {
      version: 1,
      exportDate: Date.now(),
      notes,
      links,
      files,
      settings,
      passwordHash
    };
  },

  // Import data (from backup)
  async importVault(data) {
    // Clear existing data
    await this.clearAll();

    // Import notes
    for (const note of data.notes || []) {
      await this.addNote(note);
    }

    // Import links
    for (const link of data.links || []) {
      await this.addLink(link);
    }

    // Import files
    for (const file of data.files || []) {
      await this.addFile(file);
    }

    // Import metadata
    if (data.settings) {
      await this.setMetadata('settings', data.settings);
    }
    if (data.passwordHash) {
      await this.setMetadata('passwordHash', data.passwordHash);
    }
  },

  // Clear all data
  async clearAll() {
    const stores = ['notes', 'links', 'files', 'metadata'];
    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
};
