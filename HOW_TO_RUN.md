# UbuntuConnect — How to Run (Quick Guide)

This guide explains how to set up and run the UbuntuConnect system on a lab
computer. No deep technical knowledge is required — just follow the steps in order.

---

## 5 TECHNICAL REQUIREMENTS

### 5.1 System Environment

To run UbuntuConnect, the following must be installed on the computer
(all already available in the lab):

| Software | Why it's needed | Notes |
|----------|-----------------|-------|
| **Visual Studio 2022** | Runs the backend (the ASP.NET Core / C# API) | Must include the ".NET 9 SDK" (ships with VS 2022 version 17.12 or newer) |
| **Visual Studio Code** (the blue one) | Runs the frontend (the React website) | Open the `frontend` folder in it |
| **SQL Server** (with SQL Server Management Studio / SSMS) | Stores all the data | Any 2019 / 2022 edition is fine |
| **Node.js (version 18 or newer)** | Needed by the frontend | Free from nodejs.org if it is not already installed |

The system has **two parts that run at the same time**:

- **Backend (API):** runs at `http://localhost:5275`
- **Frontend (website):** runs at `http://localhost:5173`

---

### 5.2 Start-up Instructions

Do the steps **in this order**. Steps 1–3 are once-off; steps 4 and 5 are what
you do each time you run the system.

**Step 1 — Get the project**
Download the project from GitHub as a ZIP and extract it (or open the folder
you were given).

**Step 2 — Create the database** (using SQL Server Management Studio / SSMS)
1. Open **SQL Server Management Studio** and connect to your SQL Server.
2. Open the file **`MASTER_SCRIPT.sql`** (in the project's main folder) and click
   **Execute**. This creates the `UbuntuConnect_DB` database and all its tables.
3. Open the file **`seed_withpictures.sql`** and click **Execute**. This fills the
   database with sample users, organisations, and pictures.

> *If you ever want to start the data fresh:* run `delete_seed_data.sql` first,
> then `seed_withpictures.sql` again.

**Step 3 — (first time only)** No extra configuration is needed. The database
connection is already set to a local SQL Server.

**Step 4 — Start the backend** (using Visual Studio 2022)
1. Open **Visual Studio 2022**.
2. Open the project **`backend/UbuntuConnectAPI/UbuntuConnectAPI.csproj`**
   (or the solution file).
3. Press the green **▶ Run** button (or press **F5**).
4. A browser window opens showing the API documentation (Swagger).
   **Leave this running.**

**Step 5 — Start the frontend** (using VS Code)
1. Open **VS Code** and open the **`frontend`** folder.
2. Open a terminal in VS Code (menu: **Terminal → New Terminal**).
3. **The first time only**, type this and press Enter (it downloads the website's
   parts):
   ```
   npm install
   ```
4. Then type this and press Enter:
   ```
   npm run dev
   ```
5. A link appears in the terminal — **`http://localhost:5173`**. Hold **Ctrl** and
   click it (or type it into a browser) to open the website.

You can now log in and use the system.

> **To stop everything:** press the stop button in Visual Studio, and press
> **Ctrl + C** in the VS Code terminal.

**Important order:** always start the **database first, then the backend, then the
frontend**. If the website shows errors, it is almost always because the backend
(Step 4) is not running. The backend must stay open in Visual Studio while you use
the site.

---

### 5.3 Logins & Passwords

Use any of the accounts below to log in. The full list of every account is in
**`SEED_CREDENTIALS.md`**.

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@ubuntuconnect.co.za | `Hope!Bright26` |
| **Individual** (verified — can donate & volunteer) | thabo.mokoena@gmail.com | `Thabo!2026a` |
| **NPO** (verified — has fundraisers & pictures) | admin@hopebright.org.za | `Hope!Bright26` |
| **Business** (verified — runs campaigns) | csr@ubuntucorp.co.za | `Ubuntu!Corp26` |

> **Note on verification:** "Verified" accounts can do everything (donate, top up,
> apply, withdraw). Some sample accounts are intentionally **not** verified, to
> show that the system blocks those actions until a user is verified — this is
> expected behaviour, not an error.
