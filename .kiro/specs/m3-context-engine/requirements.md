# Requirements Document: M3 Context Engine

## Introduction

The M3 Context Engine is an intelligent context-sensing and prediction system designed for the PrismOpenClaw Phantom Mode hackathon project. The system monitors device and user context through multiple sensors, learns routine patterns from historical data, predicts future context transitions proactively, and provides unified context information to the M1 (Pi Engine) decision-making system via REST API every 60 seconds.

The M3 Context Engine operates as a pure data provider in the PrismOpenClaw architecture—it gathers, analyzes, and predicts context but never makes persona decisions. All decision-making authority resides with M1 (Pi Engine).

## Glossary

- **M3_Context_Engine**: The intelligent context-sensing and prediction system responsible for monitoring, learning, and predicting user context
- **M1_Pi_Engine**: The central decision-making brain of PrismOpenClaw that receives context from M3 and determines persona switches
- **Context_JSON**: The standardized JSON payload containing all sensor data, predictions, and confidence scores
- **Sensor_Layer**: The collection of modules that gather raw data from device sensors and external APIs
- **Memory_Layer**: The historical data storage and snapshot logging system
- **Intelligence_Layer**: The analysis and prediction components including stress detection, pattern analysis, and proactive prediction
- **Context_Builder**: The module that assembles unified Context_JSON from all sensor inputs and predictions
- **Heartbeat_Scheduler**: The APScheduler-based timing system that triggers context updates every 60 seconds
- **Routine_Pattern**: A detected recurring sequence of contexts based on time and day of week
- **Stress_Score**: A normalized value between 0.0 and 1.0 representing detected stress level
- **Confidence_Score**: A normalized value between 0.0 and 1.0 representing prediction certainty
- **Context_Transition**: A change from one context state to another (e.g., from "home" to "office")
- **Proactive_Prediction**: A prediction made 15 minutes before an expected context transition
- **Geofence**: A virtual geographic boundary used to detect location-based context
- **Context_Snapshot**: A timestamped record of complete context state stored every 60 seconds

## Requirements

### Requirement 1: Sensor Data Collection

**User Story:** As the M3 Context Engine, I want to collect real-time sensor data from multiple sources, so that I can build an accurate picture of the user's current context.

#### Acceptance Criteria

1. WHEN the Heartbeat_Scheduler triggers a cycle, THE Sensor_Layer SHALL collect GPS coordinates or WiFi SSID data
2. WHEN the Heartbeat_Scheduler triggers a cycle, THE Sensor_Layer SHALL retrieve current and upcoming calendar events with timestamps
3. WHEN the Heartbeat_Scheduler triggers a cycle, THE Sensor_Layer SHALL read device battery percentage
4. WHEN the Heartbeat_Scheduler triggers a cycle, THE Sensor_Layer SHALL count unread notifications
5. WHEN hardware sensors are unavailable, THE Sensor_Layer SHALL use simulated data that follows realistic patterns
6. WHEN sensor data collection fails, THE Sensor_Layer SHALL log the error and use the last valid reading

### Requirement 2: Location Context Detection

**User Story:** As the M3 Context Engine, I want to detect and classify the user's location, so that location-based context can inform predictions.

#### Acceptance Criteria

1. WHEN GPS coordinates are available, THE M3_Context_Engine SHALL map coordinates to named locations using Geofence boundaries
2. WHEN WiFi SSID is available, THE M3_Context_Engine SHALL map SSID to named locations using a lookup table
3. WHEN both GPS and WiFi are available, THE M3_Context_Engine SHALL prioritize WiFi SSID for location detection
4. WHEN location cannot be determined, THE M3_Context_Engine SHALL use "unknown" as the location value
5. THE M3_Context_Engine SHALL support at minimum these location classifications: "home", "office", "college", "gym", "commute"

### Requirement 3: Calendar Event Processing

**User Story:** As the M3 Context Engine, I want to parse calendar data and identify current and upcoming events, so that time-sensitive context can be provided.

#### Acceptance Criteria

1. WHEN calendar data is available, THE M3_Context_Engine SHALL identify the currently active event based on current timestamp
2. WHEN calendar data is available, THE M3_Context_Engine SHALL identify the next upcoming event after the current time
3. WHEN an upcoming event is identified, THE M3_Context_Engine SHALL calculate time_to_event in minutes
4. WHEN no calendar event is active, THE M3_Context_Engine SHALL set calendar_event to "none"
5. WHEN no upcoming event exists, THE M3_Context_Engine SHALL set upcoming_event to null and time_to_event to null
6. WHEN calendar API is unavailable, THE M3_Context_Engine SHALL use simulated calendar data for demo purposes

### Requirement 4: Stress Level Detection

**User Story:** As the M3 Context Engine, I want to detect user stress levels from multiple signals, so that stress-aware context can be provided to M1.

#### Acceptance Criteria

