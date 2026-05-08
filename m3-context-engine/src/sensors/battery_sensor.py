"""
Battery Sensor Module - Battery level monitoring with realistic drain
Provides battery percentage or simulated battery data
"""

import random
from datetime import datetime
from typing import Optional


class BatterySensor:
    """Battery sensor with realistic drain and charging simulation"""
    
    def __init__(self, simulation_mode: bool = True, gps_sensor=None):
        """
        Initialize Battery sensor
        
        Args:
            simulation_mode: If True, generate simulated battery data
            gps_sensor: GPS sensor instance for location-based drain (simulation only)
        """
        self.simulation_mode = simulation_mode
        self.gps_sensor = gps_sensor
        self._simulated_battery = 85.0  # Start at 85%
        self._last_update = datetime.now()
    
    def get_battery_level(self) -> int:
        """
        Get current battery percentage
        
        Returns:
            Battery level (0-100)
        """
        if self.simulation_mode:
            return int(self._simulate_battery())
        else:
            # TODO: Integrate with real Battery API (Android ADB or system battery)
            return int(self._simulate_battery())
    
    def _simulate_battery(self) -> float:
        """
        Generate realistic simulated battery level with drain and charging
        
        Returns:
            Battery percentage (0.0-100.0)
        """
        now = datetime.now()
        hour = now.hour
        
        # Calculate time elapsed since last update
        elapsed_seconds = (now - self._last_update).total_seconds()
        elapsed_hours = elapsed_seconds / 3600.0
        
        # Get current location for context-aware drain
        location = "home"
        if self.gps_sensor:
            location = self.gps_sensor.get_location()
        
        # Determine drain/charge rate based on context
        if hour >= 22 or hour < 6:
            # Charging at night (home)
            if location == "home":
                rate = 20.0  # +20% per hour when charging
            else:
                rate = -3.0  # Slow drain during sleep
        elif location == "gym":
            # Higher drain during workout
            rate = -8.0  # -8% per hour
        elif location == "commute":
            # Moderate drain during commute (GPS + screen)
            rate = -6.0  # -6% per hour
        elif location == "office" or location == "college":
            # Normal usage drain
            rate = -5.0  # -5% per hour
        else:
            # Idle drain at home
            rate = -3.0  # -3% per hour
        
        # Apply drain/charge
        self._simulated_battery += rate * elapsed_hours
        
        # Add small random fluctuation for realism
        self._simulated_battery += random.uniform(-0.5, 0.5)
        
        # Clamp to valid range
        self._simulated_battery = max(0.0, min(100.0, self._simulated_battery))
        
        # Update last update time
        self._last_update = now
        
        return self._simulated_battery
