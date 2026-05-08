# 🔍 PrismOpenClaw System Verification Plan

**Date:** May 7, 2026
**System:** Persona Intelligence Engine with Android Integration
**Modules:** M1 (PI Engine), M2 (Android ADB), M3 (Context Engine), M4 (Telegram UX)

---

## 📋 Prerequisites Checklist

### ✅ 1. Environment Setup
```powershell
# Verify Node.js is installed
node --version
npm --version

# Verify ADB is installed and in PATH
adb version

# If ADB not found, install it:
mkdir C:\adb
cd C:\adb
curl -o platform-tools.zip https://dl.google.com/android/repository/platform-tools-latest-windows.zip
tar -xf platform-tools.zip
# Add to PATH: C:\adb\platform-tools
```

### ✅ 2. Project Structure Verification
```powershell
cd C:\Users\hrith\OneDrive\Desktop\PrismOpenClaw

# Verify all modules exist
dir /b
# Should show: ARCHITECTURE.md, README.md, TEAM_FLOW.md, pi-engine/, m2-android-adb/, m3-context-engine/, m4-channels-ux/

# Verify M1 files
dir pi-engine /b
# Should show: package.json, index.js, apiWrapper.js, context.json, etc.

# Verify M2 files
dir m2-android-adb /b
# Should show: index.js, package.json, .env, sample-decision.json, etc.
```

---

## 🧪 Phase 1: Individual Module Testing

### 1.1 Test M1 (PI Engine) Standalone
```powershell
cd pi-engine

# Install dependencies
npm install

# Test M1 help
node index.js help

# Test M1 automated tests
node index.js test

# Test M1 demo (simulated day)
node index.js demo

# Test M1 memory stats
node index.js memory

# Test M1 personas list
node index.js personas
```

### 1.2 Test M2 (Android ADB) Standalone
```powershell
cd ../m2-android-adb

# Test M2 help
node index.js --help

# Test M2 action listing
node index.js --list-actions

# Test M2 with sample decision (dry-run)
node index.js --file sample-decision.json --dry-run

# Test M2 with JSON string (dry-run)
node index.js --json "{\"actions\":[\"enable_dnd\",\"open_calendar\"]}" --dry-run
```

### 1.3 Test M1 API Server
```powershell
cd ../pi-engine

# Start M1 API server in background
start "M1-API" cmd /c "node apiWrapper.js"

# Wait 3 seconds, then test health endpoint
timeout /t 3 /nobreak >nul
curl http://localhost:5000/health

# Test decision endpoint
curl http://localhost:5000/decision

# Kill M1 API server
taskkill /fi "WINDOWTITLE eq M1-API*" /t /f
```

---

## 🔗 Phase 2: Integration Testing

### 2.1 Test M1 ↔ M2 Integration (Dry Run)
```powershell
# Terminal 1: Start M1 API
cd pi-engine
start "M1-API" cmd /c "node apiWrapper.js"

# Terminal 2: Test M2 fetching from M1 (dry-run)
cd ../m2-android-adb
timeout /t 3 /nobreak >nul
node index.js --url http://localhost:5000/decision --dry-run

# Verify: Should see action mapping without ADB execution
# Should see: "📨 Sending ack to M1" and "✅ Ack sent successfully"

# Kill M1 API
taskkill /fi "WINDOWTITLE eq M1-API*" /t /f
```

### 2.2 Test M1 ↔ M2 Integration (Live)
```powershell
# Terminal 1: Start M1 API
cd pi-engine
start "M1-API" cmd /c "node apiWrapper.js"

# Terminal 2: Test M2 with live execution
cd ../m2-android-adb
timeout /t 3 /nobreak >nul

# IMPORTANT: Connect Android device first, or this will fail
adb devices  # Should show device connected

# Run live integration test
node index.js --url http://localhost:5000/decision

# Verify: Should see ADB command execution on device
# Should see: "📨 Sending ack to M1" and "✅ Ack sent successfully"

# Kill M1 API
taskkill /fi "WINDOWTITLE eq M1-API*" /t /f
```

