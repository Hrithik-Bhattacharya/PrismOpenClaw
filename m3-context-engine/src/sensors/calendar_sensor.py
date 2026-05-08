"""
Calendar Sensor Module - Event extraction and time calculations
Provides calendar events or simulated schedule data
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Tuple


class CalendarSensor:
    """Calendar sensor with event extraction and realistic simulation"""
    
    # Simulated weekly schedule (day_of_week, hour, minute, duration_minutes, event_name)
    WEEKLY_SCHEDULE: List[Tuple[int, int, int, int, str]] = [
        # Monday (0)
        (0, 9, 30, 30, "Daily Standup"),
        (0, 10, 0, 60, "Sprint Planning"),
        (0, 13, 0, 60, "Lunch Break"),
        (0, 14, 0, 90, "Deep Work Session"),
        (0, 18, 0, 60, "Gym Workout"),
        
        # Tuesday (1)
        (1, 9, 30, 30, "Daily Standup"),
        (1, 11, 0, 60, "Client Meeting"),
        (1, 13, 0, 60, "Lunch Break"),
        (1, 14, 0, 60, "Code Review"),
        (1, 15, 0, 60, "Team Sync"),
        (1, 18, 0, 60, "Gym Workout"),
        
        # Wednesday (2)
        (2, 9, 30, 30, "Daily Standup"),
        (2, 10, 0, 120, "ML Lab"),
        (2, 13, 0, 60, "Lunch Break"),
        (2, 14, 0, 90, "Project Work"),
        (2, 18, 0, 60, "Gym Workout"),
        
        # Thursday (3)
        (3, 9, 30, 30, "Daily Standup"),
        (3, 10, 0, 60, "Architecture Review"),
        (3, 11, 0, 60, "Design Discussion"),
        (3, 13, 0, 60, "Lunch Break"),
        (3, 14, 0, 120, "Deep Work Session"),
        (3, 18, 0, 60, "Gym Workout"),
        
        # Friday (4)
        (4, 9, 30, 30, "Daily Standup"),
        (4, 10, 0, 60, "Sprint Review"),
        (4, 11, 0, 60, "Retrospective"),
        (4, 13, 0, 60, "Lunch Break"),
        (4, 14, 0, 90, "Documentation"),
        (4, 17, 0, 60, "Team Social"),
        
        # Saturday (5)
        (5, 10, 0, 120, "Personal Project"),
        (5, 13, 0, 60, "Lunch"),
        (5, 15, 0, 90, "Gym Workout"),
        
        # Sunday (6)
        (6, 11, 0, 60, "Meal Prep"),
        (6, 13, 0, 60, "Lunch"),
        (6, 15, 0, 60, "Reading"),
    ]
    
    def __init__(self, simulation_mode: bool = True):
        """
        Initialize Calendar sensor
        
        Args:
            simulation_mode: If True, generate simulated calendar data
        """
        self.simulation_mode = simulation_mode
    
    def get_current_event(self) -> Optional[str]:
        """
        Get currently active calendar event
        
        Returns:
            Event name or None if no active event
        """
        if self.simulation_mode:
            return self._simulate_current_event()
        else:
            # TODO: Integrate with real Calendar API (Google Calendar, Outlook, etc.)
            return self._simulate_current_event()
    
    def get_upcoming_event(self) -> Optional[str]:
        """
        Get next upcoming calendar event
        
        Returns:
            Event name or None if no upcoming event
        """
        if self.simulation_mode:
            return self._simulate_upcoming_event()
        else:
            # TODO: Integrate with real Calendar API
            return self._simulate_upcoming_event()
    
    def get_time_to_event(self) -> Optional[int]:
        """
        Calculate minutes until next event
        
        Returns:
            Minutes until upcoming event or None if no upcoming event
        """
        upcoming = self.get_upcoming_event()
        if upcoming is None:
            return None
        
        now = datetime.now()
        upcoming_time = self._get_upcoming_event_time()
        
        if upcoming_time is None:
            return None
        
        delta = upcoming_time - now
        minutes = int(delta.total_seconds() / 60)
        
        return max(0, minutes)  # Don't return negative values
    
    def _simulate_current_event(self) -> Optional[str]:
        """
        Get simulated current event based on schedule
        
        Returns:
            Event name or None
        """
        now = datetime.now()
        day_of_week = now.weekday()
        
        for day, hour, minute, duration, event_name in self.WEEKLY_SCHEDULE:
            if day != day_of_week:
                continue
            
            event_start = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            event_end = event_start + timedelta(minutes=duration)
            
            if event_start <= now < event_end:
                return event_name
        
        return None
    
    def _simulate_upcoming_event(self) -> Optional[str]:
        """
        Get simulated upcoming event
        
        Returns:
            Event name or None
        """
        now = datetime.now()
        day_of_week = now.weekday()
        
        # Look for events today
        for day, hour, minute, duration, event_name in self.WEEKLY_SCHEDULE:
            if day != day_of_week:
                continue
            
            event_start = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            if event_start > now:
                return event_name
        
        # Look for events tomorrow
        tomorrow = (day_of_week + 1) % 7
        for day, hour, minute, duration, event_name in self.WEEKLY_SCHEDULE:
            if day == tomorrow:
                return event_name
        
        return None
    
    def _get_upcoming_event_time(self) -> Optional[datetime]:
        """
        Get datetime of upcoming event
        
        Returns:
            Datetime of upcoming event or None
        """
        now = datetime.now()
        day_of_week = now.weekday()
        
        # Look for events today
        for day, hour, minute, duration, event_name in self.WEEKLY_SCHEDULE:
            if day != day_of_week:
                continue
            
            event_start = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            if event_start > now:
                return event_start
        
        # Look for events tomorrow
        tomorrow = (day_of_week + 1) % 7
        for day, hour, minute, duration, event_name in self.WEEKLY_SCHEDULE:
            if day == tomorrow:
                tomorrow_date = now + timedelta(days=1)
                return tomorrow_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        return None
