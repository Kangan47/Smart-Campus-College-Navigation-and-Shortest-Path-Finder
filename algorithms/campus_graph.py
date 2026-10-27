"""
SmartCampus Graph Model
=======================
Defines the campus map topology, landmark nodes with coordinates,
walking pathways, and graph conversion utilities.
"""

import numpy as np

# Landmark Nodes in the Campus Network
# Coordinates (x, y) map to a 1000 x 680 visual campus canvas
CAMPUS_NODES = {
    "GATE": {
        "id": "GATE",
        "name": "Main Campus Gate",
        "category": "Entrance",
        "x": 80,
        "y": 340,
        "icon": "fa-door-open",
        "desc": "Primary college entry & security checkpoint with visitor registration.",
        "hours": "24/7 Access"
    },
    "PARK_A": {
        "id": "PARK_A",
        "name": "Visitor Parking A",
        "category": "Services",
        "x": 160,
        "y": 180,
        "icon": "fa-square-parking",
        "desc": "Vehicle parking facility for visitors and day scholars with EV charging.",
        "hours": "07:00 AM - 10:00 PM"
    },
    "ADMIN": {
        "id": "ADMIN",
        "name": "Admin Building & Dean's Office",
        "category": "Admin",
        "x": 260,
        "y": 340,
        "icon": "fa-building-columns",
        "desc": "Central administration, Registrar office, Accounts & Student Affairs.",
        "hours": "09:00 AM - 05:00 PM"
    },
    "AUDI": {
        "id": "AUDI",
        "name": "Dr. Kalam Memorial Auditorium",
        "category": "Events",
        "x": 240,
        "y": 510,
        "icon": "fa-masks-theater",
        "desc": "1500-seat multi-purpose hall for convocations, seminars & cultural fests.",
        "hours": "08:30 AM - 08:00 PM"
    },
    "LIB": {
        "id": "LIB",
        "name": "Central Knowledge & Library",
        "category": "Academic",
        "x": 420,
        "y": 200,
        "icon": "fa-book-open-reader",
        "desc": "Air-conditioned 3-floor library, digital research journals & study carrels.",
        "hours": "08:00 AM - 10:00 PM"
    },
    "CANTEEN": {
        "id": "CANTEEN",
        "name": "Central Food Court & Canteen",
        "category": "Student Life",
        "x": 430,
        "y": 370,
        "icon": "fa-utensils",
        "desc": "Multi-cuisine student cafeteria, coffee kiosks & outdoor dining plaza.",
        "hours": "07:30 AM - 09:30 PM"
    },
    "HEALTH": {
        "id": "HEALTH",
        "name": "Campus Medical & Health Center",
        "category": "Services",
        "x": 390,
        "y": 560,
        "icon": "fa-briefcase-medical",
        "desc": "Emergency first-aid, resident doctor, ambulance bay & pharmacy.",
        "hours": "24/7 Emergency Care"
    },
    "CSE": {
        "id": "CSE",
        "name": "Computer Science & IT Block",
        "category": "Academic",
        "x": 610,
        "y": 170,
        "icon": "fa-laptop-code",
        "desc": "AI/ML labs, cloud computing center, high-speed fiber internet and IoT labs.",
        "hours": "08:00 AM - 08:00 PM"
    },
    "ECE": {
        "id": "ECE",
        "name": "Electronics & Comm. Block",
        "category": "Academic",
        "x": 610,
        "y": 330,
        "icon": "fa-microchip",
        "desc": "VLSI design center, embedded systems lab and robotics arena.",
        "hours": "08:00 AM - 07:00 PM"
    },
    "MECH": {
        "id": "MECH",
        "name": "Mechanical & Civil Workshops",
        "category": "Academic",
        "x": 590,
        "y": 490,
        "icon": "fa-gears",
        "desc": "CNC machining labs, material testing bay, CAD design lab and workshop sheds.",
        "hours": "08:30 AM - 06:30 PM"
    },
    "PARK_B": {
        "id": "PARK_B",
        "name": "Staff & Student Parking B",
        "category": "Services",
        "x": 550,
        "y": 620,
        "icon": "fa-square-parking",
        "desc": "Shaded 2-wheeler & 4-wheeler parking for faculty, staff and senior students.",
        "hours": "06:30 AM - 10:30 PM"
    },
    "INNOV": {
        "id": "INNOV",
        "name": "Innovation & Placement Hub",
        "category": "Academic",
        "x": 780,
        "y": 180,
        "icon": "fa-lightbulb",
        "desc": "Startup incubator, campus interview interview suites & venture funding cell.",
        "hours": "09:00 AM - 07:00 PM"
    },
    "STUDENT": {
        "id": "STUDENT",
        "name": "Student Activity Center & Gym",
        "category": "Student Life",
        "x": 770,
        "y": 340,
        "icon": "fa-dumbbell",
        "desc": "Fitness gymnasium, indoor badminton, clubs room & recreational lounge.",
        "hours": "06:00 AM - 09:30 PM"
    },
    "SPORTS": {
        "id": "SPORTS",
        "name": "Athletics Complex & Stadium",
        "category": "Sports",
        "x": 770,
        "y": 510,
        "icon": "fa-futbol",
        "desc": "400m synthetic running track, cricket ground, football arena & tennis courts.",
        "hours": "06:00 AM - 08:30 PM"
    },
    "HOSTEL_B": {
        "id": "HOSTEL_B",
        "name": "Boys' Hostel (Nalanda Wing)",
        "category": "Residential",
        "x": 930,
        "y": 240,
        "icon": "fa-hotel",
        "desc": "Undergraduate & postgraduate boys residence halls with study halls.",
        "hours": "Resident Card Access"
    },
    "HOSTEL_G": {
        "id": "HOSTEL_G",
        "name": "Girls' Hostel (Gargi Wing)",
        "category": "Residential",
        "x": 930,
        "y": 420,
        "icon": "fa-hotel",
        "desc": "Safe residential dormitories for female students with 24/7 warden office.",
        "hours": "Resident Card Access"
    }
}

