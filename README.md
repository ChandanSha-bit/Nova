# Vaultify - Secure Chrome Extension Vault

A secure Chrome extension that provides encrypted storage for notes, links, images, and PDFs with an optional calculator disguise mode.

## Features

### 🔐 Security
- **AES-GCM Encryption**: All data encrypted using Web Crypto API
- **PBKDF2 Key Derivation**: Secure password-based key generation
- **Master Password Protection**: Single password protects all data
- **Auto-lock Timer**: Configurable automatic locking
- **Change Password**: Re-encrypt all data with new password

### 📱 Calculator Disguise Mode
- **Stealth Interface**: Looks like a regular calculator
- **Secret PIN Access**: Enter PIN to access vault (purple flash animation)
- **Real Calculator Logic**: Fully functional calculator with proper math operations
- **Expression Display**: Shows "500+200" while typing, "700" on equals

### 💾 Storage
- **IndexedDB Backend**: 500MB storage capacity
- **Binary File Support**: Encrypted storage for images and PDFs
- **Storage Monitoring**: Real-time usage indicator
- **Backup/Restore**: Export/import encrypted vault data

### 📝 Content Types
- **Notes**: Rich text notes with view/edit functionality
- **Links**: URL storage with open/copy/edit options
- **Images**: Image storage with view/download (max 50MB per file)
- **PDFs**: PDF storage with browser viewing/download (max 100MB per file)

### 🎨 Premium Dark Theme
- **Modern Design**: Dark theme with purple accents (#0F172A, #7C3AED)
- **Compact Size**: 360x520px optimized for Chrome extensions
- **Smooth Animations**: Hover effects and transitions
- **Professional UI**: Glassmorphism and gradient effects

## Installation

1. Load the extension in Chrome Developer Mode
2. Create a master password (minimum 6 characters)
3. Start adding your secure content

## Usage

### Normal Mode
1. Enter master password to unlock
2. Use tabs to navigate between content types
3. Click "+" buttons to add new items
4. Use action buttons (View, Edit, Delete) on each item

### Calculator Mode
1. Enable in Settings → Calculator Disguise Mode
2. Set a secret PIN (default: 2580)
3. Extension opens as calculator
4. Enter PIN and press "=" to access vault (purple flash)

### Settings
- **Calculator Mode**: Toggle disguise mode on/off
- **Secret PIN**: Set custom PIN for vault access
- **Auto Lock**: Configure automatic lock timer
- **Change Password**: Update master password (re-encrypts all data)
- **Backup/Restore**: Export/import vault data

## Security Notes

- All data is encrypted locally using AES-GCM
- Master password is hashed with SHA-256
- No data is sent to external servers
- IndexedDB may be cleared if browser data is cleared
- Regular backups recommended

## File Limits

- **Images**: 50MB per file
- **PDFs**: 100MB per file
- **Total Storage**: 500MB across all content
- **Notes/Links**: No specific size limits

## Technical Details

- **Encryption**: AES-GCM with PBKDF2 key derivation
- **Storage**: IndexedDB for binary file support
- **Framework**: Vanilla JavaScript (no dependencies)
- **Manifest**: Version 3 Chrome Extension

## File Structure

```
vaultify/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── popup.html             # Main popup interface
├── popup.css              # Premium dark theme styles
├── popup.js               # Main functionality
└── vault/
    ├── encrypt.js         # Encryption utilities
    ├── indexeddb.js       # Database management
    └── storage-new.js     # Storage API
```

## Version History

- **v1.0.0**: Initial release with full feature set

## License

MIT License