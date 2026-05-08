"""
Snapshot Logger - Historical context data storage
Logs context snapshots for pattern analysis
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from threading import Lock


class SnapshotLogger:
    """Thread-safe snapshot logger for historical context data"""
    
    def __init__(self, storage_path: str = "./memory/snapshots.json", retention_days: int = 7):
        """
        Initialize snapshot logger
        
        Args:
            storage_path: Path to snapshots JSON file
            retention_days: Number of days to retain snapshots
        """
        self.storage_path = storage_path
        self.retention_days = retention_days
        self._lock = Lock()
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(storage_path), exist_ok=True)
        
        # Initialize file if it doesn't exist
        if not os.path.exists(storage_path):
            self._write_snapshots([])
    
    def log_snapshot(self, context: Dict[str, Any]) -> None:
        """
        Log a context snapshot with timestamp
        
        Args:
            context: Context dictionary to log
        """
        with self._lock:
            # Add timestamp if not present
            if "timestamp" not in context:
                context["timestamp"] = datetime.now().isoformat()
            
            # Read existing snapshots
            snapshots = self._read_snapshots()
            
            # Append new snapshot
            snapshots.append(context)
            
            # Write back
            self._write_snapshots(snapshots)
    
    def get_snapshots(self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Query snapshots by time range
        
        Args:
            start_time: Start of time range (inclusive)
            end_time: End of time range (inclusive)
            
        Returns:
            List of snapshots in time range
        """
        with self._lock:
            snapshots = self._read_snapshots()
            
            if start_time is None and end_time is None:
                return snapshots
            
            filtered = []
            for snapshot in snapshots:
                timestamp_str = snapshot.get("timestamp")
                if not timestamp_str:
                    continue
                
                timestamp = datetime.fromisoformat(timestamp_str)
                
                if start_time and timestamp < start_time:
                    continue
                if end_time and timestamp > end_time:
                    continue
                
                filtered.append(snapshot)
            
            return filtered
    
    def get_recent_snapshots(self, count: int = 100) -> List[Dict[str, Any]]:
        """
        Get most recent N snapshots
        
        Args:
            count: Number of snapshots to return
            
        Returns:
            List of most recent snapshots
        """
        with self._lock:
            snapshots = self._read_snapshots()
            return snapshots[-count:] if len(snapshots) > count else snapshots
    
    def cleanup_old_snapshots(self) -> int:
        """
        Remove snapshots older than retention period
        
        Returns:
            Number of snapshots removed
        """
        with self._lock:
            snapshots = self._read_snapshots()
            cutoff_time = datetime.now() - timedelta(days=self.retention_days)
            
            filtered = []
            removed_count = 0
            
            for snapshot in snapshots:
                timestamp_str = snapshot.get("timestamp")
                if not timestamp_str:
                    filtered.append(snapshot)
                    continue
                
                timestamp = datetime.fromisoformat(timestamp_str)
                
                if timestamp >= cutoff_time:
                    filtered.append(snapshot)
                else:
                    removed_count += 1
            
            if removed_count > 0:
                self._write_snapshots(filtered)
            
            return removed_count
    
    def _read_snapshots(self) -> List[Dict[str, Any]]:
        """Read snapshots from file"""
        try:
            with open(self.storage_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _write_snapshots(self, snapshots: List[Dict[str, Any]]) -> None:
        """Write snapshots to file"""
        try:
            with open(self.storage_path, 'w') as f:
                json.dump(snapshots, f, indent=2)
        except IOError as e:
            print(f"Error writing snapshots: {e}")
