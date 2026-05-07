"""
Time Utilities - Helper functions for datetime operations
"""

from datetime import datetime, timedelta
from typing import Tuple


def get_current_time() -> datetime:
    """
    Get current datetime
    
    Returns:
        Current datetime
    """
    return datetime.now()


def get_day_of_week() -> int:
    """
    Get current day of week
    
    Returns:
        Day of week (0=Monday, 6=Sunday)
    """
    return datetime.now().weekday()


def get_time_bucket(dt: datetime, bucket_minutes: int = 30) -> Tuple[int, int]:
    """
    Get time bucket for pattern detection
    
    Args:
        dt: Datetime to bucket
        bucket_minutes: Bucket size in minutes (default 30)
        
    Returns:
        Tuple of (day_of_week, bucket_index)
        Example: Monday 9:45 AM with 30-min buckets → (0, 19)
    """
    day_of_week = dt.weekday()
    minutes_since_midnight = dt.hour * 60 + dt.minute
    bucket_index = minutes_since_midnight // bucket_minutes
    
    return (day_of_week, bucket_index)


def minutes_between(dt1: datetime, dt2: datetime) -> int:
    """
    Calculate minutes between two datetimes
    
    Args:
        dt1: First datetime
        dt2: Second datetime
        
    Returns:
        Minutes between dt1 and dt2 (positive if dt2 > dt1)
    """
    delta = dt2 - dt1
    return int(delta.total_seconds() / 60)


def format_timestamp(dt: datetime) -> str:
    """
    Format datetime as ISO 8601 string
    
    Args:
        dt: Datetime to format
        
    Returns:
        ISO 8601 formatted string
    """
    return dt.isoformat()


def parse_timestamp(timestamp_str: str) -> datetime:
    """
    Parse ISO 8601 timestamp string
    
    Args:
        timestamp_str: ISO 8601 formatted string
        
    Returns:
        Datetime object
    """
    return datetime.fromisoformat(timestamp_str)
