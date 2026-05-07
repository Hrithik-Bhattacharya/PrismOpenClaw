# Implementation Plan: M3 Context Engine

## Overview

This implementation plan delivers the M3 Context Engine for the PrismOpenClaw Phantom Mode hackathon. The system provides intelligent context-sensing, pattern learning, and proactive prediction capabilities to the M1 Pi Engine. The plan is optimized for a 2-hour sprint with parallel execution where possible.

The implementation follows a modular architecture with five layers: Sensor Layer (GPS, WiFi, Calendar, Battery, Notifications), Memory Layer (Snapshot Logger, Pattern Analyzer, Routine Builder), Intelligence Layer (Stress Detector, Proactive Predictor, Confidence Engine), Context Builder, and M1 Integrator. All components include simulation modes for demo purposes.

## Tasks

- [x] 1. Project setup and configuration
  - Create directory structure: `src/sensors/`, `src/memory/`, `src/predictors/`, `src/engine/`, `src/utils/`
  - Create `requirements.txt` with dependencies: APScheduler, requests, python-dotenv, typing-extensions
  - Create `.env.example` with M1_API_URL, M1_API_TOKEN, HEARTBEAT_INTERVAL, SIMULATION_MODE
  - Create `README.md` with setup instructions and architecture overview
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 15.5, 15.6_

- [ ] 2. Implement Sensor Layer modules
  - [-] 2.1 Implement GPS sensor with geofencing
    - Create `src/sensors/gps_sensor.py` with GPSSensor class
    - Implement `get_coordinates()` returning (lat, lon) tuple
    - Implement `get_location()` with geofence mapping for home, office, gym, college
    - Add simulation mode with realistic daily routine (home→office→gym→home)
    - Use sinusoidal interpolation for smooth transitions with random jitter
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 13.1, 13.6_
  
  - [-] 2.2 Implement WiFi sensor with SSID mapping
    - Create `src/sensors/wifi_sensor.py` with WiFiSensor class
    - Implement `get_ssid()` returning current WiFi SSID or None
    - Implement `get_location()` with SSID-to-location mapping
    - Add simulation mode synced with GPS sensor location
    - Include 10% disconnection probability for realism
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 13.2, 13.6_
  
  - [-] 2.3 Implement Calendar sensor with event extraction
    - Create `src/sensors/calendar_sensor.py` with CalendarSensor class
    - Implement `get_current_event()` returning active event or None
    - Implement `get_upcoming_event()` returning next event or None
    - Implement `get_time_to_event()` calculating minutes until event
    - Add simulation mode with realistic daily schedule (standup, meetings, lunch, deep work, gym)
    - Include back-to-back meetings on some days for stress testing
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 13.3, 13.6_
  
  - [-] 2.4 Implement Battery sensor with realistic drain
    - Create `src/sensors/battery_sensor.py` with BatterySensor class
    - Implement `get_battery_level()` returning percentage (0-100)
    - Add simulation mode with realistic drain patterns (5%/hour active, 8%/hour gym)
    - Include charging behavior at home after 10 PM (+20%/hour)
    - Add random fluctuations (±2%) for realism
    - _Requirements: 1.3, 13.4, 13.6_
  
  - [-] 2.5 Implement Notification sensor with time-based patterns
    - Create `src/sensors/notification_sensor.py` with NotificationSensor class
    - Implement `get_notification_count()` returning count (0-999)
    - Add simulation mode with base rate 1-3/hour, spikes during work hours (5-10/hour)
    - Include pre-meeting spikes (+5 notifications 10 min before)
    - Drop to 0 during sleep context
    - _Requirements: 1.4, 13.5, 13.6_

