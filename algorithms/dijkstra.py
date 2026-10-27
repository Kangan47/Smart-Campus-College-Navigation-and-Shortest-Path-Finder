"""
Dijkstra's Shortest Path Algorithm Module
=========================================
Implements the classic greedy single-source shortest path algorithm using a
Min-Heap (Priority Queue) with detailed step-by-step execution traces for
DAA viva demonstration and interactive frontend visualization.

Time Complexity: O((V + E) log V) with Min-Heap
Space Complexity: O(V) for distance table, previous pointers, and priority queue
"""

import heapq
import time
from algorithms.campus_graph import CAMPUS_NODES, get_campus_graph


def dijkstra_shortest_path(start_node, end_node, accessible_only=False, blocked_nodes=None, record_trace=True):
    """
    Executes Dijkstra's algorithm to compute the shortest path between start_node and end_node.

    Args:
        start_node (str): ID of source landmark (e.g. 'GATE')
        end_node (str): ID of destination landmark (e.g. 'CSE')
        accessible_only (bool): If True, only traversable by wheelchair/ramps
        blocked_nodes (list): Optional list of node IDs to bypass (e.g. under construction)
        record_trace (bool): If True, records detailed step snapshots for frontend visualizer
    """
    t_start = time.perf_counter()
    graph = get_campus_graph()
    blocked_nodes = set(blocked_nodes or [])

    if start_node not in graph or end_node not in graph:
        return {
            "success": False,
            "error": f"Invalid start ('{start_node}') or end ('{end_node}') landmark."
        }

    # Step 1: Initialization
    distances = {node: float("inf") for node in graph}
    distances[start_node] = 0.0

    previous = {node: None for node in graph}
    edge_used = {node: None for node in graph}

    pq = [(0.0, start_node)]
    visited = set()

    trace = []
    step_num = 0
    edges_relaxed = 0

    if record_trace:
        trace.append({
            "step": step_num,
            "action": "INIT",
            "current_node": start_node,
            "current_dist": 0.0,
            "description": f"Initialized distance table. Set dist[{CAMPUS_NODES[start_node]['name']}] = 0m, all others = ∞.",
            "pq_snapshot": [(round(d, 1), nid) for d, nid in pq],
            "visited": list(visited),
            "distances": {k: (round(v, 1) if v != float("inf") else "∞") for k, v in distances.items()},
            "relaxed_edge": None
        })

    while pq:
        curr_dist, curr_node = heapq.heappop(pq)

        if curr_node in visited:
            continue

        visited.add(curr_node)
        step_num += 1

        if record_trace:
            curr_name = CAMPUS_NODES[curr_node]["name"]
            trace.append({
                "step": step_num,
                "action": "VISIT_NODE",
                "current_node": curr_node,
                "current_dist": round(curr_dist, 1),
                "description": f"Extracted '{curr_name}' from Min-Heap with smallest tentative distance ({round(curr_dist, 1)}m).",
                "pq_snapshot": [(round(d, 1), nid) for d, nid in pq],
                "visited": list(visited),
                "distances": {k: (round(v, 1) if v != float("inf") else "∞") for k, v in distances.items()},
                "relaxed_edge": None
            })

        if curr_node == end_node:
            if record_trace and trace:
                trace[-1]["description"] += " Destination reached! Optimal path is guaranteed."
            break

        for edge in graph[curr_node]:
            neighbor = edge["node"]
            weight = edge["dist"]
            path_name = edge["name"]
            is_acc = edge["accessible"]

            if neighbor in visited or neighbor in blocked_nodes:
                continue
            if accessible_only and not is_acc:
                continue

            tentative_dist = curr_dist + weight

            if tentative_dist < distances[neighbor]:
                old_dist = distances[neighbor]
                distances[neighbor] = tentative_dist
                previous[neighbor] = curr_node
                edge_used[neighbor] = edge
                heapq.heappush(pq, (tentative_dist, neighbor))
                edges_relaxed += 1
                step_num += 1

                if record_trace:
                    neighbor_name = CAMPUS_NODES[neighbor]["name"]
                    old_disp = f"{round(old_dist, 1)}m" if old_dist != float("inf") else "∞"
                    trace.append({
                        "step": step_num,
                        "action": "RELAX_EDGE",
                        "current_node": curr_node,
                        "neighbor_node": neighbor,
                        "edge_weight": weight,
                        "path_name": path_name,
                        "description": (
                            f"Relaxed edge ({curr_node} → {neighbor}): "
                            f"{curr_dist}m + {weight}m = {tentative_dist}m < {old_disp}. "
                            f"Updated dist[{neighbor_name}] = {tentative_dist}m via '{path_name}'."
                        ),
                        "pq_snapshot": [(round(d, 1), nid) for d, nid in pq],
                        "visited": list(visited),
                        "distances": {k: (round(v, 1) if v != float("inf") else "∞") for k, v in distances.items()},
                        "relaxed_edge": {"from": curr_node, "to": neighbor, "new_dist": tentative_dist}
                    })

    t_end = time.perf_counter()
    exec_micros = round((t_end - t_start) * 1_000_000, 2)

    # Check if a valid path exists
    if distances[end_node] == float("inf"):
        return {
            "success": False,
            "error": f"No available route between {CAMPUS_NODES[start_node]['name']} and {CAMPUS_NODES[end_node]['name']}.",
            "trace": trace
        }

    # Reconstruct optimal path by following 'previous' pointers backwards
    path = []
    curr = end_node
    while curr is not None:
        path.append(curr)
        curr = previous[curr]
    path.reverse()

    # Build turn-by-turn segments breakdown
    segments = []
    cumulative = 0.0
    for i in range(len(path) - 1):
        u = path[i]
        v = path[i + 1]
        # find matching edge
        matched_edge = None
        for e in graph[u]:
            if e["node"] == v:
                matched_edge = e
                break

        dist_val = matched_edge["dist"] if matched_edge else 0
        pname = matched_edge["name"] if matched_edge else "Campus Walkway"
        cumulative += dist_val

        segments.append({
            "step_no": i + 1,
            "from_id": u,
            "from_name": CAMPUS_NODES[u]["name"],
            "to_id": v,
            "to_name": CAMPUS_NODES[v]["name"],
            "distance_m": dist_val,
            "path_name": pname,
            "cumulative_m": cumulative,
            "instruction": f"Head from {CAMPUS_NODES[u]['name']} along {pname} to {CAMPUS_NODES[v]['name']} ({dist_val}m)"
        })

    total_dist = round(distances[end_node], 1)
    # Average student walking speed: 1.3 meters/second (~78 meters/minute)
    walking_time_min = round(total_dist / 78.0, 1)
    # Walking burn: approx 0.045 kcal per meter for an average student
    calories_burned = round(total_dist * 0.045, 1)
    # Step count: approx 1.35 steps per meter
    steps_count = int(total_dist * 1.35)

    return {
        "success": True,
        "start_node": start_node,
        "end_node": end_node,
        "start_name": CAMPUS_NODES[start_node]["name"],
        "end_name": CAMPUS_NODES[end_node]["name"],
        "total_distance": total_dist,
        "path": path,
        "path_names": [CAMPUS_NODES[nid]["name"] for nid in path],
        "path_nodes_info": [CAMPUS_NODES[nid] for nid in path],
        "segments": segments,
        "walking_time_min": walking_time_min,
        "calories_kcal": calories_burned,
        "steps_count": steps_count,
        "metrics": {
            "execution_time_us": exec_micros,
            "nodes_visited": len(visited),
            "edges_relaxed": edges_relaxed,
            "total_nodes_in_graph": len(CAMPUS_NODES),
            "path_hops": len(path) - 1
        },
        "trace": trace
    }


def bellman_ford_shortest_path(start_node, end_node):
    """
    Classic Bellman-Ford O(V * E) shortest path algorithm.
    Used for comparative DAA analysis and performance benchmarking.
    """
    t_start = time.perf_counter()
    graph = get_campus_graph()
    nodes = list(CAMPUS_NODES.keys())
    v_count = len(nodes)

    distances = {n: float("inf") for n in nodes}
    distances[start_node] = 0.0
    previous = {n: None for n in nodes}

    # Flatten edges
    all_edges = []
    for u, neighbors in graph.items():
        for edge in neighbors:
            all_edges.append((u, edge["node"], edge["dist"]))

    # Relax all edges |V| - 1 times
    for _ in range(v_count - 1):
        relaxed_any = False
        for u, v, w in all_edges:
            if distances[u] != float("inf") and distances[u] + w < distances[v]:
                distances[v] = distances[u] + w
                previous[v] = u
                relaxed_any = True
        if not relaxed_any:
            break

    t_end = time.perf_counter()
    exec_micros = round((t_end - t_start) * 1_000_000, 2)

    return {
        "success": distances[end_node] != float("inf"),
        "distance": distances[end_node],
        "execution_time_us": exec_micros
    }
