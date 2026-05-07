"""
M3 Context Engine - Main Entry Point
Intelligent context-sensing and prediction system for PrismOpenClaw Phantom Mode
"""

import os
import sys
import signal
from dotenv import load_dotenv

# Add src to path
sys.path.insert(0, os.path.dirname(__file__))

# Import all components
from sensors.gps_sensor import GPSSensor
from sensors.wifi_sensor import WiFiSensor
from sensors.calendar_sensor import CalendarSensor
from sensors.battery_sensor import BatterySensor
from sensors.notification_sensor import NotificationSensor

from memory.snapshot_logger import SnapshotLogger
from memory.pattern_analyzer import PatternAnalyzer
from memory.routine_builder import RoutineBuilder

from predictors.stress_detector import StressDetector
from predictors.proactive_predictor import ProactivePredictor
from predictors.confidence_engine import ConfidenceEngine

from engine.context_builder import ContextBuilder
from engine.m1_integrator import M1Integrator
from engine.heartbeat_scheduler import HeartbeatScheduler


def print_banner():
    """Print startup banner"""
    print("\n" + "="*60)
    print("🧠 M3 CONTEXT ENGINE - PrismOpenClaw Phantom Mode")
    print("="*60)
    print("Intelligent Context Sensing & Proactive Prediction")
    print("="*60 + "\n")


def load_config():
    """Load configuration from environment"""
    load_dotenv()
    
    config = {
        "m1_api_url": os.getenv("M1_API_URL", "http://localhost:5000"),
        "m1_api_token": os.getenv("M1_API_TOKEN"),
        "heartbeat_interval": int(os.getenv("HEARTBEAT_INTERVAL", "60")),
        "simulation_mode": os.getenv("SIMULATION_MODE", "true").lower() == "true",
        "log_level": os.getenv("LOG_LEVEL", "INFO"),
        "demo_mode": os.getenv("DEMO_MODE", "true").lower() == "true",
        "snapshot_retention_days": int(os.getenv("SNAPSHOT_RETENTION_DAYS", "7")),
        "memory_dir": os.getenv("MEMORY_DIR", "./memory"),
        "pattern_min_repetitions": int(os.getenv("PATTERN_MIN_REPETITIONS", "3")),
        "pattern_time_bucket_minutes": int(os.getenv("PATTERN_TIME_BUCKET_MINUTES", "30")),
        "prediction_advance_minutes": int(os.getenv("PREDICTION_ADVANCE_MINUTES", "15")),
        "prediction_min_confidence": float(os.getenv("PREDICTION_MIN_CONFIDENCE", "0.5")),
    }
    
    return config


def initialize_system(config):
    """Initialize all system components"""
    print("🔧 Initializing system components...")
    
    # Sensor Layer
    print("  📡 Initializing sensors...")
    gps_sensor = GPSSensor(simulation_mode=config["simulation_mode"])
    wifi_sensor = WiFiSensor(simulation_mode=config["simulation_mode"], gps_sensor=gps_sensor)
    calendar_sensor = CalendarSensor(simulation_mode=config["simulation_mode"])
    battery_sensor = BatterySensor(simulation_mode=config["simulation_mode"], gps_sensor=gps_sensor)
    notification_sensor = NotificationSensor(
        simulation_mode=config["simulation_mode"],
        calendar_sensor=calendar_sensor,
        gps_sensor=gps_sensor
    )
    
    # Memory Layer
    print("  💾 Initializing memory layer...")
    snapshot_logger = SnapshotLogger(
        storage_path=f"{config['memory_dir']}/snapshots.json",
        retention_days=config["snapshot_retention_days"]
    )
    pattern_analyzer = PatternAnalyzer(
        bucket_minutes=config["pattern_time_bucket_minutes"],
        min_repetitions=config["pattern_min_repetitions"]
    )
    routine_builder = RoutineBuilder(pattern_analyzer=pattern_analyzer)
    
    # Load historical data and build routine
    print("  🔍 Analyzing historical patterns...")
    snapshots = snapshot_logger.get_recent_snapshots(count=1000)
    if snapshots:
        routine_builder.build_routine(snapshots)
        print(f"     Found {len(snapshots)} historical snapshots")
    else:
        print("     No historical data found (will build patterns over time)")
    
    # Intelligence Layer
    print("  🧠 Initializing intelligence layer...")
    stress_detector = StressDetector()
    proactive_predictor = ProactivePredictor(
        routine_builder=routine_builder,
        advance_minutes=config["prediction_advance_minutes"],
        min_confidence=config["prediction_min_confidence"]
    )
    confidence_engine = ConfidenceEngine()
    
    # Context Builder
    print("  🏗️  Initializing context builder...")
    context_builder = ContextBuilder(
        gps_sensor=gps_sensor,
        wifi_sensor=wifi_sensor,
        calendar_sensor=calendar_sensor,
        battery_sensor=battery_sensor,
        notification_sensor=notification_sensor,
        stress_detector=stress_detector,
        proactive_predictor=proactive_predictor,
        confidence_engine=confidence_engine,
        routine_builder=routine_builder
    )
    
    # M1 Integrator
    print("  📡 Initializing M1 integrator...")
    m1_integrator = M1Integrator(
        api_url=config["m1_api_url"],
        api_token=config["m1_api_token"],
        fallback_file_path="../pi-engine/context.json"
    )
    
    # Heartbeat Scheduler
    print("  ⏱️  Initializing heartbeat scheduler...")
    heartbeat = HeartbeatScheduler(
        context_builder=context_builder,
        m1_integrator=m1_integrator,
        snapshot_logger=snapshot_logger,
        interval_seconds=config["heartbeat_interval"]
    )
    
    print("✅ System initialization complete\n")
    
    return heartbeat


def main():
    """Main entry point"""
    # Print banner
    print_banner()
    
    # Load configuration
    print("📋 Loading configuration...")
    config = load_config()
    
    print(f"  M1 API URL: {config['m1_api_url']}")
    print(f"  Heartbeat Interval: {config['heartbeat_interval']}s")
    print(f"  Simulation Mode: {config['simulation_mode']}")
    print(f"  Demo Mode: {config['demo_mode']}")
    print()
    
    # Initialize system
    heartbeat = initialize_system(config)
    
    # Setup signal handlers for graceful shutdown
    def signal_handler(sig, frame):
        print("\n\n🛑 Shutdown signal received...")
        heartbeat.stop()
        print("👋 M3 Context Engine stopped. Goodbye!")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start heartbeat
    heartbeat.start()
    
    print("\n💡 M3 Context Engine is running. Press Ctrl+C to stop.\n")
    
    # Keep main thread alive
    try:
        while True:
            signal.pause()
    except AttributeError:
        # signal.pause() not available on Windows
        import time
        while True:
            time.sleep(1)


if __name__ == "__main__":
    main()