1. WHEN calculating stress, THE M3_Context_Engine SHALL incorporate battery level as a stress factor (lower battery increases stress)
2. WHEN calculating stress, THE M3_Context_Engine SHALL incorporate notification count as a stress factor (more notifications increase stress)
3. WHEN calculating stress, THE M3_Context_Engine SHALL incorporate meeting density as a stress factor (back-to-back meetings increase stress)
4. WHEN calculating stress, THE M3_Context_Engine SHALL incorporate time pressure as a stress factor (approaching deadlines increase stress)
5. THE M3_Context_Engine SHALL output Stress_Score as a normalized value between 0.0 and 1.0
6. WHEN insufficient data is available for stress calculation, THE M3_Context_Engine SHALL default to a Stress_Score of 0.3

### Requirement 5: Context Snapshot Logging

**User Story:** As the M3 Context Engine, I want to log complete context snapshots every 60 seconds, so that historical data is available for pattern analysis.

#### Acceptance Criteria

1. WHEN the Heartbeat_Scheduler completes a cycle, THE Memory_Layer SHALL store a Context_Snapshot with timestamp
2. THE Context_Snapshot SHALL include all sensor readings, calculated stress, and predictions
3. THE Memory_Layer SHALL persist Context_Snapshot data to disk in JSON format
4. WHEN storage space is limited, THE Memory_Layer SHALL retain at minimum 7 days of Context_Snapshot history
5. THE Memory_Layer SHALL provide query methods to retrieve Context_Snapshot data by time range

### Requirement 6: Routine Pattern Analysis

**User Story:** As the M3 Context Engine, I want to analyze historical context data to detect routine patterns, so that predictable behaviors can be learned.

#### Acceptance Criteria

1. WHEN analyzing historical data, THE Intelligence_Layer SHALL identify Routine_Pattern sequences based on day of week and time of day
2. WHEN a context sequence repeats at least 3 times at similar times, THE Intelligence_Layer SHALL classify it as a Routine_Pattern
3. THE Intelligence_Layer SHALL calculate pattern strength based on repetition frequency and consistency
4. THE Intelligence_Layer SHALL store detected Routine_Pattern data with associated confidence metrics
5. WHEN insufficient historical data exists (less than 3 days), THE Intelligence_Layer SHALL not generate Routine_Pattern predictions

### Requirement 7: Proactive Context Prediction

**User Story:** As the M3 Context Engine, I want to predict the next context transition before it happens, so that M1 can make proactive persona decisions.

#### Acceptance Criteria

1. WHEN a Routine_Pattern indicates an upcoming transition, THE Intelligence_Layer SHALL generate a Proactive_Prediction 15 minutes before the expected transition time
2. WHEN calendar data indicates an upcoming event, THE Intelligence_Layer SHALL predict the next context based on event type and location
3. THE Intelligence_Layer SHALL calculate a Confidence_Score for each prediction based on pattern strength and data quality
4. THE Intelligence_Layer SHALL include predicted_next_context and confidence fields in Context_JSON
5. WHEN no prediction can be made with confidence above 0.5, THE Intelligence_Layer SHALL set predicted_next_context to null

### Requirement 8: Unified Context JSON Generation

**User Story:** As the M3 Context Engine, I want to generate a standardized Context_JSON payload, so that M1 receives consistent, well-structured context data.

#### Acceptance Criteria

1. THE Context_Builder SHALL generate Context_JSON containing all required fields specified by M1 integration contract
2. THE Context_JSON SHALL include these required fields: location, calendar_event, upcoming_event, time_to_event, stress, battery, notifications, activity
3. THE Context_JSON SHALL include these prediction fields: predicted_next_context, confidence
4. THE Context_JSON SHALL use data types matching the M1 integration specification (strings for names, numbers for metrics)
5. WHEN optional fields have no data, THE Context_JSON SHALL use null values rather than omitting fields
6. THE Context_Builder SHALL validate Context_JSON against the schema before transmission

### Requirement 9: M1 Integration via REST API

**User Story:** As the M3 Context Engine, I want to push context updates to M1 via REST API, so that M1 receives timely context information for decision-making.

#### Acceptance Criteria

1. WHEN the Heartbeat_Scheduler completes a context update cycle, THE M3_Context_Engine SHALL POST Context_JSON to the M1_Pi_Engine REST endpoint
2. THE M3_Context_Engine SHALL include authentication token in the Authorization header when posting to M1
3. WHEN the M1 REST endpoint is unavailable, THE M3_Context_Engine SHALL log the failure and retry on the next cycle
4. WHEN the M1 REST endpoint returns an error, THE M3_Context_Engine SHALL log the error details for debugging
5. THE M3_Context_Engine SHALL support fallback mode where Context_JSON is written to a shared file if REST API is unavailable
6. THE M3_Context_Engine SHALL track successful and failed transmission attempts for monitoring

### Requirement 10: Heartbeat Scheduling

