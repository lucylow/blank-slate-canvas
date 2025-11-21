#!/usr/bin/env python3
"""
Quick Test Script - Check prerequisites and run a simple test
"""

import asyncio
import sys
import subprocess

async def check_redis(redis_url: str = "redis://127.0.0.1:6379"):
    """Check if Redis is accessible"""
    try:
        import redis.asyncio as redis
        r = await redis.from_url(redis_url)
        await r.ping()
        await r.close()
        return True
    except Exception as e:
        print(f"❌ Redis not accessible: {e}")
        print("\nStart Redis with:")
        print("  docker run -d --name pitwall-redis -p 6379:6379 redis:7")
        print("  OR")
        print("  redis-server")
        return False

def check_agents_running():
    """Check if agent processes are running"""
    try:
        result = subprocess.run(
            ["pgrep", "-f", "ai_agents.py"],
            capture_output=True,
            text=True
        )
        count = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0
        return count
    except:
        return 0

async def send_test_telemetry():
    """Send a single test telemetry sample"""
    try:
        import redis.asyncio as redis
        import json
        from datetime import datetime
        
        r = await redis.from_url("redis://127.0.0.1:6379")
        
        test_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "meta_time": datetime.utcnow().isoformat(),
            "track": "cota",
            "chassis": "GR86-01",
            "lap": 10,
            "lapdist_m": 500.0,
            "speed_kmh": 200,
            "accx_can": 0.1,
            "accy_can": 0.8,
            "throttle_pct": 75,
            "brake_pct": 20,
            "tire_temp": 95,
            "tire_pressure": 28.5,
            "yaw_rate": 0.3,
            "rpm": 6000,
            "sector": 2
        }
        
        await r.xadd("telemetry.stream", "*", "data", json.dumps(test_data))
        await r.close()
        return True
    except Exception as e:
        print(f"❌ Error sending test telemetry: {e}")
        return False

async def main():
    print("="*60)
    print("AI AGENTS - QUICK PREREQUISITE CHECK")
    print("="*60)
    print()
    
    # Check Redis
    print("1. Checking Redis...")
    redis_ok = await check_redis()
    if redis_ok:
        print("   ✓ Redis is accessible")
    else:
        print("   ❌ Redis is not accessible")
        sys.exit(1)
    
    # Check agents
    print("\n2. Checking agent processes...")
    agent_count = check_agents_running()
    if agent_count > 0:
        print(f"   ✓ Found {agent_count} agent process(es) running")
    else:
        print("   ⚠️  No agent processes detected")
        print("   Start agents in separate terminals:")
        print("     python ai_agents.py --mode strategy")
        print("     python ai_agents.py --mode coach")
        print("     python ai_agents.py --mode anomaly")
        print("     python agent_integration.py --mode live")
    
    # Test telemetry send
    print("\n3. Testing telemetry send...")
    if await send_test_telemetry():
        print("   ✓ Test telemetry sent successfully")
    else:
        print("   ❌ Failed to send test telemetry")
        sys.exit(1)
    
    print("\n" + "="*60)
    print("✓ All checks passed!")
    print("="*60)
    print("\nYou can now run the full test:")
    print("  python test_agents_on_maps.py")
    print()

if __name__ == "__main__":
    asyncio.run(main())

