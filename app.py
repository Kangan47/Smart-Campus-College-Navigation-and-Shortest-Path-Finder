"""
SmartCampus: College Navigation and Shortest Path Finder
=======================================================
A clean, modern Flask web application for college navigation and route planning.
Features:
- Interactive campus map with landmark selection
- Dijkstra's shortest-path algorithm for optimal routes
- Walking distance, estimated time, and turn-by-turn directions
- Step-by-step route visualizer
- NumPy performance stats and Matplotlib route analytics charts
"""

import os
from flask import Flask, render_template, request, jsonify

from algorithms.campus_graph import (
    CAMPUS_NODES,
    CAMPUS_EDGES,
    get_campus_graph,
    get_graph_summary
)
from algorithms.dijkstra import dijkstra_shortest_path
from algorithms.benchmark import (
    run_numpy_performance_benchmark,
    generate_benchmark_chart,
    generate_path_progression_chart,
    generate_campus_graph_analytics_chart
)

app = Flask(__name__)
app.config["SECRET_KEY"] = "smartcampus-portal-secret-2026"


@app.route("/")
def index():
    """Renders the main campus navigation website."""
    graph_summary = get_graph_summary()
    return render_template(
        "index.html",
        nodes=CAMPUS_NODES,
        edges=CAMPUS_EDGES,
        summary=graph_summary
    )


@app.route("/api/nodes", methods=["GET"])
def api_nodes():
    """Returns all campus landmark nodes."""
    return jsonify({
        "success": True,
        "nodes": CAMPUS_NODES
    })


@app.route("/api/edges", methods=["GET"])
def api_edges():
    """Returns all campus pathways/edges."""
    return jsonify({
        "success": True,
        "edges": CAMPUS_EDGES
    })


@app.route("/api/route", methods=["POST"])
def api_route():
    """
    Computes shortest path using Dijkstra's algorithm.
    Request JSON:
        - start (str): Node ID (e.g., 'GATE')
        - end (str): Node ID (e.g., 'CSE')
        - accessible_only (bool): Optional wheelchair filter
        - blocked_nodes (list): Optional list of bypassed nodes
    """
    data = request.get_json() or {}
    start = data.get("start")
    end = data.get("end")
    accessible_only = bool(data.get("accessible_only", False))
    blocked_nodes = data.get("blocked_nodes", [])

    if not start or not end:
        return jsonify({"success": False, "error": "Please select both Start and Destination landmarks."}), 400

    result = dijkstra_shortest_path(start, end, accessible_only=accessible_only, blocked_nodes=blocked_nodes)

    # Generate cumulative walking profile chart if route succeeded
    progression_chart = None
    if result.get("success"):
        try:
            progression_chart = generate_path_progression_chart(result)
        except Exception as e:
            print(f"Chart notice: {e}")

    result["progression_chart"] = progression_chart
    return jsonify(result)


@app.route("/api/benchmark", methods=["POST"])
def api_benchmark():
    """
    Runs NumPy statistical Monte-Carlo benchmarking.
    Generates Matplotlib charts for runtime comparison and graph topology.
    """
    data = request.get_json() or {}
    trials = int(data.get("trials", 250))
    trials = max(20, min(trials, 1000))

    stats = run_numpy_performance_benchmark(num_trials=trials)
    benchmark_chart = generate_benchmark_chart()
    topology_chart = generate_campus_graph_analytics_chart()

    return jsonify({
        "success": True,
        "stats": stats,
        "benchmark_chart": benchmark_chart,
        "topology_chart": topology_chart
    })


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  🚀 SmartCampus: College Navigation & Shortest Path Finder")
    print("  🌐 Website URL: http://127.0.0.1:5000")
    print("  👉 Open in your web browser (Chrome / Edge): http://127.0.0.1:5000")
    print("=" * 60 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False, threaded=True)