# Campus Pathway Edges (Walking Paths between Landmarks)
# Distance in meters, wheelchair accessibility flag, path name
CAMPUS_EDGES = [
    # Main Entrance Connections
    {"u": "GATE", "v": "PARK_A", "dist": 120, "accessible": True, "name": "North Gate Lane"},
    {"u": "GATE", "v": "ADMIN", "dist": 160, "accessible": True, "name": "Ceremonial Boulevard"},
    {"u": "GATE", "v": "AUDI", "dist": 185, "accessible": True, "name": "South Entrance Pathway"},

    # Western Hub (Admin, Parking, Audi)
    {"u": "PARK_A", "v": "LIB", "dist": 230, "accessible": True, "name": "Library Garden Walkway"},
    {"u": "PARK_A", "v": "ADMIN", "dist": 140, "accessible": True, "name": "Admin North Corridor"},
    {"u": "ADMIN", "v": "AUDI", "dist": 150, "accessible": True, "name": "Avenue of Presidents"},
    {"u": "ADMIN", "v": "LIB", "dist": 170, "accessible": True, "name": "Dean's Walkway"},
    {"u": "ADMIN", "v": "CANTEEN", "dist": 155, "accessible": True, "name": "Central Promenade"},

    # South Zone (Auditorium & Health Center)
    {"u": "AUDI", "v": "HEALTH", "dist": 165, "accessible": True, "name": "Wellness Lane"},
    {"u": "AUDI", "v": "CANTEEN", "dist": 190, "accessible": True, "name": "Plaza South Link"},

    # Central Crossings (Library & Canteen)
    {"u": "LIB", "v": "CSE", "dist": 180, "accessible": True, "name": "Tech Corridor"},
    {"u": "LIB", "v": "CANTEEN", "dist": 145, "accessible": True, "name": "Library Cafe Way"},
    {"u": "CANTEEN", "v": "CSE", "dist": 220, "accessible": True, "name": "Engineering Alley"},
    {"u": "CANTEEN", "v": "ECE", "dist": 160, "accessible": True, "name": "Circuit Avenue"},
    {"u": "CANTEEN", "v": "MECH", "dist": 175, "accessible": True, "name": "Foundry Lane"},
    {"u": "CANTEEN", "v": "HEALTH", "dist": 150, "accessible": True, "name": "Clinic Pathway"},

    # South-East Zone (Health & Mech & Parking B)
    {"u": "HEALTH", "v": "MECH", "dist": 205, "accessible": True, "name": "Workshop South Path"},
    {"u": "HEALTH", "v": "PARK_B", "dist": 165, "accessible": True, "name": "South Perimeter Way"},
    {"u": "MECH", "v": "PARK_B", "dist": 135, "accessible": True, "name": "Workshop Service Road"},

    # Department Zone (CSE, ECE, MECH)
    {"u": "CSE", "v": "INNOV", "dist": 160, "accessible": True, "name": "Silicon Drive"},
    {"u": "CSE", "v": "ECE", "dist": 130, "accessible": True, "name": "Inter-Dept Corridor"},
    {"u": "ECE", "v": "INNOV", "dist": 180, "accessible": True, "name": "Innovation Parkway"},
    {"u": "ECE", "v": "STUDENT", "dist": 140, "accessible": True, "name": "Student Quadrangle"},
    {"u": "ECE", "v": "MECH", "dist": 135, "accessible": True, "name": "Makers Way"},

    # Eastern Hub & Sports Zone
    {"u": "MECH", "v": "SPORTS", "dist": 185, "accessible": True, "name": "Athletics Link"},
    {"u": "PARK_B", "v": "SPORTS", "dist": 220, "accessible": True, "name": "Stadium Access Road"},
    {"u": "INNOV", "v": "HOSTEL_B", "dist": 160, "accessible": True, "name": "North Hostel Avenue"},
    {"u": "INNOV", "v": "STUDENT", "dist": 150, "accessible": True, "name": "Activity Boulevard"},
    {"u": "STUDENT", "v": "HOSTEL_B", "dist": 170, "accessible": True, "name": "Boys' Hostel Walk"},
    {"u": "STUDENT", "v": "HOSTEL_G", "dist": 160, "accessible": True, "name": "Girls' Hostel Walk"},
    {"u": "STUDENT", "v": "SPORTS", "dist": 165, "accessible": True, "name": "Sports Arena Road"},
    {"u": "SPORTS", "v": "HOSTEL_G", "dist": 175, "accessible": True, "name": "South Hostel Lane"},
    {"u": "HOSTEL_B", "v": "HOSTEL_G", "dist": 150, "accessible": True, "name": "Residences Spine Road"}
]