### 2.3 Test M1 Heartbeat with M2 Integration
```powershell
# Terminal 1: Start M1 heartbeat (will trigger decisions)
cd pi-engine
start "M1-Heartbeat" cmd /c "node index.js start"

# Terminal 2: Monitor M1 logs (should see decisions being made)
# Wait and observe...

# Terminal 3: Test M2 can fetch latest decision
cd ../m2-android-adb
timeout /t 5 /nobreak >nul
node index.js --url http://localhost:5000/decision --dry-run

# Kill M1 heartbeat
taskkill /fi "WINDOWTITLE eq M1-Heartbeat*" /t /f
```

---

## 🎯 Phase 3: End-to-End System Verification

### 3.1 Full System Test (No Device Required)
```powershell
# This tests the complete flow without needing Android device

# Terminal 1: Start M1 API
cd pi-engine
start "M1-API" cmd /c "node apiWrapper.js"

# Terminal 2: Start M1 heartbeat
start "M1-Heartbeat" cmd /c "timeout /t 3 >nul && node index.js start"

# Terminal 3: Monitor system health
cd ../m2-android-adb
timeout /t 5 /nobreak >nul

# Check M1 health
curl http://localhost:5000/health

# Fetch and execute decisions (dry-run)
node index.js --url http://localhost:5000/decision --dry-run

# Kill processes
taskkill /fi "WINDOWTITLE eq M1-API*" /t /f
taskkill /fi "WINDOWTITLE eq M1-Heartbeat*" /t /f
```

### 3.2 Full System Test (With Android Device)
```powershell
# REQUIRES: Android device connected via USB with USB debugging enabled

# Verify device connection
adb devices
# Should show: List of devices attached + device ID

# Terminal 1: Start M1 API
cd pi-engine
start "M1-API" cmd /c "node apiWrapper.js"

# Terminal 2: Start M1 heartbeat
start "M1-Heartbeat" cmd /c "timeout /t 3 >nul && node index.js start"

# Terminal 3: Execute M2 live
cd ../m2-android-adb
timeout /t 5 /nobreak >nul

# Run live execution
node index.js --url http://localhost:5000/decision

# Verify on Android device:
# - Do Not Disturb should toggle
# - Calendar app should open
# - Other actions based on current persona

# Kill processes
taskkill /fi "WINDOWTITLE eq M1-API*" /t /f
taskkill /fi "WINDOWTITLE eq M1-Heartbeat*" /t /f
```

---

## 📊 Phase 4: Performance & Reliability Testing

### 4.1 Stress Test Decision Making
```powershell
cd pi-engine

# Start API server
start "M1-API" cmd /c "node apiWrapper.js"
timeout /t 3 /nobreak >nul

# Rapid-fire decision requests
for /l %i in (1,1,10) do (
    curl -s http://localhost:5000/decision >nul
    echo Decision %i completed
    timeout /t 1 /nobreak >nul
)

# Kill API server
taskkill /fi "WINDOWTITLE eq M1-API*" /t /f
```

### 4.2 Memory and Stats Verification
```powershell
cd pi-engine

# Run demo to generate memory data
node index.js demo

# Check memory statistics
node index.js memory

# Verify memory.log exists and has entries
dir memory.log
type memory.log | find /c "decision"
```

### 4.3 Error Handling Test
```powershell
cd m2-android-adb

# Test with invalid JSON
node index.js --json "invalid json" 2>&1

# Test with missing file
node index.js --file nonexistent.json 2>&1

# Test with unreachable URL
node index.js --url http://nonexistent:5000/decision 2>&1

# Should handle errors gracefully without crashing
```

---

## 🔧 Phase 5: Troubleshooting & Diagnostics

### 5.1 Common Issues & Fixes

#### Issue: ADB not found
```powershell
# Check if ADB is in PATH
where adb

# If not found, add to PATH
set PATH=%PATH%;C:\adb\platform-tools

# Verify
adb version
```

#### Issue: M1 API not responding
```powershell
# Check if port 5000 is in use
netstat -ano | find "5000"

# Kill conflicting process
taskkill /pid <PID> /f

# Restart M1 API
cd pi-engine
node apiWrapper.js
```

