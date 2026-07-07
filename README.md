# Mobile TDMS (Transport & Logistics Dashboard)

A lightweight, mobile-first web application designed for cross-platform logistics management. Mobile TDMS provides field operators and warehouse staff with a high-visibility, responsive interface to track, input, and align cargo entries across Land and Air transit routes.

### Features

* **Mobile-First Responsive Layout:** A clean three-column layout (Quantity, Weight, Dimensions) optimized for rapid data entry on tablets and mobile devices.
* **Unified Logistics Tracking:** Seamlessly view, filter, and manage land and air cargo entries on a unified interface.
* **Adaptive Display (Theme Toggle):** Features an instant toggle between Light and Dark modes to ensure high readability across different environments—from high-glare outdoor shipping docks to low-light warehouses.

---

### Interface Preview

To accommodate varying field conditions—ranging from high-glare outdoor shipping docks to low-light warehouses—the platform offers an instant adaptive interface toggle.

| Dark Mode Dashboard | Light Mode Dashboard |
| :---: | :---: |
| <img width="159" height="322" alt="tdms dark mode" src="https://github.com/user-attachments/assets/94b89a4b-1216-4908-9d52-ca0794795f21" /> | <img width="167" height="323" alt="tdms light mode" src="https://github.com/user-attachments/assets/619dc542-0ae3-41cc-826a-f04876838a95" /> |
| *Optimized for low-light warehouse conditions and reducing eye strain.* | *Optimized for high-visibility under direct sunlight at outdoor cargo ports.* |

---

### Tech Stack & Design System

* **Framework:** React / Vite (HTML5, Custom CSS Modules)
* **Design Philosophy:** Atomic Visual Component Design
* **Primary Theme Colors:** * Deep Corporate Navy (`#0A1F4C`) — Headers, navigation, and core interaction elements.
  * Vibrant Logistics Orange (`#E87722`) — Call-to-action buttons, high-priority status badges.

---

### Local Setup Instructions

If you want to run or test this project locally on your machine, follow these steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### 1. Clone the Repository
```bash
git clone [https://github.com/mEoWmIiiii/Mobile-TDMS.git](https://github.com/mEoWmIiiii/Mobile-TDMS.git)
cd Mobile-TDMS
2. Install Project Dependencies
Because the heavy dependency folders are excluded (.gitignore), you must restore them locally before running the app:

Bash
npm install
3. Run the Development Server
Bash
npm run dev
Open the local URL provided in your terminal (usually http://localhost:5173) in your browser to view the application.
