"""
Proactive Predictor - 15-minute advance context prediction
Predicts next context using calendar events and routine patterns
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any


class ProactivePredictor:
    """Predicts next context 15 minutes before transition"""
    
    # Event type to context mapping
    EVENT_CONTEXT_MAP = {
        "meeting": "work",
        "standup": "work",
        "review": "work",
        "sync": "work",
        "discussion": "work",
        "workout": "fitness",
        "gym": "fitness",
        "exercise": "fitness",
        "class": "learning",
        "lab": "learning",
        "lecture": "learning",
        "study": "learning",
        "lunch": "calm",
        "break": "calm",
        "personal": "calm",
        "social": "calm",
    }
    
    def __init__(self, routine_builder=None, advance_minutes: int = 15, min_confidence: float = 0.5):
        """
        Initialize proactive predictor
        
        Args:
            routine_builder: RoutineBuilder instance for pattern-based prediction
            advance_minutes: Minutes to predict ahead
            min_confidence: Minimum confidence threshold for predictions
        """
        self.routine_builder = routine_builder
        self.advance_minutes = advance_minutes
        self.min_confidence = min_confidence
    
    def predict_next_context(
        self,
        upcoming_event: Optional[str] = None,
        time_to_event: Optional[int] = None,
        current_time: Optional[datetime] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Predict next context 15 minutes before transition
        
        Args:
            upcoming_event: Name of upcoming calendar event
            time_to_event: Minutes until upcoming event
            current_time: Current datetime (defaults to now)
            
        Returns:
            Prediction dict with context, confidence, and source, or None
        """
        if current_time is None:
            current_time = datetime.now()
        
        # Priority 1: Calendar-based prediction
        if upcoming_event and time_to_event is not None:
            if 10 <= time_to_event <= 20:  # Predict 10-20 minutes before event
                predicted_context = self._map_event_to_context(upcoming_event)
                if predicted_context:
                    return {
                        "predicted_next_context": predicted_context,
                        "confidence": 0.90,  # High confidence for calendar events
                        "source": "calendar",
                        "trigger_in_minutes": time_to_event
                    }
        
        # Priority 2: Routine-based prediction
        if self.routine_builder:
            target_time = current_time + timedelta(minutes=self.advance_minutes)
            expected_context = self.routine_builder.get_expected_context(target_time)
            
            if expected_context and expected_context["confidence"] >= self.min_confidence:
                return {
                    "predicted_next_context": self._map_activity_to_context(expected_context["activity"]),
                    "confidence": expected_context["confidence"],
                    "source": "routine",
                    "trigger_in_minutes": self.advance_minutes
                }
        
        # No prediction available
        return None
    
    def _map_event_to_context(self, event_name: str) -> Optional[str]:
        """
        Map calendar event name to context
        
        Args:
            event_name: Calendar event name
            
        Returns:
            Context name or None
        """
        event_lower = event_name.lower()
        
        for keyword, context in self.EVENT_CONTEXT_MAP.items():
            if keyword in event_lower:
                return context
        
        # Default to work for unrecognized events
        return "work"
    
    def _map_activity_to_context(self, activity: str) -> str:
        """
        Map activity to context
        
        Args:
            activity: Activity name
            
        Returns:
            Context name
        """
        activity_lower = activity.lower()
        
        if "work" in activity_lower or "meeting" in activity_lower:
            return "work"
        elif "exercise" in activity_lower or "workout" in activity_lower or "gym" in activity_lower:
            return "fitness"
        elif "study" in activity_lower or "learn" in activity_lower:
            return "learning"
        elif "idle" in activity_lower or "rest" in activity_lower:
            return "calm"
        else:
            return "calm"  # Default