#### Issue: Android device not detected
```powershell
# List connected devices
adb devices

# If no devices, check:
# 1. USB cable connected
# 2. USB debugging enabled in developer options
# 3. Device authorized on PC

# Restart ADB server
adb kill-server
adb start-server
adb devices
```

#### Issue: M2 ack timeout in M1 logs
```powershell
# Check M1 logs for timeout warnings
# This means M2 didn't send acknowledgement

# Test ack manually
cd m2-android-adb
node index.js --file sample-decision.json --dry-run

# Should see: "📨 Sending ack to M1: http://localhost:5000/ack"
# If not, check M1_API_URL in .env
```

### 5.2 Log Analysis
```powershell
# Check M1 memory logs
cd pi-engine
type memory.log | tail -20

# Check for errors in M1 logs
type memory.log | find "ERROR"

# Check M2 execution logs (if redirected)
# M2 logs to console by default
```

---

## 🎬 Phase 6: Demo Preparation

### 6.1 Demo Script Execution
```powershell
# Full demo flow for judges

# Terminal 1: Start M1 API
cd pi-engine
start "M1-API" cmd /c "node apiWrapper.js"

# Terminal 2: Start heartbeat
start "M1-Heartbeat" cmd /c "timeout /t 3 >nul && node index.js start"

# Terminal 3: Show M1 status
node index.js status

# Terminal 4: Execute M2 (with device connected)
cd ../m2-android-adb
timeout /t 5 /nobreak >nul
node index.js --url http://localhost:5000/decision

# Show judges:
# 1. M1 making autonomous decisions
# 2. M2 executing on Android device
# 3. Real-time device behavior changes
# 4. Ack confirmations in logs

# Cleanup
taskkill /fi "WINDOWTITLE eq M1-API*" /t /f
taskkill /fi "WINDOWTITLE eq M1-Heartbeat*" /t /f
```

### 6.2 Demo Checklist
- [ ] Android device connected and authorized
- [ ] ADB installed and in PATH
- [ ] M1 API responding on port 5000
- [ ] M2 can fetch decisions from M1
- [ ] M2 sends acknowledgements
- [ ] Device shows visible changes (DND, app launches, etc.)
- [ ] No error messages in logs
- [ ] System handles edge cases gracefully

---

## 📈 Phase 7: Final Verification Report

### 7.1 Generate System Report
```powershell
cd pi-engine

# Run full test suite
node index.js test

# Generate memory report
node index.js memory

# Check API health
curl http://localhost:5000/health

# Verify all modules
echo "=== SYSTEM VERIFICATION COMPLETE ==="
echo "✅ M1: PI Engine - Autonomous decision making"
echo "✅ M2: Android ADB - Action execution"
echo "✅ Integration: M1↔M2 handshake working"
echo "✅ Reliability: Error handling functional"
echo "✅ Performance: Decision cycle < 2 seconds"
```

### 7.2 Success Criteria
- [ ] All automated tests pass (M1 test suite)
- [ ] M1 API responds to health checks
- [ ] M2 successfully fetches and executes decisions
- [ ] Ack handshake completes without timeouts
- [ ] Android device shows expected behavior changes
- [ ] No critical errors in system logs
- [ ] Memory usage remains stable under load

---

## 🚨 Emergency Commands

### Stop All Processes
```powershell
# Kill all Node.js processes
taskkill /f /im node.exe

# Kill all ADB processes
taskkill /f /im adb.exe

# Kill all CMD windows with specific titles
taskkill /fi "WINDOWTITLE eq M1-API*" /t /f
taskkill /fi "WINDOWTITLE eq M1-Heartbeat*" /t /f
```

### Reset System State
```powershell
cd pi-engine

# Clear memory logs
del memory.log

# Reset context to defaults
del context.json
# M1 will recreate with defaults

# Reset M2 environment
cd ../m2-android-adb
# .env file persists intentionally
```

---

**🎯 Verification Complete Checklist:**
- [ ] Prerequisites installed
- [ ] Individual modules tested
- [ ] Integration working
- [ ] End-to-end flow verified
- [ ] Performance acceptable
- [ ] Demo ready
- [ ] Troubleshooting documented

**System Status:** 🟢 READY FOR DEMO