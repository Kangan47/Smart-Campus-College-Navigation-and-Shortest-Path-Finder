/**
 * SmartCampus Application Controller
 * Handles tab navigation, interactive map selection, route calculation,
 * algorithm visualizer playback, and performance analytics.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Map and Visualizer instances
    let campusMap = null;
    let visualizer = null;

    try {
        if (typeof CampusMap !== 'undefined') {
            campusMap = new CampusMap('campusCanvas');
        }
        if (campusMap && typeof DijkstraVisualizer !== 'undefined') {
            visualizer = new DijkstraVisualizer(campusMap);
        }
    } catch (err) {
        console.error('Initialization error:', err);
    }

    // 2. DOM Elements
    // Tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Navigation Form Elements
    const routeForm = document.getElementById('routeForm');
    const startSelect = document.getElementById('startNode');
    const endSelect = document.getElementById('endNode');
    const accessibleCheck = document.getElementById('accessibleOnly');
    const swapBtn = document.getElementById('swapLocationsBtn');
    const resetBtn = document.getElementById('resetRouteBtn');
    const findRouteBtn = document.getElementById('findRouteBtn');

    // Result Card Elements
    const resultsCard = document.getElementById('routeResultsCard');
    const distBadge = document.getElementById('routeDistanceBadge');
    const walkingTimeVal = document.getElementById('walkingTimeVal');
    const stepsVal = document.getElementById('stepsVal');
    const caloriesVal = document.getElementById('caloriesVal');
    const latencyVal = document.getElementById('dijkstraLatencyVal');
    const nodesVisitedVal = document.getElementById('nodesVisitedVal');
    const edgesRelaxedVal = document.getElementById('edgesRelaxedVal');
    const hopsVal = document.getElementById('hopsVal');
    const directionsList = document.getElementById('directionsList');
    const routeChartBox = document.getElementById('routeChartContainer');
    const routeChartImg = document.getElementById('routeChartImg');

    // Landmark Inspector
    const landmarkDetailBody = document.getElementById('landmarkDetailBody');

    // Benchmark Elements
    const runBenchmarkBtn = document.getElementById('runBenchmarkBtn');
    const benchTrialsSelect = document.getElementById('benchTrials');
    const statDijkstraMean = document.getElementById('statDijkstraMean');
    const statDijkstraStd = document.getElementById('statDijkstraStd');
    const statSpeedup = document.getElementById('statSpeedup');
    const chart1Placeholder = document.getElementById('chart1Placeholder');
    const chart2Placeholder = document.getElementById('chart2Placeholder');
    const chart1Img = document.getElementById('chart1Img');
    const chart2Img = document.getElementById('chart2Img');

    // ==========================================
    // 3. TAB SWITCHING LOGIC (Campus Navigation, Algorithm Visualizer, Performance Analytics)
    // ==========================================
    navTabs.forEach((tab) => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = tab.getAttribute('data-tab');
            if (!targetId) return;

            // Update active state on tab buttons
            navTabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');

            // Show target tab pane, hide others
            tabPanes.forEach((pane) => {
                pane.classList.remove('active');
            });

            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add('active');
            }

            // If switching back to campus map, refresh canvas sizing
            if (targetId === 'tab-navigation' && campusMap && typeof campusMap.resize === 'function') {
                setTimeout(() => campusMap.resize(), 60);
            }

            // If switching to Performance Analytics, automatically generate charts if not yet loaded
            if (targetId === 'tab-benchmark') {
                if (chart1Img && (!chart1Img.src || chart1Img.classList.contains('hidden') || chart1Img.getAttribute('src') === '')) {
                    runBenchmark();
                }
            }
        });
    });

    // ==========================================
    // 4. ROUTE CALCULATION
    // ==========================================
    async function calculateRoute(start, end, accessibleOnly) {
        if (!start || !end) {
            alert('Please select both Starting Point and Destination.');
            return;
        }

        if (start === end) {
            alert('Starting Point and Destination cannot be the same landmark.');
            return;
        }

        if (findRouteBtn) {
            findRouteBtn.disabled = true;
            findRouteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculating...';
        }

        try {
            const resp = await fetch('/api/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: start,
                    end: end,
                    accessible_only: accessibleOnly
                })
            });

            const data = await resp.json();

            if (!resp.ok || !data.success) {
                alert(data.error || 'No route found between the selected landmarks.');
                return;
            }

            // 1. Update Map highlighted route
            if (campusMap && typeof campusMap.setActiveRoute === 'function') {
                campusMap.setActiveRoute(data);
            }

            // 2. Show Results Card & Metrics
            if (resultsCard) resultsCard.classList.remove('hidden');
            if (distBadge) distBadge.textContent = `${data.total_distance} meters`;
            if (walkingTimeVal) walkingTimeVal.textContent = `${data.walking_time_min} min`;
            if (stepsVal) stepsVal.textContent = Number(data.steps_count || 0).toLocaleString();
            if (caloriesVal) caloriesVal.textContent = `${data.calories_kcal} kcal`;

            const metrics = data.metrics || {};
            if (latencyVal) latencyVal.textContent = `${metrics.execution_time_us || 0} μs`;
            if (nodesVisitedVal) nodesVisitedVal.textContent = metrics.nodes_visited || 0;
            if (edgesRelaxedVal) edgesRelaxedVal.textContent = metrics.edges_relaxed || 0;
            if (hopsVal) hopsVal.textContent = metrics.path_hops || 0;

            // 3. Render Turn-by-Turn Directions
            if (directionsList) {
                const segments = Array.isArray(data.segments) ? data.segments : [];
                if (segments.length === 0) {
                    directionsList.innerHTML = '<p class="placeholder-text">No path segments available.</p>';
                } else {
                    directionsList.innerHTML = segments.map((seg) => `
                        <div class="direction-item">
                            <span class="step-num">${seg.step_no}</span>
                            <div class="step-content">
                                <div class="step-text">${seg.instruction}</div>
                                <div class="step-sub"><i class="fa-solid fa-road"></i> ${seg.path_name}</div>
                            </div>
                            <span class="step-dist">${seg.distance_m}m</span>
                        </div>
                    `).join('');
                }
            }

            // 4. Cumulative Distance Profile Chart
            if (routeChartBox && routeChartImg) {
                if (data.progression_chart) {
                    routeChartImg.src = data.progression_chart;
                    routeChartBox.classList.remove('hidden');
                } else {
                    routeChartBox.classList.add('hidden');
                }
            }

            // 5. Load execution trace into Algorithm Visualizer
            if (visualizer && typeof visualizer.loadTrace === 'function') {
                visualizer.loadTrace(Array.isArray(data.trace) ? data.trace : []);
            }

        } catch (err) {
            console.error('Route calculation error:', err);
            alert('Failed to connect to route calculation server.');
        } finally {
            if (findRouteBtn) {
                findRouteBtn.disabled = false;
                findRouteBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass-location"></i> <span>Find Shortest Path</span>';
            }
        }
    }

    // ==========================================
    // 5. FORM & BUTTON EVENT LISTENERS
    // ==========================================
    // Form submit
    routeForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const start = startSelect ? startSelect.value : '';
        const end = endSelect ? endSelect.value : '';
        const accessible = accessibleCheck ? accessibleCheck.checked : false;
        calculateRoute(start, end, accessible);
    });

    // Quick presets
    document.querySelectorAll('.preset-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const start = btn.getAttribute('data-start');
            const end = btn.getAttribute('data-end');
            if (startSelect) startSelect.value = start;
            if (endSelect) endSelect.value = end;
            if (campusMap && typeof campusMap.setStartAndEnd === 'function') {
                campusMap.setStartAndEnd(start, end);
            }
            calculateRoute(start, end, accessibleCheck ? accessibleCheck.checked : false);
        });
    });

    // Swap locations
    swapBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!startSelect || !endSelect) return;
        const temp = startSelect.value;
        startSelect.value = endSelect.value;
        endSelect.value = temp;

        if (campusMap && typeof campusMap.setStartAndEnd === 'function') {
            campusMap.setStartAndEnd(startSelect.value, endSelect.value);
        }

        if (startSelect.value && endSelect.value) {
            calculateRoute(startSelect.value, endSelect.value, accessibleCheck ? accessibleCheck.checked : false);
        }
    });

    // Reset button
    resetBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (startSelect) startSelect.value = '';
        if (endSelect) endSelect.value = '';
        if (accessibleCheck) accessibleCheck.checked = false;

        if (campusMap) {
            if (typeof campusMap.setActiveRoute === 'function') campusMap.setActiveRoute(null);
            if (typeof campusMap.setStartAndEnd === 'function') campusMap.setStartAndEnd(null, null);
        }

        if (resultsCard) resultsCard.classList.add('hidden');
        if (visualizer && typeof visualizer.loadTrace === 'function') visualizer.loadTrace([]);
    });

    // Select change listeners to update pin markers on map
    startSelect?.addEventListener('change', () => {
        if (campusMap && typeof campusMap.setStartAndEnd === 'function') {
            campusMap.setStartAndEnd(startSelect.value, endSelect ? endSelect.value : null);
        }
    });

    endSelect?.addEventListener('change', () => {
        if (campusMap && typeof campusMap.setStartAndEnd === 'function') {
            campusMap.setStartAndEnd(startSelect ? startSelect.value : null, endSelect.value);
        }
    });

    // ==========================================
    // 6. MAP LANDMARK CLICK & HOVER CALLBACKS
    // ==========================================
    window.onLandmarkClick = (nodeId) => {
        showLandmarkDetails(nodeId);

        if (!startSelect || !endSelect) return;

        if (!startSelect.value) {
            startSelect.value = nodeId;
            if (campusMap && typeof campusMap.setStartAndEnd === 'function') {
                campusMap.setStartAndEnd(nodeId, endSelect.value);
            }
        } else if (!endSelect.value && startSelect.value !== nodeId) {
            endSelect.value = nodeId;
            if (campusMap && typeof campusMap.setStartAndEnd === 'function') {
                campusMap.setStartAndEnd(startSelect.value, nodeId);
            }
            calculateRoute(startSelect.value, nodeId, accessibleCheck ? accessibleCheck.checked : false);
        } else {
            startSelect.value = nodeId;
            endSelect.value = '';
            if (campusMap) {
                if (typeof campusMap.setStartAndEnd === 'function') campusMap.setStartAndEnd(nodeId, null);
                if (typeof campusMap.setActiveRoute === 'function') campusMap.setActiveRoute(null);
            }
            if (resultsCard) resultsCard.classList.add('hidden');
        }
    };

    window.onLandmarkHover = (nodeId) => {
        showLandmarkDetails(nodeId);
    };

    function showLandmarkDetails(nodeId) {
        if (!landmarkDetailBody) return;
        const node = window.CAMPUS_NODES ? window.CAMPUS_NODES[nodeId] : null;
        if (!node) return;

        landmarkDetailBody.innerHTML = `
            <div class="landmark-active-detail">
                <h4><i class="fa-solid ${node.icon || 'fa-location-dot'}"></i> ${node.name}</h4>
                <div class="landmark-meta-row">
                    <span class="meta-pill"><i class="fa-solid fa-tag"></i> ${node.category}</span>
                    <span class="meta-pill"><i class="fa-solid fa-clock"></i> ${node.hours}</span>
                    <span class="meta-pill"><i class="fa-solid fa-hashtag"></i> ID: ${node.id}</span>
                </div>
                <p class="landmark-desc">${node.desc}</p>
                <div class="quick-set-actions">
                    <button type="button" class="btn btn-secondary btn-mini" id="quickSetStart">
                        <i class="fa-solid fa-circle-dot color-start"></i> Set Starting Point
                    </button>
                    <button type="button" class="btn btn-secondary btn-mini" id="quickSetEnd">
                        <i class="fa-solid fa-location-dot color-end"></i> Set Destination
                    </button>
                </div>
            </div>
        `;

        document.getElementById('quickSetStart')?.addEventListener('click', () => {
            if (startSelect) startSelect.value = nodeId;
            if (campusMap && typeof campusMap.setStartAndEnd === 'function') {
                campusMap.setStartAndEnd(nodeId, endSelect ? endSelect.value : null);
            }
            if (endSelect && endSelect.value && endSelect.value !== nodeId) {
                calculateRoute(nodeId, endSelect.value, accessibleCheck ? accessibleCheck.checked : false);
            }
        });

        document.getElementById('quickSetEnd')?.addEventListener('click', () => {
            if (endSelect) endSelect.value = nodeId;
            if (campusMap && typeof campusMap.setStartAndEnd === 'function') {
                campusMap.setStartAndEnd(startSelect ? startSelect.value : null, nodeId);
            }
            if (startSelect && startSelect.value && startSelect.value !== nodeId) {
                calculateRoute(startSelect.value, nodeId, accessibleCheck ? accessibleCheck.checked : false);
            }
        });
    }

    // ==========================================
    // 7. PERFORMANCE & ANALYTICS (TAB 3)
    // ==========================================
    async function runBenchmark() {
        if (runBenchmarkBtn) {
            runBenchmarkBtn.disabled = true;
            runBenchmarkBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running Performance Test...';
        }

        if (chart1Placeholder) chart1Placeholder.classList.remove('hidden');
        if (chart2Placeholder) chart2Placeholder.classList.remove('hidden');
        if (chart1Img) chart1Img.classList.add('hidden');
        if (chart2Img) chart2Img.classList.add('hidden');

        try {
            const trials = parseInt(benchTrialsSelect?.value || '250', 10);
            const resp = await fetch('/api/benchmark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trials: trials })
            });

            const data = await resp.json();
            if (!resp.ok || !data.success) {
                console.error('Benchmark failed:', data.error);
                return;
            }

            const stats = data.stats || {};

            // Update stats cards
            if (statDijkstraMean && stats.dijkstra) {
                statDijkstraMean.textContent = `${stats.dijkstra.mean_us} μs`;
            }
            if (statDijkstraStd && stats.dijkstra) {
                statDijkstraStd.textContent = `Std Dev: ±${stats.dijkstra.std_us} μs`;
            }
            if (statSpeedup) {
                statSpeedup.textContent = `${stats.speedup_factor || 1.8}x`;
            }

            // Display Matplotlib generated charts
            if (data.benchmark_chart && chart1Img) {
                chart1Img.src = data.benchmark_chart;
                chart1Img.classList.remove('hidden');
                if (chart1Placeholder) chart1Placeholder.classList.add('hidden');
            }

            if (data.topology_chart && chart2Img) {
                chart2Img.src = data.topology_chart;
                chart2Img.classList.remove('hidden');
                if (chart2Placeholder) chart2Placeholder.classList.add('hidden');
            }

        } catch (err) {
            console.error('Benchmark error:', err);
        } finally {
            if (runBenchmarkBtn) {
                runBenchmarkBtn.disabled = false;
                runBenchmarkBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>Run Performance Test</span>';
            }
        }
    }

    runBenchmarkBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        runBenchmark();
    });

    // ==========================================
    // 8. INITIAL LOAD: Pre-load GATE -> CSE path
    // ==========================================
    if (startSelect && endSelect) {
        startSelect.value = 'GATE';
        endSelect.value = 'CSE';
        if (campusMap && typeof campusMap.setStartAndEnd === 'function') {
            campusMap.setStartAndEnd('GATE', 'CSE');
        }
        calculateRoute('GATE', 'CSE', false);
    }
});