- [ ] 3. Implement Memory Layer modules
  - [~] 3.1 Implement Snapshot Logger for historical data
    - Create `src/memory/snapshot_logger.py` with SnapshotLogger class
    - Implement `log_snapshot()` appending context with timestamp to JSON file
    - Implement `get_snapshots()` querying by time range
    - Implement `get_recent_snapshots()` returning most recent N snapshots
    - Implement `cleanup_old_snapshots()` removing data older than 7 days
    - Use thread-safe file access and handle disk full errors gracefully
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [~] 3.2 Implement Pattern Analyzer for routine detection
    - Create `src/memory/pattern_analyzer.py` with PatternAnalyzer class
    - Implement `detect_patterns()` grouping snapshots by day/time buckets
    - Identify patterns with 3+ repetitions in same 30-minute bucket
    - Calculate pattern strength as repetitions / total_weeks_observed
    - Implement `get_pattern_at_time()` finding pattern for target day/time
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [~] 3.3 Implement Routine Builder for routine models
    - Create `src/memory/routine_builder.py` with RoutineBuilder class
    - Implement `build_routine()` generating weekly schedule from patterns
    - Implement `get_expected_context()` predicting context at target time
    - Implement `export_routine_markdown()` creating human-readable summary
    - Include transition points and confidence scores per time slot
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4. Implement Intelligence Layer modules
  - [~] 4.1 Implement Stress Detector with multi-signal analysis
    - Create `src/predictors/stress_detector.py` with StressDetector class
    - Implement `calculate_stress()` using weighted average of 4 signals
    - Implement `_battery_stress()` with formula: max(0, (30-battery)/30)
    - Implement `_notification_stress()` with formula: min(1.0, notifications/20)
    - Implement `_meeting_density_stress()` counting meetings in next 2 hours
    - Implement `_time_pressure_stress()` with formula: 1.0 - (minutes_to_event/60)
    - Use weights: battery 0.20, notifications 0.25, meeting_density 0.35, time_pressure 0.20
    - Default to 0.3 when insufficient data available
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [~] 4.2 Implement Proactive Predictor for 15-minute advance predictions
    - Create `src/predictors/proactive_predictor.py` with ProactivePredictor class
    - Implement `predict_next_context()` with calendar-based prediction (highest priority)
    - Map event types to contexts: meeting→work, workout→fitness, class→learning, personal→calm
    - Implement routine-based prediction fallback using pattern strength > 0.6
    - Return None if no calendar event and no strong routine pattern
    - Include prediction_source field ("calendar" or "routine")
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [~] 4.3 Implement Confidence Engine for prediction scoring
    - Create `src/predictors/confidence_engine.py` with ConfidenceEngine class
    - Implement `calculate_confidence()` with base confidence 0.90 for calendar predictions
    - Use pattern_strength as base confidence for routine predictions
    - Calculate data_quality from sensor availability (GPS +0.1, WiFi +0.1, Calendar +0.1, Battery +0.05, Notifications +0.05, base 0.6)
    - Multiply base_confidence by data_quality for final score
    - _Requirements: 7.3, 7.5_

- [~] 5. Implement Context Builder for unified JSON assembly
  - Create `src/engine/context_builder.py` with ContextBuilder class
  - Implement `build_context()` orchestrating all layers
  - Collect sensor data from GPS, WiFi, Calendar, Battery, Notifications
  - Determine location with WiFi priority, GPS fallback
  - Extract current and upcoming calendar events
  - Calculate stress score using StressDetector
  - Query routine patterns from RoutineBuilder
  - Generate proactive prediction using ProactivePredictor
  - Calculate prediction confidence using ConfidenceEngine
  - Implement `_validate_schema()` checking required fields, types, and ranges
  - Assemble Context JSON matching M1 integration contract
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [~] 6. Implement M1 Integrator for REST API and file-based delivery
  - Create `src/engine/m1_integrator.py` with M1Integrator class
  - Implement `send_context()` attempting REST API first, file fallback on failure
  - Implement `_send_via_api()` with POST to M1_API_URL/context endpoint
  - Include Authorization header with Bearer token
  - Use 5-second timeout for API requests
  - Implement `_send_via_file()` writing to ../pi-engine/context.json
  - Implement `get_metrics()` tracking api_success, api_failure, file_fallback counts
  - Log all transmission attempts with status
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [~] 7. Implement Heartbeat Scheduler for 60-second cycles
  - Create `src/engine/heartbeat_scheduler.py` with HeartbeatScheduler class
  - Implement `start()` initializing APScheduler BackgroundScheduler with IntervalTrigger
  - Implement `stop()` gracefully shutting down scheduler
  - Implement `get_status()` returning cycle count, error count, last cycle time
  - Implement `_execute_cycle()` calling context_builder.build_context() and m1_integrator.send_context()
  - Log cycle start, duration, and completion with structured logging
  - Handle long-running cycles (>60s) with warnings
  - Track cycle count and error count for monitoring
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [~] 8. Implement main entry point and configuration
  - Create `src/main.py` with main() function
  - Load configuration from .env using python-dotenv
  - Initialize all layers with dependency injection
  - Create HeartbeatScheduler and start it
  - Handle SIGTERM/SIGINT for graceful shutdown
  - Set up structured logging with INFO level for demo
  - Add startup banner with system information
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 12.1, 12.6, 12.7_

