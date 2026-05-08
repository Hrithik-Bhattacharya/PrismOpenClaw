"""
Confidence Engine - Prediction confidence scoring
Calculates confidence scores for predictions based on data quality
"""

from typing import Dict, Any, Optional


class ConfidenceEngine:
    """Calculates confidence scores for predictions"""
    
    def __init__(self):
        """Initialize confidence engine"""
        pass
    
    def calculate_confidence(
        self,
        prediction_source: str,
        pattern_strength: Optional[float] = None,
        sensor_availability: Optional[Dict[str, bool]] = None
    ) -> float:
        """
        Calculate confidence score for a prediction
        
        Args:
            prediction_source: Source of prediction ("calendar" or "routine")
            pattern_strength: Strength of routine pattern (0.0-1.0)
            sensor_availability: Dictionary of sensor availability
            
        Returns:
            Confidence score (0.0-1.0)
        """
        # Base confidence depends on source
        if prediction_source == "calendar":
            base_confidence = 0.90  # High confidence for calendar events
        elif prediction_source == "routine":
            base_confidence = pattern_strength if pattern_strength is not None else 0.60
        else:
            base_confidence = 0.50
        
        # Calculate data quality multiplier
        data_quality = self._calculate_data_quality(sensor_availability)
        
        # Final confidence is base * data_quality
        confidence = base_confidence * data_quality
        
        return min(1.0, max(0.0, confidence))
    
    def _calculate_data_quality(self, sensor_availability: Optional[Dict[str, bool]]) -> float:
        """
        Calculate data quality score from sensor availability
        
        Args:
            sensor_availability: Dictionary of sensor availability
            
        Returns:
            Data quality score (0.6-1.0)
        """
        if sensor_availability is None:
            return 0.80  # Default moderate quality
        
        # Base quality
        quality = 0.60
        
        # Add bonus for each available sensor
        if sensor_availability.get("gps", False):
            quality += 0.10
        if sensor_availability.get("wifi", False):
            quality += 0.10
        if sensor_availability.get("calendar", False):
            quality += 0.10
        if sensor_availability.get("battery", False):
            quality += 0.05
        if sensor_availability.get("notifications", False):
            quality += 0.05
        
        return min(1.0, quality)
