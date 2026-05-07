# 🧠 M3 Context Engine

**Intelligent Context-Sensing and Proactive Prediction System for PrismOpenClaw Phantom Mode**

M3 Context Engine is the intelligent data provider for the PrismOpenClaw system. It monitors device and user context through multiple sensors, learns routine patterns from historical data, predicts future context transitions proactively, and provides unified context information to the M1 (Pi Engine) decision-making system.

---

## 🏗️ Architecture

```
M3 Context Engine
│
├── Sensor Layer
│   ├── GPS Sensor (geofencing)
│   ├── WiFi Sensor (SSID mapping)
│   ├── Calendar Sensor (event extraction)
│   ├── Battery Sensor (realistic drain)
│   └── Notification Sensor (time-based patterns)
│
├── Memory Layer
│   ├── Snapshot Logger (historical data)
│   ├── Pattern Analyzer (routine detection)
│   └── Routine Builder (routine models)
│
├── Intelligence Layer
│   ├── Stress Detector (multi-signal analysis)
│   ├── Proactive Predictor (15-min advance)
│   └── Confidence Engine (prediction scoring)
│
├── Context Builder (unified JSON assembly)
├── M1 Integrator (REST API + file fallback)
└── Heartbeat Scheduler (60-second cycles)
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your M1 API URL and token
```

### 3. Generate Seed Data (Optional)

```bash
python src/utils/seed_data.py
```

### 4. Run M3 Context Engine

```bash
python src/main.py
```

---

## 📋 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `M1_API_URL` | M1 Pi Engine API endpoint | `http://localhost:5000` |
| `M1_API_TOKEN` | Authentication token for M1 | - |
| `HEARTBEAT_INTERVAL` | Update frequency (seconds) | `60` |
| `SIMULATION_MODE` | Enable sensor simulation | `true` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `DEMO_MODE` | Enable demo-friendly logging | `true` |
| `SNAPSHOT_RETENTION_DAYS` | Historical data retention | `7` |
| `PATTERN_MIN_REPETITIONS` | Min repetitions for patterns | `3` |
| `PATTERN_TIME_BUCKET_MINUTES` | Time bucket size | `30` |
| `PREDICTION_ADVANCE_MINUTES` | Prediction lead time | `15` |
| `PREDICTION_MIN_CONFIDENCE` | Min confidence threshold | `0.5` |

---

## 📡 M1 Integration Contract

M3 sends context to M1 in this exact format:

```json
{
  "location": "office",
  "calendar_event": "Daily Standup",
  "upcoming_event": "Project Review",
  "time_to_event": 14,
  "stress": 0.45,
  "battery": 82,
  "notifications": 3,
  "activity": "working",
  "predicted_next_context": "gym",
  "confidence": 0.84
}
```

### Required Fields

- `location` (string): Current physical location
- `calendar_event` (string): Currently active event or "none"
- `stress` (number): Stress level (0.0-1.0)
- `battery` (number): Battery percentage (0-100)
- `notifications` (number): Unread notification count (0-999)
- `activity` (string): Current user activity

### Optional Fields

- `upcoming_event` (string|null): Next upcoming event
- `time_to_event` (number|null): Minutes until upcoming event
- `predicted_next_context` (string): Predicted next context
- `confidence` (number): Prediction confidence (0.0-1.0)

---

## 🎯 Key Features

### 1. **Sensor Layer**
- GPS geofencing with smooth transitions
- WiFi SSID-to-location mapping
- Calendar event extraction and time calculations
- Realistic battery drain simulation
- Time-based notification patterns

### 2. **Memory Layer**
- Thread-safe snapshot logging
- 7-day historical data retention
- Pattern detection from 3+ repetitions
- 30-minute time bucket analysis
- Human-readable routine summaries

### 3. **Intelligence Layer**
- Multi-signal stress detection (battery, notifications, meetings, time pressure)
- Proactive 15-minute advance predictions
- Calendar-based prediction (priority)
- Routine-based prediction (fallback)
- Confidence scoring with data quality assessment

### 4. **M1 Integration**
- REST API with Bearer token authentication
- 5-second timeout for API requests
- Automatic file fallback on API failure
- Transmission metrics tracking

### 5. **Heartbeat Scheduler**
- APScheduler-based 60-second cycles
- Graceful error handling
- Long-running cycle warnings
- Cycle count and error tracking

---

## 🎭 Simulation Mode

When `SIMULATION_MODE=true`, M3 generates realistic simulated data:

- **GPS**: Daily routine with smooth transitions (home → office → gym → home)
- **WiFi**: SSID mapping synced with GPS location
- **Calendar**: Realistic daily schedule with meetings, lunch, gym
- **Battery**: Realistic drain/charge patterns
- **Notifications**: Time-based patterns with meeting spikes

---

## 📊 Demo Output

```
============================================================
🔄 Cycle #1 - 2026-05-07 14:30:00
============================================================
📊 Building context...
💾 Logging snapshot...
📡 Sending to M1...
✅ Context delivered successfully

📍 Location: office
📅 Event: Daily Standup
😰 Stress: 0.52
🔋 Battery: 75%
🔔 Notifications: 7
🏃 Activity: in_meeting
🔮 Prediction: gym (confidence: 0.84)

⏱️  Cycle completed in 0.15s
```

---

## 🛠️ Development

### Project Structure

```
m3-context-engine/
├── src/
│   ├── sensors/          # GPS, WiFi, Calendar, Battery, Notifications
│   ├── memory/           # Snapshot logger, Pattern analyzer, Routine builder
│   ├── predictors/       # Stress detector, Proactive predictor, Confidence engine
│   ├── engine/           # Context builder, M1 integrator, Heartbeat scheduler
│   ├── utils/            # Time utils, Geofence utils, Seed data
│   └── main.py           # Entry point
├── memory/               # Data storage (snapshots.json, routine.md)
├── tests/                # Unit and integration tests
├── requirements.txt      # Python dependencies
├── .env.example          # Environment template
└── README.md             # This file
```

### Running Tests

```bash
pytest tests/
```

### Generating Seed Data

```bash
python src/utils/seed_data.py
```

---

## 🔧 Troubleshooting

### M1 API Connection Failed

- Check `M1_API_URL` in `.env`
- Verify M1 Pi Engine is running
- Check network connectivity
- M3 will automatically fallback to file mode

### No Patterns Detected

- Run `python src/utils/seed_data.py` to generate historical data
- Wait for 3+ days of real data collection
- Check `PATTERN_MIN_REPETITIONS` setting

### High Cycle Duration

- Reduce `HEARTBEAT_INTERVAL` if cycles take too long
- Check sensor performance
- Review logs for bottlenecks

---

## 📝 License

Part of the PrismOpenClaw Phantom Mode hackathon project.

---

## 🤝 Integration with M1

M3 operates as a pure data provider:
- **M3 Role**: Gather, analyze, and predict context
- **M1 Role**: Make persona decisions based on M3 data
- **Communication**: REST API (primary) + File fallback (secondary)
- **Frequency**: Every 60 seconds (configurable)

---

## 🎓 Learn More

- See `.kiro/specs/m3-context-engine/` for detailed requirements and design
- Check `pi-engine/TEAM_INTEGRATION.md` for M1 integration details
- Review `memory/routine.md` for detected patterns

---

**Built with ❤️ for Samsung Clash of the Claws Hackathon**
