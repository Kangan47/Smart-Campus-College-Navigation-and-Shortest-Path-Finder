# 🏫 SmartCampus: College Navigation and Shortest Path Finder

A clean, modern, and user-friendly web application designed for college campuses. It provides an interactive campus map where students, faculty, and visitors can select their starting location and destination to instantly get the shortest walking route, estimated walking time, step count, and turn-by-turn walking directions.

---

## 🌟 Key Features

1. **Interactive Campus Map:**
   - Visual map showing 16 key campus landmarks (Main Gate, Library, CSE Block, Food Court, Auditorium, Sports Complex, Hostels, Health Clinic, etc.).
   - Interactive click-to-route: Click any building pin on the map to set your starting point and destination.
   - Smooth mouse controls: Drag to pan, scroll wheel to zoom, reset view button, and landmark labels toggle.
   - Animated route highlight: Glowing walking path connecting your start and destination.

2. **Smart Route Calculation:**
   - Powered by **Dijkstra's Shortest Path Algorithm** for finding the optimal walking path.
   - Calculates exact distance in meters, walking time (in minutes), estimated steps, and calories burned.
   - Turn-by-turn walking directions listing each walkway and landmark passed.
   - Wheelchair / Step-free accessible walkways filter.

3. **Step-by-Step Route Visualizer:**
   - Demonstrates how the shortest path algorithm explores the campus network step-by-step.
   - Interactive controls: Play, Pause, Next Step, Previous Step, and Speed adjustment.
   - Live exploration queue and current distance table.

4. **Performance & Analytics:**
   - Uses **NumPy** to calculate average route statistics and campus connectivity metrics.
   - Uses **Matplotlib** to generate visual charts of route elevation and walkway length distributions.

---

## 📁 Project Folder Structure

```text
SmartCampus College Navigation and Shortest Path Finde/
│
├── .vscode/
│   ├── launch.json              # F5 instant run configuration for VS Code
│   └── settings.json            # Configures Python interpreter to venv
│
├── algorithms/
│   ├── __init__.py              # Python module initializer
│   ├── campus_graph.py          # Campus map layout: 16 landmarks and 27 pathways
│   ├── dijkstra.py              # Dijkstra's shortest path calculation algorithm
│   └── benchmark.py             # Route statistics (NumPy) and chart generation (Matplotlib)
│
├── static/
│   ├── css/
│   │   └── style.css            # Modern styling, responsive layout, dark theme
│   └── js/
│       ├── map.js               # Interactive canvas campus map renderer
│       ├── visualizer.js        # Step-by-step route calculation visualizer
│       └── app.js               # Main website logic and event handlers
│
├── templates/
│   └── index.html               # Clean frontend user interface
│
├── venv/                        # Python virtual environment (with all packages)
├── app.py                       # Main Flask web application
├── requirements.txt             # Required Python libraries
├── run.bat                      # One-click Windows runner
├── run.ps1                      # PowerShell runner script
└── README.md                    # Project documentation & run guide
```

---

## 🚀 How to Run the Project (Step-by-Step for Windows)

### Method 1: Run with F5 in VS Code (Easiest & Best for Demonstrating)

1. Open **VS Code**.
2. Click **File** → **Open Folder...** in the top menu.
3. Select this project folder:
   `C:\Users\Lenovo\Documents\SmartCampus College Navigation and Shortest Path Finde`
4. Press **`F5`** on your keyboard (or click the green **Play** button under **Run and Debug** on the left panel).
5. Open your web browser (Chrome, Edge, etc.) and go to:
   👉 **`http://127.0.0.1:5000`**

The website will load immediately with an interactive map ready to show your teacher.

---

### Method 2: One-Click Double Click (`run.bat`)

1. Open your Windows File Explorer and navigate to the project folder:
   `C:\Users\Lenovo\Documents\SmartCampus College Navigation and Shortest Path Finde`
2. Double-click the file named **`run.bat`**.
3. A terminal window will open showing:
   ```text
   * Running on http://127.0.0.1:5000
   ```
4. Open your browser and go to: **`http://127.0.0.1:5000`**.

---

### Method 3: Using the VS Code Terminal

1. Open the project folder in **VS Code**.
2. Open a new terminal by pressing **`Ctrl + ` `~``** (or click **Terminal** → **New Terminal** from the top menu).
3. Type the following command and press Enter:
   ```powershell
   python app.py
   ```
   *(Or if using the virtual environment: `.\venv\Scripts\python.exe app.py`)*
4. Open your browser and go to: **`http://127.0.0.1:5000`**.
5. To stop the server when finished, press **`Ctrl + C`** in the terminal.

---

## 🛠️ Requirements & Libraries Used

The project uses standard, reliable Python packages:
- **Flask:** Lightweight Python web server backend.
- **NumPy:** Computes performance statistics, average walking distances, and matrix calculations.
- **Matplotlib:** Generates route distance profiles and campus analytics charts.
- **HTML5, CSS3, JavaScript:** Front-end interactive canvas map and modern UI.

All required packages are listed in `requirements.txt`:
```text
Flask>=3.0.0
numpy>=1.24.0
matplotlib>=3.7.0
```

---

## 💡 How to Demonstrate to Your Teacher

1. **Show the Campus Map:**
   - Explain that the website displays a college campus with 16 realistic facilities (Administrative Block, Library, Engineering Depts, Cafeteria, Sports Ground, Hostels, etc.).
   - Demonstrate dragging the map to pan and using the mouse wheel to zoom in and out.
2. **Find a Route:**
   - Select an Origin (e.g., `Main Campus Gate`) and Destination (e.g., `Central Knowledge & Library`).
   - Click **Find Shortest Path** (or use one of the quick preset buttons).
   - Show the glowing route on the map, the exact distance in meters, the walking time in minutes, estimated steps, and the turn-by-turn directions.
3. **Show the Algorithm Visualizer (Tab 2):**
   - Click on the **Algorithm Visualizer** tab.
   - Click **Play** to show how Dijkstra's algorithm searches through the campus pathways to find the shortest route step-by-step.
4. **Show Route Analytics (Tab 3):**
   - Click on **Performance Analytics** to show the Matplotlib charts and NumPy route stats.
