# Security Policy

## Supported Versions

The following versions of the Universal Retro Arcade are currently supported with security updates:

| Version | Supported |
| ------- | --------- |
| >= 1.0  | ✅ Yes    |
| < 1.0   | ❌ No     |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it immediately. Do not open a public issue on GitHub.

*   **Email**: Send reports to `security@bios_system.io`
*   **Response Time**: We acknowledge receipt of reports within 24 hours and aim to provide a remediation plan within 3 business days.

---

## Security Architecture & Defences

The Universal Retro Arcade is built as a hybrid desktop/mobile app utilizing Tauri v2 and Phaser. It implements the following security controls:

### 1. Tauri v2 IPC Command Whitelisting
* **Mechanism**: To prevent arbitrary code execution on the host OS from the webview context, the application enforces a strict, minimized Tauri capability model.
* **Control**: Only explicitly defined frontend-to-backend Rust commands (e.g. fetching persistent high scores or loading local game assets) are whitelisted in `capabilities/main.json`. Remote URLs or unauthorized commands are blocked at the Rust layer.

### 2. PostFX Canvas Boundary Protection
* **Mechanism**: The post-processing GLSL CRT shader pipeline operates directly on WebGL buffers. Improper handling of coordinate matrices can lead to out-of-bounds read/write issues on the GPU or browser crashes (DoS).
* **Control**: Shader variable ranges and the post-processing pipeline bounds check resolution matrices before applying postFX, preventing canvas frame buffer overflow crashes.

### 3. State Sanitization & Anti-Tampering (IndexedDB)
* **Mechanism**: High scores and game states are saved locally in the browser's IndexedDB. Attackers might attempt to inject corrupt JSON strings or malicious scripts.
* **Control**: All state loads are passed through strict type checks and value clamp validations. Score values are parsed as bounded integers, rejecting negative values, floats, or scripts.

