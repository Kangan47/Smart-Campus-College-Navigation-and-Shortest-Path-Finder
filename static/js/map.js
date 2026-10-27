/**
 * SmartCampus Interactive Canvas Map Renderer
 * Handles campus graphics, high-DPI scaling, path animation,
 * hover tooltips, and interactive click-to-route selection.
 */

class CampusMap {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.viewport = document.getElementById('canvasViewport');

        // Graph data loaded from backend
        this.nodes = window.CAMPUS_NODES || {};
        this.edges = window.CAMPUS_EDGES || [];

        // Viewport transformations (pan & zoom)
        this.scale = 1.0;
        this.minScale = 0.6;
        this.maxScale = 2.4;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.startPan = { x: 0, y: 0 };

        // State
        this.hoveredNodeId = null;
        this.activeRoute = null; // Node IDs array: ['GATE', 'ADMIN', ...]
        this.startNodeId = null;
        this.endNodeId = null;
        this.visualizerState = null; // For Dijkstra step-by-step coloring
        this.showLabels = true;

        // Animation state for glowing shortest path
        this.dashOffset = 0;
        this.pulsePhase = 0;

        // Category color theme
        this.categoryColors = {
            'Entrance': '#10b981',
            'Academic': '#38bdf8',
            'Admin': '#818cf8',
            'Student Life': '#f59e0b',
            'Sports': '#ec4899',
            'Residential': '#a855f7',
            'Services': '#14b8a6',
            'Events': '#f43f5e'
        };

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.bindEvents();
        this.startAnimationLoop();
    }

    resize() {
        if (!this.viewport) return;
        const rect = this.viewport.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.cssWidth = rect.width;
        this.cssHeight = rect.height;

        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);

        // Center map coordinates initially
        this.fitToScreen();
    }

    fitToScreen() {
        // Map bounds are roughly 0 to 1020 on X, 0 to 700 on Y
        const mapW = 1040;
        const mapH = 700;
        const scaleX = this.cssWidth / mapW;
        const scaleY = this.cssHeight / mapH;
        this.scale = Math.min(scaleX, scaleY) * 0.94;
        this.panX = (this.cssWidth - mapW * this.scale) / 2 + 10;
        this.panY = (this.cssHeight - mapH * this.scale) / 2 + 10;
        this.render();
    }

    bindEvents() {
        // Zoom buttons
        document.getElementById('btnZoomIn')?.addEventListener('click', () => this.zoom(1.2));
        document.getElementById('btnZoomOut')?.addEventListener('click', () => this.zoom(0.8));
        document.getElementById('btnResetView')?.addEventListener('click', () => this.fitToScreen());

        // Toggle labels button
        const btnLabels = document.getElementById('btnToggleLabels');
        btnLabels?.addEventListener('click', () => {
            this.showLabels = !this.showLabels;
            btnLabels.classList.toggle('active', this.showLabels);
            this.render();
        });

        // Mouse pan & hover
        this.canvas.addEventListener('mousedown', (e) => {
            const hit = this.hitTest(e.offsetX, e.offsetY);
            if (!hit) {
                this.isPanning = true;
                this.startPan = { x: e.clientX - this.panX, y: e.clientY - this.panY };
                this.canvas.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.panX = e.clientX - this.startPan.x;
                this.panY = e.clientY - this.startPan.y;
                this.render();
            } else {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const hit = this.hitTest(mouseX, mouseY);

                if (hit !== this.hoveredNodeId) {
                    this.hoveredNodeId = hit;
                    this.canvas.style.cursor = hit ? 'pointer' : 'crosshair';
                    this.render();
                    if (hit && window.onLandmarkHover) {
                        window.onLandmarkHover(hit);
                    }
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                this.canvas.style.cursor = 'crosshair';
            }
        });

        // Click to select landmark
        this.canvas.addEventListener('click', (e) => {
            const hit = this.hitTest(e.offsetX, e.offsetY);
            if (hit && window.onLandmarkClick) {
                window.onLandmarkClick(hit);
            }
        });

        // Wheel Zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            this.zoomAtPoint(zoomFactor, e.offsetX, e.offsetY);
        }, { passive: false });
    }

    zoom(factor) {
        const cx = this.cssWidth / 2;
        const cy = this.cssHeight / 2;
        this.zoomAtPoint(factor, cx, cy);
    }

    zoomAtPoint(factor, cx, cy) {
        const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * factor));
        const actualFactor = newScale / this.scale;
        this.scale = newScale;

        this.panX = cx - (cx - this.panX) * actualFactor;
        this.panY = cy - (cy - this.panY) * actualFactor;
        this.render();
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.panX) / this.scale,
            y: (sy - this.panY) / this.scale
        };
    }

    worldToScreen(wx, wy) {
        return {
            x: wx * this.scale + this.panX,
            y: wy * this.scale + this.panY
        };
    }

    hitTest(sx, sy) {
        const world = this.screenToWorld(sx, sy);
        const radius = 24 / this.scale; // dynamic hit radius
        for (const [id, node] of Object.entries(this.nodes)) {
            const dx = world.x - node.x;
            const dy = world.y - node.y;
            if (dx * dx + dy * dy <= radius * radius) {
                return id;
            }
        }
        return null;
    }

    setActiveRoute(routeData) {
        if (!routeData || !routeData.success) {
            this.activeRoute = null;
        } else {
            this.activeRoute = routeData.path;
            this.startNodeId = routeData.start_node;
            this.endNodeId = routeData.end_node;
        }
        this.render();
    }

    setStartAndEnd(startId, endId) {
        this.startNodeId = startId;
        this.endNodeId = endId;
        this.render();
    }

    setVisualizerState(state) {
        this.visualizerState = state;
        this.render();
    }

    startAnimationLoop() {
        const loop = () => {
            this.dashOffset = (this.dashOffset - 0.75) % 24;
            this.pulsePhase = (this.pulsePhase + 0.05) % (Math.PI * 2);
            if (this.activeRoute || this.visualizerState) {
                this.render();
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

        ctx.save();
        ctx.translate(this.panX, this.panY);
        ctx.scale(this.scale, this.scale);

        // 1. Draw Campus Background Aesthetics (Grass lawns, lake, athletic oval)
        this.drawCampusZones(ctx);

        // 2. Draw Base Edges (Campus Pathways)
        this.drawEdges(ctx);

        // 3. Draw Active Shortest Path Route (Glowing animated path)
        if (this.activeRoute && this.activeRoute.length > 1) {
            this.drawActivePath(ctx);
        }

        // 4. Draw Visualizer Edge Relaxation highlights (if active)
        if (this.visualizerState) {
            this.drawVisualizerHighlights(ctx);
        }

        // 5. Draw Landmark Nodes
        this.drawNodes(ctx);

        ctx.restore();
    }

    drawCampusZones(ctx) {
        // Campus boundaries
        ctx.fillStyle = '#0a101f';
        ctx.fillRect(-20, -20, 1080, 720);

        // Central Quad Lawn
        ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect(320, 140, 360, 280, 24);
        ctx.fill();
        ctx.stroke();

        // Athletics Field Oval
        ctx.fillStyle = 'rgba(236, 72, 153, 0.04)';
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
        ctx.beginPath();
        ctx.roundRect(700, 450, 160, 120, 35);
        ctx.fill();
        ctx.stroke();

        // Botanical Garden / Green Buffer
        ctx.fillStyle = 'rgba(16, 185, 129, 0.03)';
        ctx.beginPath();
        ctx.arc(360, 260, 70, 0, Math.PI * 2);
        ctx.fill();

        // Zone text watermark
        ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.font = '600 12px "Plus Jakarta Sans"';
        ctx.fillText('ACADEMIC CENTRAL QUAD', 410, 285);
        ctx.fillText('ATHLETIC ARENA', 730, 515);
        ctx.fillText('RESIDENTIAL ZONE', 880, 340);
    }

    drawEdges(ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const edge of this.edges) {
            const u = this.nodes[edge.u];
            const v = this.nodes[edge.v];
            if (!u || !v) continue;

            // Draw shadow/path base
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(u.x, u.y);
            ctx.lineTo(v.x, v.y);
            ctx.stroke();

            // Inner walkway lane
            ctx.strokeStyle = edge.accessible ? '#334155' : '#283548';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Pathway distance badge on midpoint
            const mx = (u.x + v.x) / 2;
            const my = (u.y + v.y) / 2;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.beginPath();
            ctx.roundRect(mx - 15, my - 8, 30, 16, 4);
            ctx.fill();

            ctx.fillStyle = '#64748b';
            ctx.font = '500 8.5px "JetBrains Mono"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${edge.dist}m`, mx, my);
        }
    }

    drawActivePath(ctx) {
        const path = this.activeRoute;

        // 1. Outer cyan glow
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 16;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const n = this.nodes[path[i]];
            if (i === 0) ctx.moveTo(n.x, n.y);
            else ctx.lineTo(n.x, n.y);
        }
        ctx.stroke();
        ctx.restore();

        // 2. Animated bright core dashes
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 14]);
        ctx.lineDashOffset = this.dashOffset;

        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const n = this.nodes[path[i]];
            if (i === 0) ctx.moveTo(n.x, n.y);
            else ctx.lineTo(n.x, n.y);
        }
        ctx.stroke();
        ctx.restore();
    }

    drawVisualizerHighlights(ctx) {
        const vs = this.visualizerState;
        if (!vs) return;

        // Highlight relaxing edge in amber/gold
        if (vs.relaxed_edge) {
            const u = this.nodes[vs.relaxed_edge.from];
            const v = this.nodes[vs.relaxed_edge.to];
            if (u && v) {
                ctx.save();
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 5;
                ctx.shadowColor = '#f59e0b';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.moveTo(u.x, u.y);
                ctx.lineTo(v.x, v.y);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    drawNodes(ctx) {
        const pulse = Math.sin(this.pulsePhase) * 3;

        for (const [id, node] of Object.entries(this.nodes)) {
            const isHovered = (id === this.hoveredNodeId);
            const isStart = (id === this.startNodeId);
            const isEnd = (id === this.endNodeId);
            const isInRoute = this.activeRoute && this.activeRoute.includes(id);

            // Visualizer checks
            const isVisCurrent = this.visualizerState && this.visualizerState.current_node === id;
            const isVisSettled = this.visualizerState && this.visualizerState.visited.includes(id);

            let nodeColor = this.categoryColors[node.category] || '#38bdf8';
            let radius = isHovered ? 17 : 14;

            // Halo for special nodes
            if (isStart || isEnd || isVisCurrent) {
                ctx.save();
                const haloColor = isStart ? 'rgba(16, 185, 129, 0.4)' : (isEnd ? 'rgba(244, 63, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)');
                ctx.fillStyle = haloColor;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 8 + pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Node Circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

            if (isVisCurrent) {
                ctx.fillStyle = '#f59e0b';
            } else if (isVisSettled) {
                ctx.fillStyle = '#10b981';
            } else if (isStart) {
                ctx.fillStyle = '#10b981';
            } else if (isEnd) {
                ctx.fillStyle = '#f43f5e';
            } else if (isInRoute) {
                ctx.fillStyle = '#0284c7';
            } else {
                ctx.fillStyle = '#1e293b';
            }
            ctx.fill();

            // Border Ring
            ctx.strokeStyle = (isStart ? '#34d399' : (isEnd ? '#fb7185' : (isInRoute ? '#38bdf8' : nodeColor)));
            ctx.lineWidth = isHovered ? 3.5 : 2.2;
            ctx.stroke();
            ctx.restore();

            // Inner Center Dot or Start/End Icon
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 9px "Plus Jakarta Sans"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isStart) {
                ctx.fillText('S', node.x, node.y);
            } else if (isEnd) {
                ctx.fillText('D', node.x, node.y);
            } else {
                // Short 3-letter code
                const shortCode = id.length > 4 ? id.substring(0, 3) : id;
                ctx.fillText(shortCode, node.x, node.y);
            }

            // Landmark Name Label
            if (this.showLabels || isHovered || isStart || isEnd) {
                ctx.save();
                ctx.font = isHovered ? '700 11.5px "Plus Jakarta Sans"' : '600 10px "Plus Jakarta Sans"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                const labelY = node.y + radius + 4;
                const textWidth = ctx.measureText(node.name).width;

                // Subtle dark background pill behind label for readability
                ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                ctx.beginPath();
                ctx.roundRect(node.x - textWidth / 2 - 5, labelY - 2, textWidth + 10, 16, 4);
                ctx.fill();

                ctx.fillStyle = (isStart ? '#34d399' : (isEnd ? '#fb7185' : (isInRoute ? '#38bdf8' : '#e2e8f0')));
                ctx.fillText(node.name, node.x, labelY);
                ctx.restore();
            }
        }
    }
}

window.CampusMap = CampusMap;
