"""
Routine Builder - Builds routine models from detected patterns
Creates human-readable routine summaries
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple, List


class RoutineBuilder:
    """Builds routine models from pattern data"""
    
    def __init__(self, pattern_analyzer):
        """
        Initialize routine builder
        
        Args:
            pattern_analyzer: PatternAnalyzer instance
        """
        self.pattern_analyzer = pattern_analyzer
        self.patterns = {}
    
    def build_routine(self, snapshots: List[Dict[str, Any]]) -> Dict[Tuple[int, int], Dict[str, Any]]:
        """
        Build routine from historical snapshots
        
        Args:
            snapshots: List of historical context snapshots
            
        Returns:
            Dictionary of patterns
        """
        self.patterns = self.pattern_analyzer.detect_patterns(snapshots)
        return self.patterns
    
    def get_expected_context(self, target_time: datetime) -> Optional[Dict[str, Any]]:
        """
        Predict expected context at target time based on routine
        
        Args:
            target_time: Target datetime
            
        Returns:
            Expected context or None if no pattern found
        """
        pattern = self.pattern_analyzer.get_pattern_at_time(self.patterns, target_time)
        
        if pattern is None:
            return None
        
        return {
            "location": pattern["location"],
            "activity": pattern["activity"],
            "confidence": pattern["strength"],
            "source": "routine_pattern"
        }
    
    def export_routine_markdown(self, output_path: str = "./memory/routine.md") -> None:
        """
        Export routine as human-readable markdown
        
        Args:
            output_path: Path to output markdown file
        """
        if not self.patterns:
            return
        
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        lines = ["# Weekly Routine Summary\n\n"]
        lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        # Group patterns by day
        for day in range(7):
            day_patterns = [(k, v) for k, v in self.patterns.items() if k[0] == day]
            
            if not day_patterns:
                continue
            
            lines.append(f"## {day_names[day]}\n\n")
            
            # Sort by time
            day_patterns.sort(key=lambda x: x[0][1])
            
            for (day_of_week, bucket_index), pattern in day_patterns:
                # Calculate time from bucket
                minutes = bucket_index * self.pattern_analyzer.bucket_minutes
                hour = minutes // 60
                minute = minutes % 60
                time_str = f"{hour:02d}:{minute:02d}"
                
                location = pattern["location"]
                activity = pattern["activity"]
                strength = pattern["strength"]
                repetitions = pattern["repetitions"]
                
                lines.append(f"- **{time_str}**: {location} - {activity} (strength: {strength:.2f}, {repetitions} occurrences)\n")
            
            lines.append("\n")
        
        # Write to file
        try:
            with open(output_path, 'w') as f:
                f.writelines(lines)
        except IOError as e:
            print(f"Error writing routine markdown: {e}")