def get_campus_graph():
    """
    Constructs and returns an undirected adjacency list graph.
    Format:
    {
        'GATE': [
            {'node': 'PARK_A', 'dist': 120, 'accessible': True, 'name': '...'},
            ...
        ],
        ...
    }
    """
    graph = {node_id: [] for node_id in CAMPUS_NODES}
    for edge in CAMPUS_EDGES:
        u = edge["u"]
        v = edge["v"]
        dist = edge["dist"]
        accessible = edge.get("accessible", True)
        name = edge.get("name", "Pathway")

        graph[u].append({"node": v, "dist": dist, "accessible": accessible, "name": name})
        graph[v].append({"node": u, "dist": dist, "accessible": accessible, "name": name})
    return graph

def get_adjacency_matrix():
    """
    Computes and returns a NumPy 2D array representation of the graph
    along with node index mappings.
    Returns:
        matrix (np.ndarray): n x n distance matrix (inf where no direct edge)
        node_to_idx (dict): mapping from node_id -> row/column index
        idx_to_node (list): mapping from index -> node_id
    """
    nodes = list(CAMPUS_NODES.keys())
    n = len(nodes)
    node_to_idx = {nid: i for i, nid in enumerate(nodes)}
    idx_to_node = nodes

    # Initialize with infinity, diagonal with 0
    adj_matrix = np.full((n, n), np.inf, dtype=np.float64)
    np.fill_diagonal(adj_matrix, 0.0)

    for edge in CAMPUS_EDGES:
        i = node_to_idx[edge["u"]]
        j = node_to_idx[edge["v"]]
        w = float(edge["dist"])
        adj_matrix[i, j] = w
        adj_matrix[j, i] = w

    return adj_matrix, node_to_idx, idx_to_node

def get_graph_summary():
    """
    Computes graph summary statistics using NumPy.
    """
    adj_matrix, node_to_idx, idx_to_node = get_adjacency_matrix()
    num_nodes = len(CAMPUS_NODES)
    num_edges = len(CAMPUS_EDGES)

    # Edge weights
    weights = np.array([e["dist"] for e in CAMPUS_EDGES], dtype=np.float64)

    # Node degrees (number of incident edges)
    # A finite off-diagonal entry indicates an edge
    finite_edges = np.isfinite(adj_matrix) & (adj_matrix > 0)
    degrees = np.sum(finite_edges, axis=1)

    # Graph density: 2 * E / (V * (V - 1))
    max_possible_edges = num_nodes * (num_nodes - 1) / 2
    density = num_edges / max_possible_edges if max_possible_edges > 0 else 0

    return {
        "num_nodes": int(num_nodes),
        "num_edges": int(num_edges),
        "min_edge_meters": float(np.min(weights)),
        "max_edge_meters": float(np.max(weights)),
        "mean_edge_meters": round(float(np.mean(weights)), 2),
        "std_edge_meters": round(float(np.std(weights)), 2),
        "median_edge_meters": float(np.median(weights)),
        "average_degree": round(float(np.mean(degrees)), 2),
        "max_degree": int(np.max(degrees)),
        "min_degree": int(np.min(degrees)),
        "graph_density_pct": round(density * 100, 2)
    }