**User Story:** As the M3 Context Engine, I want to run context updates on a reliable 60-second schedule, so that M1 receives regular context updates.

#### Acceptance Criteria

1. THE Heartbeat_Scheduler SHALL trigger a complete context update cycle every 60 seconds
2. THE Heartbeat_Scheduler SHALL use APScheduler for reliable scheduling
3. WHEN a context update cycle takes longer than 60 seconds, THE Heartbeat_Scheduler SHALL log a warning and continue with the next scheduled cycle
4. THE Heartbeat_Scheduler SHALL continue running even if individual cycles fail
5. THE Heartbeat_Scheduler SHALL provide start, stop, and status methods for lifecycle management

### Requirement 11: Configuration Management

**User Story:** As a developer, I want to configure M3 Context Engine settings via environment variables, so that deployment and testing are flexible.

#### Acceptance Criteria

1. THE M3_Context_Engine SHALL load configuration from environment variables using python-dotenv
2. THE M3_Context_Engine SHALL support configuration of M1_API_URL for the M1 REST endpoint
3. THE M3_Context_Engine SHALL support configuration of M1_API_TOKEN for authentication
4. THE M3_Context_Engine SHALL support configuration of HEARTBEAT_INTERVAL for scheduling (default 60 seconds)
5. THE M3_Context_Engine SHALL support configuration of SIMULATION_MODE to enable/disable hardware sensor simulation
6. WHEN required environment variables are missing, THE M3_Context_Engine SHALL log clear error messages and use safe defaults

### Requirement 12: Logging and Monitoring

**User Story:** As a developer, I want comprehensive logging of M3 operations, so that I can debug issues and demonstrate system intelligence during demos.

#### Acceptance Criteria

1. THE M3_Context_Engine SHALL log each context update cycle with timestamp and summary
2. THE M3_Context_Engine SHALL log detected Routine_Pattern discoveries with pattern details
3. THE M3_Context_Engine SHALL log Proactive_Prediction events with predicted context and confidence
4. THE M3_Context_Engine SHALL log sensor failures and fallback actions
5. THE M3_Context_Engine SHALL log M1 API transmission status (success/failure)
6. THE M3_Context_Engine SHALL use structured logging with appropriate log levels (INFO, WARNING, ERROR)
7. THE M3_Context_Engine SHALL output logs in a format suitable for demo presentation

### Requirement 13: Demo-Ready Simulation Mode

**User Story:** As a hackathon participant, I want M3 to run with realistic simulated data when hardware sensors are unavailable, so that the system can be demonstrated without physical devices.

#### Acceptance Criteria

1. WHEN SIMULATION_MODE is enabled, THE M3_Context_Engine SHALL generate realistic GPS coordinates that follow a daily routine pattern
2. WHEN SIMULATION_MODE is enabled, THE M3_Context_Engine SHALL generate realistic WiFi SSID data corresponding to simulated locations
3. WHEN SIMULATION_MODE is enabled, THE M3_Context_Engine SHALL generate realistic calendar events with appropriate timing
4. WHEN SIMULATION_MODE is enabled, THE M3_Context_Engine SHALL generate realistic battery drain patterns
5. WHEN SIMULATION_MODE is enabled, THE M3_Context_Engine SHALL generate realistic notification patterns that vary by time of day
6. THE simulated data SHALL demonstrate clear routine patterns that can be detected by the pattern analyzer
7. THE simulated data SHALL trigger Proactive_Prediction events to showcase intelligence

### Requirement 14: Modular Architecture

**User Story:** As a developer, I want M3 to have a clean, modular architecture, so that components can be developed, tested, and maintained independently.

#### Acceptance Criteria

1. THE M3_Context_Engine SHALL separate concerns into distinct modules: Sensor_Layer, Context_Builder, Memory_Layer, Intelligence_Layer, and Heartbeat_Scheduler
2. WHEN one module fails, THE M3_Context_Engine SHALL isolate the failure and continue operating with degraded functionality
3. THE M3_Context_Engine SHALL define clear interfaces between modules
4. THE M3_Context_Engine SHALL allow individual modules to be tested independently
5. THE M3_Context_Engine SHALL follow Python best practices for package structure and imports

### Requirement 15: Production-Grade Quality

**User Story:** As a hackathon judge, I want M3 to look and behave like a production-grade system, so that the technical quality is evident.

#### Acceptance Criteria

1. THE M3_Context_Engine SHALL include comprehensive error handling for all external dependencies
2. THE M3_Context_Engine SHALL include type hints for all public functions and methods
3. THE M3_Context_Engine SHALL include docstrings for all modules, classes, and public functions
4. THE M3_Context_Engine SHALL follow PEP 8 style guidelines
5. THE M3_Context_Engine SHALL include a requirements.txt file with pinned dependency versions
6. THE M3_Context_Engine SHALL include a README.md with clear setup and usage instructions
7. THE M3_Context_Engine SHALL run successfully immediately after pip install with minimal configuration

