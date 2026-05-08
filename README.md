# <p align="center">Nova — Next-Gen Privacy Vault</p>

<p align="center">
  <img src="assets/nova_logo_final.png" alt="Nova Logo" width="120">
</p>

<p align="center">
  <strong>Secure, encrypted, and stealthy storage for your digital sanctuary.</strong>
</p>

---

## 🛡️ Overview

**Nova** is a high-performance Chrome extension designed for users who prioritize absolute privacy. Built on a foundation of military-grade encryption and a sophisticated "Calculator Disguise" mechanism, Nova provides a secure environment to store sensitive notes, bookmarks, images, and documents directly within your browser.

## 🚀 Key Pillars

### 1. Absolute Security
Nova utilizes the **Web Crypto API** to implement **AES-GCM 256-bit encryption**. Every byte of your data is encrypted locally using a key derived via **PBKDF2**, ensuring that your information never leaves your machine in an unencrypted state.

### 2. Stealth & Disguise
Engineered for discretion, Nova can operate as a fully functional **Scientific Calculator**. Only your unique Secret PIN unlocks the transition to the vault, featuring high-end animations and zero traces of its true purpose to the casual observer.

### 3. Professional UX
A minimalist, cobalt-themed interface designed for efficiency. Nova features a compact **320x500px** footprint, staggered micro-animations, and an optimized **2x2 Grid Gallery** for visual assets.

---

## ✨ Core Features

### 🔐 Cryptographic Vault
- **Hardware-Accelerated Encryption**: Leverages modern CPU instructions for seamless encryption/decryption.
- **Local-Only Storage**: 100% offline architecture; Nova does not utilize external servers, eliminating cloud-based vulnerabilities.
- **Automatic Session Management**: Configurable auto-lock timers to protect your data during inactivity.

### 🧮 Disguise Engine
- **Scientific Calculator Overlay**: Fully functional mathematical logic to maintain the "Nova Series-X" facade.
- **Stealth Trigger**: Access your vault by entering your PIN and pressing the equals (`=`) operator.
- **Visual Feedback**: Subtle "Nova pulse" animations during successful authentication.

### 💾 Versatile Storage (IndexedDB)
- **Document Management**: Encrypted PDF viewing and secure downloads (up to 100MB per file).
- **Gallery Grid**: Compact 2x2 layout for private images with instant decryption on-view.
- **Rich Notes & Bookmarks**: Categorized storage for sensitive text data and private URLs.
- **Capacity Monitoring**: Real-time storage telemetry with a 500MB dedicated quota.

---

## 🛠️ Technical Specification

| Component | Technology |
| :--- | :--- |
| **Encryption Standard** | AES-GCM (Advanced Encryption Standard) |
| **Key Derivation** | PBKDF2 with SHA-256 |
| **Database** | IndexedDB (NovaDB) |
| **UI Framework** | Vanilla JavaScript / CSS3 (No dependencies) |
| **Manifest Version** | Manifest V3 (MV3) |

---

## 📥 Installation

1.  **Clone/Download** this repository to your local machine.
2.  Open **Chrome** and navigate to `chrome://extensions/`.
3.  Enable **Developer Mode** (top-right toggle).
4.  Click **Load unpacked** and select the root directory of this project.
5.  Pin **Nova** to your toolbar for instant access.

---

## 📖 Usage Guide

### Initial Setup
Upon first launch, you will be prompted to create a **Master Password**. This password is the foundation of your encryption key—choose a strong, unique phrase.

### Disguise Configuration
1.  Navigate to **Settings** (⚙️ icon).
2.  Toggle **Disguise Mode** to "On".
3.  Set your **Secret PIN** (e.g., `2580`).
4.  Apply changes. Nova will now launch as a calculator.

### Managing Assets
- Use the **Nav Tabs** to switch between Notes, Links, Images, and Docs.
- Click the **Floating Action Button (+)** to add new encrypted items.
- Use the **Action Icons** (👁️ View, 💾 Save, 🗑️ Delete) to manage individual assets.

---

## 📄 License

Nova is released under the **MIT License**. Your privacy is your own; Nova simply provides the tools to protect it.

---

<p align="center">
  Developed with focus on privacy and performance. 🛡️
</p>