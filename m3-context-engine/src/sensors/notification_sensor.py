"""
Notification Sensor Module - Notification count with time-based patterns
Provides notification count or simulated notification data
"""

import random
from datetime import datetime
from typing import Optional


class NotificationSensor:
    """Notification sensor with realistic time-based patterns"""
    
    def __init__(self, simulation_mode: bool = True, calendar_sensor=None, gps_sensor=None):
        """
        Initialize Notification sensor
        
        Args:
            simulation_mode: If True, generate simulated notification data
            calendar_sensor: Calendar sensor for meeting-based spikes
            gps_sensor: GPS sensor for location-based patterns
        """
        self.simulation_mode = simulation_mode
        self.calendar_sensor = calendar_sensor
        self.gps_sensor = gps_sensor
        self._base_count = random.randint(1, 3)
        self._last_update = datetime.now()
    
    def get_notification_count(self) -> int:
        """
        Get current unread notification count
        
        Returns:
            Notification count (0-999)
        """
        if self.simulation_mode:
            return self._simulate_notifications()
        else:
            # TODO: Integrate with real Notification API (Android ADB or system notifications)
            return self._simulate_notifications()
    
    def _simulate_notifications(self) -> int:
        """
        Generate realistic simulated notification count
        
        Returns:
            Notification count (0-999)
        """
        now = datetime.now()
        hour = now.hour
        
        # Get current location
        location = "home"
        if self.gps_sensor:
            location = self.gps_sensor.get_location()
        
        # Base rate depends on time of day
        if hour >= 22 or hour < 7:
            # Sleep time - no notifications
            return 0
        elif 9 <= hour < 17:
            # Work hours - higher notification rate
            base_rate = random.randint(5, 10)
        else:
            # Off hours - lower notification rate
            base_rate = random.randint(1, 3)
        
        # Add meeting-based spikes
        if self.calendar_sensor:
            time_to_event = self.calendar_sensor.get_time_to_event()
            if time_to_event is not None and 5 <= time_to_event <= 15:
                # Spike 5-15 minutes before meeting
                base_rate += 5
        
        # Location-based adjustments
        if location == "gym":
            # Fewer notifications during workout
            base_rate = max(0, base_rate - 3)
        elif location == "commute":
            # More notifications during commute (catching up)
            base_rate += 2
        
        # Add random variation
        count = base_rate + random.randint(-2, 2)
        
        # Clamp to valid range
        return max(0, min(999, count))
