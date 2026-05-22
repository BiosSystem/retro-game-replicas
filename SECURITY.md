# Security Policy & Hardening (retro-game-replicas)

Security and platform integrity are core requirements for the Universal Retro Arcade. This document details our local sandboxing architectures, vulnerability audit histories, and secure runtime controls for the Phaser-based emulator dashboard.

---

## Supported Versions

Only the active release branch and tagged desktop/mobile binaries under the BiosSystem namespace are supported with security updates.

| Version | Supported |
| ------- | --------- |
| >= 1.0  | ✅ Yes    |
| < 1.0   | ❌ No     |

---

## Reporting a Vulnerability

If you discover a security vulnerability, please report it immediately. Do not open public issues on GitHub.

* **Email**: Send detailed vulnerability reports to `security@bios_system.io`.
* **Response SLA**:
  * **Acknowledgement**: Within 24 hours.
  * **Remediation Plan**: Within 3 business days.
  * **Disclosure**: Coordinated with the reporter after patches are deployed and verified.

---

## Security Architecture & Hardening History

The Universal Retro Arcade is built as a hybrid desktop/mobile application leveraging Tauri v2 and Phaser 3. It enforces the following isolation and sanitization layers:

### 1. Tauri v2 IPC Command Scoping
* **Vulnerability & Threat Vector**:
  In desktop applications built with web engines, the frontend webview context operates as the user interface. If the webview is allowed to call arbitrary shell scripts or access the host filesystem, a Cross-Site Scripting (XSS) vulnerability or malicious game package could escalate to Arbitrary Code Execution (ACE) on the user's host OS.
* **Remediation**:
  The application enforces a strictly minimized capabilities model. The Tauri configuration file `src-tauri/capabilities/main.json` restricts the frontend to a tiny set of whitelisted Rust commands (specifically reading and writing local high score files and app configurations). Remote domain execution, dynamic dynamic imports, and arbitrary CLI invocations are blocked at the Rust compiler level.

### 2. PostFX Canvas Boundary Protection
* **Vulnerability & Threat Vector**:
  The application uses a custom WebGL fragment shader to render a retro CRT scanline effect. WebGL shaders execute directly within the GPU rendering pipeline. If float coordinates or resolution parameters are handled incorrectly, they can trigger out-of-bounds frame-buffer reads, leading to GPU driver crashes or browser tab execution faults (local Denial of Service).
* **Remediation**:
  Hardened the shader pipeline by validating resolution matrices and clamping all float coordinates before rendering. The Phaser post-processing logic validates dimensions bounds to prevent buffer errors.

### 3. IndexedDB Score Verification & State Clamping
* **Vulnerability & Threat Vector**:
  High scores are saved locally in the browser's IndexedDB. Attackers could alter their local database entries to inject corrupt strings or malicious scripts, which could lead to stored XSS when the leaderboard retrieves and renders the score in the lobby.
* **Remediation**:
  All database read operations parse score inputs through a strict validation routine:
  1. Score values must be parsed as positive integers, filtering out floats, negatives, and non-numeric characters.
  2. The username and high score strings are fully escaped using standard HTML escaping (`html.escape` equivalents) before being injected into Phaser or DOM text elements, resolving XSS vulnerabilities.
  3. Replaced all occurrences of `innerHTML` with `textContent` across custom DOM counter and leaderboard components to ensure no parsing of HTML tags can occur.
