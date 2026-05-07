"""
Stress Detector - Multi-signal stress level calculation
Calculates stress score from battery, notifications, meetings, and time pressure
"""

from typing import Optional, List, Dict, Any
from datetime import datetime


class StressDetector:
    """Calculates stress score using weighted multi-signal analysis"""
    
    # Weights for stress components
    BATTERY_WEIGHT = 0.20
    NOTIFICATION_WEIGHT = 0.25
    MEETING_DENSITY_WEIGHT = 0.35
    TIME_PRESSURE_WEIGHT = 0.20
    
    def __init__(self):
        """Initialize stress detector"""
        pass
    
    def calculate_stress(
        self,
        battery: Optional[int] = None,
        notifications: Optional[int] = None,
        calendar_events: Optional[List[Dict[str, Any]]] = None,
        time_to_event: Optional[int] = None
    ) -> float:
        """
        Calculate overall stress score
        
        Args:
            battery: Battery percentage (0-100)
            notifications: Notification count
            calendar_events: List of upcoming calendar events
            time_to_event: Minutes until next event
            
        Returns:
            Stress score (0.0-1.0)
        """
        # Default to 0.3 if insufficient data
        if battery is None and notifications is None and time_to_event is None:
            return 0.3
        
        stress_components = []
        
        # Battery stress
        if battery is not None:
            battery_stress = self._battery_stress(battery)
            stress_components.append(battery_stress * self.BATTERY_WEIGHT)
        
        # Notification stress
        if notifications is not None:
            notification_stress = self._notification_stress(notifications)
            stress_components.append(notification_stress * self.NOTIFICATION_WEIGHT)
        
        # Meeting density stress
        if calendar_events is not None:
            meeting_stress = self._meeting_density_stress(calendar_events)
            stress_components.append(meeting_stress * self.MEETING_DENSITY_WEIGHT)
        
        # Time pressure stress
        if time_to_event is not None:
            time_stress = self._time_pressure_stress(time_to_event)
            stress_components.append(time_stress * self.TIME_PRESSURE_WEIGHT)
        
        # Calculate weighted average
        if not stress_components:
            return 0.3
        
        total_stress = sum(stress_components)
        
        # Normalize by actual weights used
        total_weight = 0.0
        if battery is not None:
            total_weight += self.BATTERY_WEIGHT
        if notifications is not None:
            total_weight += self.NOTIFICATION_WEIGHT
        if calendar_events is not None:
            total_weight += self.MEETING_DENSITY_WEIGHT
        if time_to_event is not None:
            total_weight += self.TIME_PRESSURE_WEIGHT
        
        if total_weight > 0:
            total_stress = total_stress / total_weight
        
        return min(1.0, max(0.0, total_stress))
    
    def _battery_stress(self, battery: int) -> float:
        """
        Calculate stress from battery level
        
        Args:
            battery: Battery percentage (0-100)
            
        Returns:
            Stress component (0.0-1.0)
        """
        if battery >= 30:
            return 0.0
        
        # Stress increases as battery drops below 30%
        return max(0.0, (30 - battery) / 30.0)
    
    def _notification_stress(self, notifications: int) -> float:
        """
        Calculate stress from notification count
        
        Args:
            notifications: Notification count
            
        Returns:
            Stress component (0.0-1.0)
        """
        # Stress scales with notification count, capped at 20
        return min(1.0, notifications / 20.0)
    
    def _meeting_density_stress(self, calendar_events: List[Dict[str, Any]]) -> float:
        """
        Calculate stress from meeting density
        
        Args:
            calendar_events: List of upcoming calendar events
            
        Returns:
            Stress component (0.0-1.0)
        """
        if not calendar_events:
            return 0.0
        
        # Count meetings in next 2 hours
        now = datetime.now()
        meetings_in_window = 0
        
        for event in calendar_events:
            # This is a simplified version - in real implementation,
            # we'd parse event times properly
            meetings_in_window += 1
        
        # Stress increases with meeting density
        # 0 meetings = 0.0, 1 meeting = 0.3, 2 meetings = 0.6, 3+ meetings = 1.0
        return min(1.0, meetings_in_window * 0.3)
    
    def _time_pressure_stress(self, time_to_event: int) -> float:
        """
        Calculate stress from time pressure (approaching deadline)
        
        Args:
            time_to_event: Minutes until next event
            
        Returns:
            Stress component (0.0-1.0)
        """
        if time_to_event > 60:
            return 0.0
        
        # Stress increases as event approaches
        # 60+ minutes = 0.0, 30 minutes = 0.5, 0 minutes = 1.0
        return 1.0 - (time_to_event / 60.0)
