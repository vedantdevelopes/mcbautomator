# 🏫 Meridian School MyClassboard Fixed Asset Automation Suite

A zero-installation, 100% in-browser automation web application and bookmarklet assistant designed for **Meridian School, Madhapur** to automate Fixed Asset creation in **MyClassboard ERP** (`meridian.myclassboard.com`).

---

## 🌟 Key Features

* **No Python, No Node.js, No Installation**: Runs 100% client-side in Google Chrome, Microsoft Edge, or any modern web browser.
* **Hosted Directly on GitHub Pages**: Free static hosting with zero maintenance.
* **Auto-Detects Last Number**: Scans the active MyClassboard inventory table, extracts the previous room unit index (e.g. `05` &rarr; `06`) and global serial ID (e.g. `477` &rarr; `478`), and automatically sets the next numbers.
* **Grade & Section Customization**: Enter Grade (e.g., `3`) and Section (e.g., `D`), and the assistant formats everything to standard: `MM/3d-06/FURN/ST/478`.
* **Full Item Type Catalog with Dropdown**:
  * `STUDENT TABLES` (Code: `ST`)
  * `STUDENT CHAIRS` (Code: `SC`)
  * `EXECUTIVE CHAIRS` (Code: `EC`)
  * `EXECUTIVE TABLES` (Code: `ET`)
  * `VISITOR CHAIRS` (Code: `VC`)
  * `GREEN / WHITE BOARDS` (Code: `BD`)
  * `TEACHER TABLES` (Code: `TT`)
  * `CUPBOARDS` (Code: `CP`)
  * *Custom Item Types*
* **Continuous Auto-Entry Loop**: Specify your target unit (e.g. up to unit `30`), click **Start Automation**, and the assistant automatically creates and saves each item in MyClassboard, handles confirmation popups, and tracks progress.
* **CSV / Excel Export**: One-click download of the complete planned inventory sheet.

---

## 📹 Video Workflow Analysis (Lakshmi Ma'am Standard)

From the analysis of `WhatsApp Video 2026-11-10 at 2.28.00 PM.mp4`:
* **Module**: `Inventory` &rarr; `Asset Management` &rarr; `Fixed Assets Management` (`Fixed Asset Items` tab)
* **Store / Branch**: `CENTRAL STORE` / `Meridian School. Madhapur`
* **Naming Formula**: `MM/<Grade><Section>-<Unit>/<Category>/<TypeCode>/<GlobalID>`
  * Example: `MM/3d-06/FURN/ST/478`
* **Asset Tag Formula**: `MM/MM-<GlobalID>` (e.g. `MM/MM-478`)
* **Standard Settings Applied**:
  * Category: `ASSETS-MADHAPUR`
  * Sub Category: `FURNITURES`
  * Classification: `General`
  * UOM: `Nos`
  * GST: `0%`
  * Depreciation Method: `Straight Line Depreciation Method` @ `1%`
  * Returnable: `No` | Warranty: `No` | Service: `No`

---

## 🚀 How to Host on GitHub Pages (1-Minute Setup)

1. Create a new GitHub repository (e.g., `meridian-asset-assistant`).
2. Push all the files in this folder to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Meridian Asset Automation Suite"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. In your GitHub repository, click **Settings** &rarr; **Pages** (on the left menu).
4. Under **Build and deployment &rarr; Branch**, select `main` (or `master`) and directory `/ (root)`, then click **Save**.
5. Within ~60 seconds, your site will be live at:
   `https://<your-username>.github.io/<your-repo-name>/`

---

## 💻 How to Use the Automation (3 Easy Ways)

### Method 1: 1-Click Bookmarklet (Recommended)
1. Open the hosted website.
2. Drag the green **"🚀 MCB Auto Asset (Drag Me)"** button into your browser's Bookmarks bar.
3. Open `meridian.myclassboard.com/Home/Inventory` and log in.
4. Click **MCB Auto Asset** in your bookmarks bar.
5. The floating assistant window appears on top of MyClassboard.
6. Click **🔍 Detect Last Number** &rarr; Verify your Grade, Section, and Target Unit &rarr; Click **🚀 Start Automation**!

### Method 2: Browser DevTools Console (F12)
1. On the hosted website, click **📋 Copy Console Script**.
2. Open MyClassboard on `Inventory` &rarr; `Fixed Assets Management`.
3. Press `F12` (or right-click &rarr; *Inspect* &rarr; *Console*).
4. Paste the script and press `Enter`.

### Method 3: Chrome / Edge Extension
1. Open Chrome/Edge and go to `chrome://extensions`.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked** (top-left) and select the `extension/` folder from this repo.
4. Click the extension icon on any MyClassboard inventory page to launch the assistant.

---

## 📁 Repository Structure

```text
├── index.html                  # Main Web App UI for GitHub Pages
├── style.css                   # Modern styling & responsive layouts
├── app.js                      # Form generator, formula parser & CSV exporter
├── mcb-automation-runner.js    # Core DOM automation engine for MyClassboard
├── extension/                  # Complete Chrome / Edge Extension package
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── mcb-automation-runner.js
└── README.md                   # Full documentation & usage instructions
```
