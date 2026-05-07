"""
Context Builder - Unified context JSON assembly
Orchestrates all layers to build M1-compatible context
"""

from datetime import datetime
from typing import Dict, Any, Optional


class ContextBuilder:
    """Builds unified context JSON from all sensor and intelligence layers"""
    
    def __init__(
        self,
        gps_sensor,
        wifi_sensor,
        calendar_sensor,
        battery_sensor,
        notification_sensor,
        stress_detector,
        proactive_predictor,
        confidence_engine,
        routine_builder=None
    ):
        """
        Initialize context builder with all dependencies
        
        Args:
            gps_sensor: GPS sensor instance
            wifi_sensor: WiFi sensor instance
            calendar_sensor: Calendar sensor instance
            battery_sensor: Battery sensor instance
            notification_sensor: Notification sensor instance
            stress_detector: Stress detector instance
            proactive_predictor: Proactive predictor instance
            confidence_engine: Confidence engine instance
            routine_builder: Routine builder instance (optional)
        """
        self.gps_sensor = gps_sensor
        self.wifi_sensor = wifi_sensor
        self.calendar_sensor = calendar_sensor
        self.battery_sensor = battery_sensor
        self.notification_sensor = notification_sensor
        self.stress_detector = stress_detector
        self.proactive_predictor = proactive_predictor
        self.confidence_engine = confidence_engine
        self.routine_builder = routine_builder
    
    def build_context(self) -> Dict[str, Any]:
        """
        Build complete context JSON
        
        Returns:
            Context dictionary matching M1 integration contract
        """
        # Collect sensor data
        gps_location = self.gps_sensor.get_location()
        wifi_location = self.wifi_sensor.get_location()
        
        # Determine location (WiFi priority, GPS fallback)
        location = wifi_location if wifi_location else gps_location
        
        # Get calendar data
        current_event = self.calendar_sensor.get_current_event()
        upcoming_event = self.calendar_sensor.get_upcoming_event()
        time_to_event = self.calendar_sensor.get_time_to_event()
        
        # Get battery and notifications
        battery = self.battery_sensor.get_battery_level()
        notifications = self.notification_sensor.get_notification_count()
        
        # Determine activity from location and calendar
        activity = self._determine_activity(location, current_event)
        
        # Calculate stress score
        stress = self.stress_detector.calculate_stress(
            battery=battery,
            notifications=notifications,
            calendar_events=[upcoming_event] if upcoming_event else [],
            time_to_event=time_to_event
        )
        
        # Generate proactive prediction
        prediction = self.proactive_predictor.predict_next_context(
            upcoming_event=upcoming_event,
            time_to_event=time_to_event
        )
        
        # Calculate prediction confidence
        predicted_next_context = None
        confidence = None
        
        if prediction:
            predicted_next_context = prediction.get("predicted_next_context")
            
            # Get sensor availability
            sensor_availability = {
                "gps": gps_location is not None,
                "wifi": wifi_location is not None,
                "calendar": current_event is not None or upcoming_event is not None,
                "battery": battery is not None,
                "notifications": notifications is not None
            }
            
            confidence = self.confidence_engine.calculate_confidence(
                prediction_source=prediction.get("source", "routine"),
                pattern_strength=prediction.get("confidence"),
                sensor_availability=sensor_availability
            )
        
        # Assemble context JSON (M1 contract format)
        context = {
            "location": location if location else "unknown",
            "calendar_event": current_event if current_event else "none",
            "upcoming_event": upcoming_event,
            "time_to_event": time_to_event,
            "stress": round(stress, 2),
            "battery": battery,
            "notifications": notifications,
            "activity": activity
        }
        
        # Add prediction fields if available
        if predicted_next_context:
            context["predicted_next_context"] = predicted_next_context
            context["confidence"] = round(confidence, 2) if confidence else None
        
        # Validate schema
        self._validate_schema(context)
        
        return context
    
    def _determine_activity(self, location: Optional[str], current_event: Optional[str]) -> str:
        """
        Determine current activity from location and calendar
        
        Args:
            location: Current location
            current_event: Current calendar event
            
        Returns:
            Activity string
        """
        # Calendar event takes priority
        if current_event:
            event_lower = current_event.lower()
            if "meeting" in event_lower or "standup" in event_lower or "review" in event_lower:
                return "in_meeting"
            elif "lunch" in event_lower or "break" in event_lower:
                return "idle"
            elif "workout" in event_lower or "gym" in event_lower:
                return "exercising"
            else:
                return "working"
        
        # Location-based activity
        if location == "gym":
            return "exercising"
        elif location == "office" or location == "college":
            return "working"
        elif location == "commute":
            return "commuting"
        elif location == "home":
            hour = datetime.now().hour
            if 22 <= hour or hour < 7:
                return "idle"  # Sleeping
            else:
                return "idle"
        else:
            return "idle"
    
    def _validate_schema(self, context: Dict[str, Any]) -> None:
        """
        Validate context JSON against M1 schema
        
        Args:
            context: Context dictionary
            
        Raises:
            ValueError: If schema validation fails
        """
        # Required fields
        required_fields = ["location", "calendar_event", "stress", "battery", "notifications", "activity"]
        
        for field in required_fields:
            if field not in context:
                raise ValueError(f"Missing required field: {field}")
        
        # Type validation
        if not isinstance(context["location"], str):
            raise ValueError("location must be string")
        if not isinstance(context["calendar_event"], str):
            raise ValueError("calendar_event must be string")
        if not isinstance(context["stress"], (int, float)):
            raise ValueError("stress must be number")
        if not isinstance(context["battery"], int):
            raise ValueError("battery must be integer")
        if not isinstance(context["notifications"], int):
            raise ValueError("notifications must be integer")
        if not isinstance(context["activity"], str):
            raise ValueError("activity must be string")
        
        # Range validation
        if not (0.0 <= context["stress"] <= 1.0):
            raise ValueError("stress must be between 0.0 and 1.0")
        if not (0 <= context["battery"] <= 100):
            raise ValueError("battery must be between 0 and 100")
        if not (0 <= context["notifications"] <= 999):
            raise ValueError("notifications must be between 0 and 999")