- [~] 9. Seed realistic historical data for pattern detection
  - Create `src/utils/seed_data.py` script
  - Generate 7 days of historical snapshots with realistic patterns
  - Include weekday routine: home→office→gym→home
  - Include weekend routine: home→cafe→gym→home
  - Vary timing slightly (±15 minutes) for realism
  - Include stress variations and notification patterns
  - Write snapshots to memory/snapshots.json
  - _Requirements: 6.5, 13.6, 13.7_

- [~] 10. Checkpoint - Verify core functionality
  - Run `python src/main.py` and verify heartbeat starts
  - Check logs for sensor data collection
  - Verify context.json is created in ../pi-engine/
  - Verify snapshots.json is created in memory/
  - Ensure all tests pass, ask the user if questions arise

- [-] 11. Add utility modules for shared functionality
  - Create `src/utils/time_utils.py` with datetime helpers
  - Add functions: get_current_time(), get_day_of_week(), get_time_bucket(), minutes_between()
  - Create `src/utils/geofence_utils.py` with geofence calculations
  - Add functions: point_in_geofence(), distance_between_coords()
  - Include comprehensive docstrings and type hints
  - _Requirements: 14.3, 15.2, 15.3_

- [ ] 12. Write unit tests for core components
  - Create `tests/test_stress_detector.py` testing stress calculation formulas
  - Create `tests/test_proactive_predictor.py` testing calendar and routine predictions
  - Create `tests/test_pattern_analyzer.py` testing pattern detection with 3+ repetitions
  - Create `tests/test_context_builder.py` testing schema validation
  - Use pytest framework with fixtures for test data
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.2, 7.1, 7.2, 8.6_

- [ ] 13. Write integration tests for end-to-end flow
  - Create `tests/test_integration.py` testing complete heartbeat cycle
  - Test sensor collection → context building → M1 delivery
  - Test API failure → file fallback mechanism
  - Test pattern detection from seeded historical data
  - Verify Context JSON matches M1 schema
  - _Requirements: 9.3, 9.5, 6.1, 8.1_

- [~] 14. Polish logging and demo presentation
  - Add structured logging with timestamps and log levels
  - Log pattern discoveries with pattern details (day, time, context, strength)
  - Log proactive predictions with predicted context, confidence, and reasoning
  - Log stress score changes with contributing factors
  - Add color-coded console output for demo visibility
  - Create demo mode flag that adds extra explanatory logging
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 13.7_

- [~] 15. Create comprehensive documentation
  - Update README.md with architecture diagram, setup instructions, and usage examples
  - Add troubleshooting section for common issues
  - Document environment variables with descriptions and defaults
  - Add demo script showing typical output
  - Include M1 integration contract specification
  - Add developer notes for extending sensors and predictors
  - _Requirements: 15.6, 15.7_

- [~] 16. Final checkpoint - End-to-end verification
  - Run complete system for 5 minutes and verify continuous operation
  - Verify M1 receives context updates every 60 seconds
  - Check that pattern detection works with seeded data
  - Verify proactive predictions are generated 15 minutes before transitions
  - Confirm stress scores vary realistically based on context
  - Test graceful shutdown with Ctrl+C
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Sensor Layer modules (2.1-2.5) can be implemented in parallel
- Memory Layer modules (3.1-3.3) have dependencies: 3.1 → 3.2 → 3.3
- Intelligence Layer modules (4.1-4.3) can be implemented in parallel
- Context Builder (5) depends on all sensor, memory, and intelligence modules
- M1 Integrator (6) and Heartbeat Scheduler (7) can be implemented in parallel after Context Builder
- Seeding historical data (9) should happen before testing pattern detection
- All tasks reference specific requirements for traceability
- Checkpoints (10, 16) ensure incremental validation
- Focus on MUST-HAVE features for M1 integration: sensors, context building, stress detection, memory, prediction, M1 delivery, heartbeat scheduling

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "11"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3", "4.1", "4.2", "4.3"] },
    { "id": 5, "tasks": ["5", "9"] },
    { "id": 6, "tasks": ["6", "7"] },
    { "id": 7, "tasks": ["8"] },
    { "id": 8, "tasks": ["10"] },
    { "id": 9, "tasks": ["12", "13", "14"] },
    { "id": 10, "tasks": ["15"] },
    { "id": 11, "tasks": ["16"] }
  ]
}
```
