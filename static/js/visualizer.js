/**
 * Dijkstra Algorithm Step-by-Step Interactive Visualizer
 * Controls trace playback, priority queue inspector, and live distance table.
 */

class DijkstraVisualizer {
    constructor(campusMap) {
        this.campusMap = campusMap;
        this.trace = [];
        this.currentStepIdx = 0;
        this.timer = null;
        this.speedMs = 800;
        this.isPlaying = false;

        this.initDOMElements();
        this.bindEvents();
    }

    initDOMElements() {
        this.playBtn = document.getElementById('visPlayBtn');
        this.pauseBtn = document.getElementById('visPauseBtn');
        this.prevBtn = document.getElementById('visPrevBtn');
        this.nextBtn = document.getElementById('visNextBtn');
        this.resetBtn = document.getElementById('visResetBtn');
        this.speedSlider = document.getElementById('visSpeed');
        this.speedLabel = document.getElementById('visSpeedLabel');

        this.stepBadge = document.getElementById('traceStepBadge');
        this.narrative = document.getElementById('traceNarrative');
        this.pqList = document.getElementById('pqList');
        this.pqCount = document.getElementById('pqCountBadge');
        this.visitedList = document.getElementById('visitedList');
        this.visitedCount = document.getElementById('visitedCountBadge');
        this.distTableBody = document.getElementById('visDistTableBody');
    }

    bindEvents() {
        this.playBtn?.addEventListener('click', () => this.play());
        this.pauseBtn?.addEventListener('click', () => this.pause());
        this.nextBtn?.addEventListener('click', () => this.stepNext());
        this.prevBtn?.addEventListener('click', () => this.stepPrev());
        this.resetBtn?.addEventListener('click', () => this.reset());

        this.speedSlider?.addEventListener('input', (e) => {
            // Slider value: 200 (fast) to 1800 (slow)
            // Invert scale: 2000 - val so higher slider = faster
            const val = parseInt(e.target.value, 10);
            this.speedMs = 2000 - val;

            if (this.speedMs < 400) this.speedLabel.textContent = 'Very Fast';
            else if (this.speedMs < 700) this.speedLabel.textContent = 'Fast';
            else if (this.speedMs < 1100) this.speedLabel.textContent = 'Normal';
            else this.speedLabel.textContent = 'Slow';

            if (this.isPlaying) {
                this.pause();
                this.play();
            }
        });
    }

    loadTrace(traceData) {
        this.trace = traceData || [];
        this.currentStepIdx = 0;
        this.pause();
        this.renderStep(0);
    }

    play() {
        if (!this.trace || this.trace.length === 0) return;
        if (this.currentStepIdx >= this.trace.length - 1) {
            this.currentStepIdx = 0;
        }

        this.isPlaying = true;
        this.playBtn.disabled = true;
        this.pauseBtn.disabled = false;

        this.timer = setInterval(() => {
            if (this.currentStepIdx < this.trace.length - 1) {
                this.stepNext();
            } else {
                this.pause();
            }
        }, this.speedMs);
    }

    pause() {
        this.isPlaying = false;
        clearInterval(this.timer);
        this.timer = null;
        if (this.playBtn) this.playBtn.disabled = false;
        if (this.pauseBtn) this.pauseBtn.disabled = true;
    }

    stepNext() {
        if (this.currentStepIdx < this.trace.length - 1) {
            this.currentStepIdx++;
            this.renderStep(this.currentStepIdx);
        }
    }

    stepPrev() {
        if (this.currentStepIdx > 0) {
            this.currentStepIdx--;
            this.renderStep(this.currentStepIdx);
        }
    }

    reset() {
        this.pause();
        this.currentStepIdx = 0;
        this.renderStep(0);
    }

    renderStep(stepIdx) {
        if (!this.trace || this.trace.length === 0) return;
        const step = this.trace[stepIdx];
        if (!step) return;

        // 1. Update Badge & Narrative
        this.stepBadge.textContent = `Step ${stepIdx + 1} / ${this.trace.length}`;
        this.narrative.innerHTML = step.description;

        // 2. Update Min-Heap Priority Queue Chips
        const pqItems = step.pq_snapshot || [];
        this.pqCount.textContent = `${pqItems.length} Items`;

        if (pqItems.length === 0) {
            this.pqList.innerHTML = '<span class="empty-state">Queue Empty</span>';
        } else {
            this.pqList.innerHTML = pqItems.map(([d, nid]) => {
                const nodeName = window.CAMPUS_NODES[nid] ? window.CAMPUS_NODES[nid].name : nid;
                return `
                    <div class="pq-chip" title="${nodeName}">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                        <span>${d}m : <strong>${nid}</strong></span>
                    </div>
                `;
            }).join('');
        }

        // 3. Update Settled / Visited Nodes
        const visitedNodes = step.visited || [];
        this.visitedCount.textContent = `${visitedNodes.length} Settled`;

        if (visitedNodes.length === 0) {
            this.visitedList.innerHTML = '<span class="empty-state">No nodes settled yet</span>';
        } else {
            this.visitedList.innerHTML = visitedNodes.map(nid => {
                const nodeName = window.CAMPUS_NODES[nid] ? window.CAMPUS_NODES[nid].name : nid;
                return `
                    <div class="visited-chip">
                        <i class="fa-solid fa-circle-check"></i>
                        <span>${nodeName}</span>
                    </div>
                `;
            }).join('');
        }

        // 4. Update Tentative Distances Table
        this.renderDistanceTable(step);

        // 5. Notify Campus Map for real-time edge/node highlights
        if (this.campusMap) {
            this.campusMap.setVisualizerState(step);
        }
    }

    renderDistanceTable(step) {
        const distances = step.distances || {};
        const visitedSet = new Set(step.visited || []);
        const relaxedEdge = step.relaxed_edge;
        const allNodes = window.CAMPUS_NODES || {};

        let rowsHtml = '';
        for (const [id, node] of Object.entries(allNodes)) {
            const distVal = distances[id] !== undefined ? distances[id] : '∞';
            const isSettled = visitedSet.has(id);
            const isRelaxed = (relaxedEdge && relaxedEdge.to === id);

            let rowClass = '';
            if (isRelaxed) rowClass = 'active-relax-row';
            else if (isSettled) rowClass = 'settled-row';

            let statusBadge = '<span class="pill-badge pill-purple">Unvisited</span>';
            if (isSettled) {
                statusBadge = '<span class="pill-badge pill-green"><i class="fa-solid fa-check"></i> Settled</span>';
            } else if (distVal !== '∞') {
                statusBadge = '<span class="pill-badge pill-amber">In Queue</span>';
            }

            rowsHtml += `
                <tr class="${rowClass}">
                    <td><strong>${node.name}</strong> <span style="font-size: 0.72rem; color: #64748b;">(${id})</span></td>
                    <td><span class="meta-pill">${node.category}</span></td>
                    <td><code style="font-weight: 700; color: ${distVal !== '∞' ? '#38bdf8' : '#64748b'};">${distVal}${distVal !== '∞' ? 'm' : ''}</code></td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }
        this.distTableBody.innerHTML = rowsHtml;
    }
}

window.DijkstraVisualizer = DijkstraVisualizer;
