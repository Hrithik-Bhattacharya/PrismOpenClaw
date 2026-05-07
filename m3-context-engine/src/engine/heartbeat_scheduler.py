"""
Heartbeat Scheduler - 60-second cycle management
Orchestrates periodic context updates using APScheduler
"""

import time
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from typing import Dict, Any


class HeartbeatScheduler:
    """Manages periodic context update cycles"""
    
    def __init__(
        self,
        context_builder,
        m1_integrator,
        snapshot_logger,
        interval_seconds: int = 60
    ):
        """
        Initialize heartbeat scheduler
        
        Args:
            context_builder: ContextBuilder instance
            m1_integrator: M1Integrator instance
            snapshot_logger: SnapshotLogger instance
            interval_seconds: Heartbeat interval in seconds
        """
        self.context_builder = context_builder
        self.m1_integrator = m1_integrator
        self.snapshot_logger = snapshot_logger
        self.interval_seconds = interval_seconds
        
        self.scheduler = BackgroundScheduler()
        self.cycle_count = 0
        self.error_count = 0
        self.last_cycle_time = None
        self.is_running = False
    
    def start(self) -> None:
        """Start the heartbeat scheduler"""
        if self.is_running:
            print("⚠️  Heartbeat already running")
            return
        
        print(f"🚀 Starting M3 Context Engine heartbeat ({self.interval_seconds}s interval)")
        
        # Add job to scheduler
        self.scheduler.add_job(
            func=self._execute_cycle,
            trigger=IntervalTrigger(seconds=self.interval_seconds),
            id='heartbeat',
            name='Context Update Cycle',
            replace_existing=True
        )
        
        # Start scheduler
        self.scheduler.start()
        self.is_running = True
        
        # Execute first cycle immediately
        self._execute_cycle()
        
        print(f"✅ Heartbeat started successfully")
    
    def stop(self) -> None:
        """Stop the heartbeat scheduler"""
        if not self.is_running:
            return
        
        print("🛑 Stopping M3 Context Engine heartbeat...")
        
        self.scheduler.shutdown(wait=True)
        self.is_running = False
        
        print("✅ Heartbeat stopped")
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get scheduler status
        
        Returns:
            Status dictionary with metrics
        """
        return {
            "is_running": self.is_running,
            "cycle_count": self.cycle_count,
            "error_count": self.error_count,
            "last_cycle_time": self.last_cycle_time.isoformat() if self.last_cycle_time else None,
            "interval_seconds": self.interval_seconds
        }
    
    def _execute_cycle(self) -> None:
        """Execute a single context update cycle"""
        cycle_start = time.time()
        self.cycle_count += 1
        
        try:
            print(f"\n{'='*60}")
            print(f"🔄 Cycle #{self.cycle_count} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*60}")
            
            # Build context
            print("📊 Building context...")
            context = self.context_builder.build_context()
            
            # Log snapshot
            print("💾 Logging snapshot...")
            self.snapshot_logger.log_snapshot(context)
            
            # Send to M1
            print("📡 Sending to M1...")
            success = self.m1_integrator.send_context(context)
            
            if success:
                print("✅ Context delivered successfully")
            else:
                print("❌ Context delivery failed")
                self.error_count += 1
            
            # Display context summary
            print(f"\n📍 Location: {context.get('location')}")
            print(f"📅 Event: {context.get('calendar_event')}")
            print(f"😰 Stress: {context.get('stress'):.2f}")
            print(f"🔋 Battery: {context.get('battery')}%")
            print(f"🔔 Notifications: {context.get('notifications')}")
            print(f"🏃 Activity: {context.get('activity')}")
            
            if context.get('predicted_next_context'):
                print(f"🔮 Prediction: {context.get('predicted_next_context')} (confidence: {context.get('confidence'):.2f})")
            
            # Calculate cycle duration
            cycle_duration = time.time() - cycle_start
            print(f"\n⏱️  Cycle completed in {cycle_duration:.2f}s")
            
            if cycle_duration > self.interval_seconds:
                print(f"⚠️  WARNING: Cycle took longer than interval ({cycle_duration:.2f}s > {self.interval_seconds}s)")
            
            self.last_cycle_time = datetime.now()
            
        except Exception as e:
            self.error_count += 1
            print(f"❌ Cycle error: {e}")
            import traceback
            traceback.print_exc()
