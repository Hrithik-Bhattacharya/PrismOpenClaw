"""
GPS Sensor Module - Location detection with geofencing
Provides real GPS coordinates or simulated location data
"""

import math
import random
from datetime import datetime
from typing import Tuple, Optional, Dict


class GPSSensor:
    """GPS sensor with geofencing and realistic simulation"""
    
    # Geofence definitions (lat, lon, radius_meters)
    GEOFENCES: Dict[str, Tuple[float, float, float]] = {
        "home": (40.7128, -74.0060, 100),      # NYC coordinates (example)
        "office": (40.7589, -73.9851, 150),    # Times Square area
        "gym": (40.7484, -73.9857, 100),       # Near Empire State
        "college": (40.7295, -73.9965, 200),   # NYU area
    }
    
    # Daily routine for simulation (hour: location)
    DAILY_ROUTINE = {
        0: "home", 1: "home", 2: "home", 3: "home", 4: "home", 5: "home",
        6: "home", 7: "home",
        8: "commute",  # Transition
        9: "office", 10: "office", 11: "office", 12: "office",
        13: "office", 14: "office", 15: "office", 16: "office",
        17: "commute",  # Transition
        18: "gym", 19: "gym",
        20: "commute",  # Transition
        21: "home", 22: "home", 23: "home"
    }
    
    def __init__(self, simulation_mode: bool = True):
        """
        Initialize GPS sensor
        
        Args:
            simulation_mode: If True, generate simulated GPS data
        """
        self.simulation_mode = simulation_mode
        self._last_location = "home"
        self._transition_progress = 0.0
    
    def get_coordinates(self) -> Tuple[float, float]:
        """
        Get current GPS coordinates
        
        Returns:
            Tuple of (latitude, longitude)
        """
        if self.simulation_mode:
            return self._simulate_coordinates()
        else:
            # TODO: Integrate with real GPS API (Android ADB or system GPS)
            return self._simulate_coordinates()
    
    def get_location(self) -> str:
        """
        Get current location name using geofencing
        
        Returns:
            Location name: "home", "office", "gym", "college", "commute", or "unknown"
        """
        lat, lon = self.get_coordinates()
        
        # Check each geofence
        for location, (fence_lat, fence_lon, radius) in self.GEOFENCES.items():
            distance = self._calculate_distance(lat, lon, fence_lat, fence_lon)
            if distance <= radius:
                self._last_location = location
                return location
        
        # If not in any geofence, check if in transition
        if self._is_transition_time():
            return "commute"
        
        return "unknown"
    
    def _simulate_coordinates(self) -> Tuple[float, float]:
        """
        Generate realistic simulated GPS coordinates based on time of day
        
        Returns:
            Tuple of (latitude, longitude)
        """
        now = datetime.now()
        hour = now.hour
        minute = now.minute
        
        # Get target location for current hour
        target_location = self.DAILY_ROUTINE.get(hour, "home")
        
        # Handle transitions smoothly
        if target_location == "commute":
            # Interpolate between locations
            prev_hour = (hour - 1) % 24
            next_hour = (hour + 1) % 24
            from_loc = self.DAILY_ROUTINE.get(prev_hour, "home")
            to_loc = self.DAILY_ROUTINE.get(next_hour, "home")
            
            # Progress through the hour (0.0 to 1.0)
            progress = minute / 60.0
            
            if from_loc in self.GEOFENCES and to_loc in self.GEOFENCES:
                from_coords = self.GEOFENCES[from_loc]
                to_coords = self.GEOFENCES[to_loc]
                
                # Smooth interpolation with sinusoidal easing
                smooth_progress = (1 - math.cos(progress * math.pi)) / 2
                
                lat = from_coords[0] + (to_coords[0] - from_coords[0]) * smooth_progress
                lon = from_coords[1] + (to_coords[1] - from_coords[1]) * smooth_progress
                
                # Add small random jitter for realism
                lat += random.uniform(-0.0005, 0.0005)
                lon += random.uniform(-0.0005, 0.0005)
                
                return (lat, lon)
        
        # Static location - return geofence center with small jitter
        if target_location in self.GEOFENCES:
            base_lat, base_lon, radius = self.GEOFENCES[target_location]
            
            # Add random jitter within 20% of radius
            jitter_range = radius * 0.0002  # Convert meters to approximate degrees
            lat = base_lat + random.uniform(-jitter_range, jitter_range)
            lon = base_lon + random.uniform(-jitter_range, jitter_range)
            
            return (lat, lon)
        
        # Default to home
        return self.GEOFENCES["home"][:2]
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
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
    
    def _is_transition_time(self) -> bool:
        """Check if current time is a transition period"""
        hour = datetime.now().hour
        return self.DAILY_ROUTINE.get(hour) == "commute"
