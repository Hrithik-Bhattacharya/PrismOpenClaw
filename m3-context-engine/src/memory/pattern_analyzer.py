"""
Pattern Analyzer - Routine pattern detection from historical data
Detects recurring context patterns for prediction
"""

from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict


class PatternAnalyzer:
    """Analyzes historical snapshots to detect routine patterns"""
    
    def __init__(self, bucket_minutes: int = 30, min_repetitions: int = 3):
        """
        Initialize pattern analyzer
        
        Args:
            bucket_minutes: Time bucket size in minutes
            min_repetitions: Minimum repetitions to classify as pattern
        """
        self.bucket_minutes = bucket_minutes
        self.min_repetitions = min_repetitions
    
    def detect_patterns(self, snapshots: List[Dict[str, Any]]) -> Dict[Tuple[int, int], Dict[str, Any]]:
        """
        Detect routine patterns from snapshots
        
        Args:
            snapshots: List of historical context snapshots
            
        Returns:
            Dictionary mapping (day_of_week, bucket_index) to pattern data
        """
        if len(snapshots) < self.min_repetitions:
            return {}
        
        # Group snapshots by time bucket
        bucket_groups = defaultdict(list)
        
        for snapshot in snapshots:
            timestamp_str = snapshot.get("timestamp")
            if not timestamp_str:
                continue
            
            timestamp = datetime.fromisoformat(timestamp_str)
            day_of_week = timestamp.weekday()
            minutes_since_midnight = timestamp.hour * 60 + timestamp.minute
            bucket_index = minutes_since_midnight // self.bucket_minutes
            
            bucket_key = (day_of_week, bucket_index)
            bucket_groups[bucket_key].append(snapshot)
        
        # Analyze each bucket for patterns
        patterns = {}
        
        for bucket_key, bucket_snapshots in bucket_groups.items():
            if len(bucket_snapshots) < self.min_repetitions:
                continue
            
            # Find most common context in this bucket
            context_counts = defaultdict(int)
            activity_counts = defaultdict(int)
            location_counts = defaultdict(int)
            
            for snapshot in bucket_snapshots:
                location = snapshot.get("location", "unknown")
                activity = snapshot.get("activity", "idle")
                
                location_counts[location] += 1
                activity_counts[activity] += 1
            
            # Get most common values
            most_common_location = max(location_counts.items(), key=lambda x: x[1])[0] if location_counts else "unknown"
            most_common_activity = max(activity_counts.items(), key=lambda x: x[1])[0] if activity_counts else "idle"
            
            # Calculate pattern strength
            total_weeks = len(set(datetime.fromisoformat(s["timestamp"]).isocalendar()[1] for s in bucket_snapshots if "timestamp" in s))
            pattern_strength = len(bucket_snapshots) / max(1, total_weeks)
            pattern_strength = min(1.0, pattern_strength)  # Cap at 1.0
            
            patterns[bucket_key] = {
                "location": most_common_location,
                "activity": most_common_activity,
                "repetitions": len(bucket_snapshots),
                "strength": pattern_strength,
                "day_of_week": bucket_key[0],
                "bucket_index": bucket_key[1],
            }
        
        return patterns
    
    def get_pattern_at_time(self, patterns: Dict[Tuple[int, int], Dict[str, Any]], target_time: datetime) -> Optional[Dict[str, Any]]:
        """
        Find pattern for a specific time
        
        Args:
            patterns: Detected patterns dictionary
            target_time: Target datetime
            
        Returns:
            Pattern data or None if no pattern found
        """
        day_of_week = target_time.weekday()
        minutes_since_midnight = target_time.hour * 60 + target_time.minute
        bucket_index = minutes_since_midnight // self.bucket_minutes
        
        bucket_key = (day_of_week, bucket_index)
        return patterns.get(bucket_key)
