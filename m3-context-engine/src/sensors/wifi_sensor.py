"""
WiFi Sensor Module - SSID detection and location mapping
Provides WiFi SSID or simulated network data
"""

import random
from typing import Optional, Dict


class WiFiSensor:
    """WiFi sensor with SSID-to-location mapping and simulation"""
    
    # SSID to location mapping
    SSID_MAP: Dict[str, str] = {
        "HomeNetwork_5G": "home",
        "HomeNetwork": "home",
        "OfficeWiFi": "office",
        "OfficeGuest": "office",
        "GymFitness": "gym",
        "NYU_Secure": "college",
        "NYU_Guest": "college",
    }
    
    # Location to SSID mapping (for simulation)
    LOCATION_SSID: Dict[str, str] = {
        "home": "HomeNetwork_5G",
        "office": "OfficeWiFi",
        "gym": "GymFitness",
        "college": "NYU_Secure",
    }
    
    def __init__(self, simulation_mode: bool = True, gps_sensor=None):
        """
        Initialize WiFi sensor
        
        Args:
            simulation_mode: If True, generate simulated WiFi data
            gps_sensor: GPS sensor instance for location sync (simulation only)
        """
        self.simulation_mode = simulation_mode
        self.gps_sensor = gps_sensor
    
    def get_ssid(self) -> Optional[str]:
        """
        Get current WiFi SSID
        
        Returns:
            SSID string or None if not connected
        """
        if self.simulation_mode:
            return self._simulate_ssid()
        else:
            # TODO: Integrate with real WiFi API (Android ADB or system WiFi)
            return self._simulate_ssid()
    
    def get_location(self) -> Optional[str]:
        """
        Get location based on WiFi SSID
        
        Returns:
            Location name or None if SSID not recognized
        """
        ssid = self.get_ssid()
        if ssid is None:
            return None
        
        return self.SSID_MAP.get(ssid)
    
    def _simulate_ssid(self) -> Optional[str]:
        """
        Generate simulated WiFi SSID based on GPS location
        
        Returns:
            SSID string or None (10% disconnection probability)
        """
        # 10% chance of being disconnected for realism
        if random.random() < 0.10:
            return None
        
        # Sync with GPS sensor if available
        if self.gps_sensor:
            gps_location = self.gps_sensor.get_location()
            
            # Don't have WiFi during commute
            if gps_location == "commute":
                return None
            
            # Map GPS location to SSID
            if gps_location in self.LOCATION_SSID:
                return self.LOCATION_SSID[gps_location]
        
        # Default to home WiFi
        return "HomeNetwork_5G"
