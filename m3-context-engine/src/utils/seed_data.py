"""
Seed Data Generator - Creates realistic historical snapshots
Generates 7 days of historical data for pattern detection
"""

import json
import os
from datetime import datetime, timedelta
import random


def generate_seed_data(output_path: str = "./memory/snapshots.json"):
    """
    Generate 7 days of realistic historical snapshots
    
    Args:
        output_path: Path to output snapshots file
    """
    print("🌱 Generating seed data...")
    
    snapshots = []
    
    # Start 7 days ago
    start_date = datetime.now() - timedelta(days=7)
    
    # Generate snapshots for each day
    for day_offset in range(7):
        current_date = start_date + timedelta(days=day_offset)
        day_of_week = current_date.weekday()
        
        # Weekday routine (Monday-Friday)
        if day_of_week < 5:
            # Morning at home (7:00-8:30)
            for hour in range(7, 9):
                for minute in [0, 30]:
                    if hour == 8 and minute == 30:
                        continue
                    timestamp = current_date.replace(hour=hour, minute=minute, second=0)
                    snapshots.append(create_snapshot(timestamp, "home", "idle", 85 - hour, 2))
            
            # Commute (8:30-9:00)
            timestamp = current_date.replace(hour=8, minute=30, second=0)
            snapshots.append(create_snapshot(timestamp, "commute", "commuting", 80, 3))
            
            # Office (9:00-17:00)
            for hour in range(9, 17):
                for minute in [0, 30]:
                    timestamp = current_date.replace(hour=hour, minute=minute, second=0)
                    activity = "in_meeting" if minute == 30 and hour in [9, 11, 14] else "working"
                    event = "Daily Standup" if hour == 9 and minute == 30 else "none"
                    snapshots.append(create_snapshot(timestamp, "office", activity, 75 - (hour - 9) * 3, 5 + random.randint(0, 3), event))
            
            # Commute (17:00-17:30)
            timestamp = current_date.replace(hour=17, minute=0, second=0)
            snapshots.append(create_snapshot(timestamp, "commute", "commuting", 55, 8))
            
            # Gym (18:00-19:00)
            for hour in range(18, 20):
                for minute in [0, 30]:
                    if hour == 19 and minute == 30:
                        continue
                    timestamp = current_date.replace(hour=hour, minute=minute, second=0)
                    snapshots.append(create_snapshot(timestamp, "gym", "exercising", 50 - (hour - 18) * 5, 2))
            
            # Evening at home (20:00-22:00)
            for hour in range(20, 23):
                for minute in [0, 30]:
                    timestamp = current_date.replace(hour=hour, minute=minute, second=0)
                    snapshots.append(create_snapshot(timestamp, "home", "idle", 60 + (hour - 20) * 10, 1))
        
        # Weekend routine (Saturday-Sunday)
        else:
            # Morning at home (9:00-12:00)
            for hour in range(9, 12):
                for minute in [0, 30]:
                    timestamp = current_date.replace(hour=hour, minute=minute, second=0)
                    snapshots.append(create_snapshot(timestamp, "home", "idle", 90 - hour, 1))
            
            # Afternoon activities (13:00-15:00)
            for hour in range(13, 15):
                for minute in [0, 30]:
                    timestamp = current_date.replace(hour=hour, minute=minute, second=0)
                    snapshots.append(create_snapshot(timestamp, "college", "working", 80 - hour, 2))
            
            # Gym (15:00-17:00)
            for hour in range(15, 17):
                for minute in [0, 30]:
                    timestamp = current_date.replace(hour=hour, minute=minute, second=0)
                    snapshots.append(create_snapshot(timestamp, "gym", "exercising", 75 - (hour - 15) * 5, 1))
            
            # Evening at home (18:00-22:00)
            for hour in range(18, 23):
                for minute in [0, 30]:
                    timestamp = current_date.replace(hour=hour, minute=minute, second=0)
                    snapshots.append(create_snapshot(timestamp, "home", "idle", 70 + (hour - 18) * 5, 1))
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Write snapshots
    with open(output_path, 'w') as f:
        json.dump(snapshots, f, indent=2)
    
    print(f"✅ Generated {len(snapshots)} snapshots")
    print(f"📁 Saved to: {output_path}")


def create_snapshot(timestamp, location, activity, battery, notifications, event="none"):
    """Create a single snapshot"""
    # Calculate stress based on context
    stress = 0.3  # Base stress
    
    if activity == "in_meeting":
        stress = 0.6
    elif activity == "working":
        stress = 0.5
    elif activity == "exercising":
        stress = 0.4
    elif activity == "commuting":
        stress = 0.5
    
    # Add battery stress
    if battery < 30:
        stress += 0.2
    
    # Add notification stress
    if notifications > 5:
        stress += 0.1
    
    stress = min(1.0, stress)
    
    return {
        "timestamp": timestamp.isoformat(),
        "location": location,
        "calendar_event": event,
        "upcoming_event": None,
        "time_to_event": None,
        "stress": round(stress, 2),
        "battery": battery,
        "notifications": notifications,
        "activity": activity
    }


if __name__ == "__main__":
    generate_seed_data()
