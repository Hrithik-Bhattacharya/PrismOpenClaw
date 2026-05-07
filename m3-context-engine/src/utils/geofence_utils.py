"""
Geofence Utilities - Helper functions for geofencing calculations
"""

import math
from typing import Tuple


def point_in_geofence(lat: float, lon: float, fence_lat: float, fence_lon: float, radius_meters: float) -> bool:
    """
    Check if a point is within a circular geofence
    
    Args:
        lat, lon: Point coordinates
        fence_lat, fence_lon: Geofence center coordinates
        radius_meters: Geofence radius in meters
        
    Returns:
        True if point is within geofence
    """
    distance = distance_between_coords(lat, lon, fence_lat, fence_lon)
    return distance <= radius_meters


def distance_between_coords(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two GPS coordinates using Haversine formula
    
    Args:
        lat1, lon1: First coordinate
        lat2, lon2: Second coordinate
        
    Returns:
        Distance in meters
    """
    R = 6371000  # Earth radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def bearing_between_coords(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate bearing (direction) from first coordinate to second
    
    Args:
        lat1, lon1: First coordinate
        lat2, lon2: Second coordinate
        
    Returns:
        Bearing in degrees (0-360, where 0 is North)
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)
    
    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360) % 360
