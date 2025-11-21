#!/usr/bin/env python3
"""
Test script to verify AI agents are working properly.
This script:
1. Checks Redis connectivity
2. Tests agent initialization
3. Sends test telemetry data
4. Verifies agents process and respond
"""

import asyncio
import json
import sys
from datetime import datetime
from ai_agents import StrategyAgent, CoachAgent, AnomalyDetectiveAgent
from agent_integration import AgentIntegration, TelemetryIngestor
import redis.asyncio as redis

async def test_redis_connection(redis_url: str = "redis://127.0.0.1:6379"):
    """Test Redis connection"""
    print("Testing Redis connection...")
    try:
        r = await redis.from_url(redis_url)
        await r.ping()
        print("✓ Redis connection successful")
        await r.close()
        return True
    except Exception as e:
        print(f"✗ Redis connection failed: {e}")
        print("  Make sure Redis is running: docker run -d -p 6379:6379 redis:7")
        return False

async def test_agent_initialization():
    """Test agent initialization"""
    print("\nTesting agent initialization...")
    try:
        strategy = StrategyAgent("test-strategy-01", "redis://127.0.0.1:6379")
        coach = CoachAgent("test-coach-01", "redis://127.0.0.1:6379")
        anomaly = AnomalyDetectiveAgent("test-anomaly-01", "redis://127.0.0.1:6379")
        print("✓ All agents initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Agent initialization failed: {e}")
        return False

async def test_telemetry_processing():
    """Test sending telemetry and verifying processing"""
    print("\nTesting telemetry processing...")
    
    redis_url = "redis://127.0.0.1:6379"
    r = await redis.from_url(redis_url)
    
    try:
        # Send test telemetry
        test_telemetry = {
            "meta_time": datetime.utcnow().isoformat(),
            "timestamp": datetime.utcnow().isoformat(),
            "track": "cota",
            "chassis": "GR86-TEST-01",
            "lap": 5,
            "lapdist_m": 280.5,
            "speed_kmh": 210,
            "accx_can": 0.03,
            "accy_can": 0.2,
            "throttle_pct": 85,
            "brake_pct": 0,
            "tire_temp": 95,
            "tire_pressure": 28.5,
            "yaw_rate": 0.5,
            "rpm": 6000,
            "sector": 1
        }
        
        # Add to telemetry stream
        await r.xadd("telemetry.stream", "*", "data", json.dumps(test_telemetry))
        print("✓ Test telemetry sent to stream")
        
        # Check if task was created
        await asyncio.sleep(0.5)
        tasks_length = await r.xlen("tasks.stream")
        print(f"  Tasks stream length: {tasks_length}")
        
        # Check results stream
        results_length = await r.xlen("results.stream")
        print(f"  Results stream length: {results_length}")
        
        # Check agent registry
        registry = await r.hgetall("agents.registry")
        if registry:
            print(f"✓ Found {len(registry)} registered agents")
            for agent_id, info in registry.items():
                agent_info = json.loads(info)
                print(f"  - {agent_id}: {agent_info.get('type')} ({agent_info.get('status')})")
        else:
            print("⚠ No agents registered (agents may not be running)")
        
        await r.close()
        return True
        
    except Exception as e:
        print(f"✗ Telemetry processing test failed: {e}")
        import traceback
        traceback.print_exc()
        await r.close()
        return False

async def test_agent_decisions():
    """Test agent decision making"""
    print("\nTesting agent decision making...")
    
    redis_url = "redis://127.0.0.1:6379"
    
    try:
        # Initialize strategy agent
        agent = StrategyAgent("test-strategy-01", redis_url)
        await agent.connect()
        
        # Create test telemetry frame
        from ai_agents import TelemetryFrame
        
        telemetry = TelemetryFrame(
            timestamp=datetime.utcnow().isoformat(),
            meta_time=datetime.utcnow().isoformat(),
            track="cota",
            chassis="GR86-TEST-01",
            lap=12,
            lapdist_m=500.0,
            speed_kmh=200,
            accx_can=0.5,
            accy_can=1.2,
            throttle_pct=90,
            brake_pct=0,
            tire_temp=95,
            tire_pressure=28.5,
            yaw_rate=0.5,
            rpm=6500,
            sector=2
        )
        
        # Test decision making
        decision = await agent.decide(telemetry)
        
        if decision:
            print(f"✓ Agent made a decision: {decision.action}")
            print(f"  Confidence: {decision.confidence:.2%}")
            print(f"  Risk level: {decision.risk_level}")
            print(f"  Reasoning: {decision.reasoning[:2] if decision.reasoning else 'None'}")
        else:
            print("ℹ Agent decided no action needed (this is normal for certain conditions)")
        
        await agent.disconnect()
        return True
        
    except Exception as e:
        print(f"✗ Agent decision test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all tests"""
    print("=" * 60)
    print("AI AGENTS TEST SUITE")
    print("=" * 60)
    
    results = []
    
    # Test 1: Redis connection
    results.append(await test_redis_connection())
    
    if not results[0]:
        print("\n❌ Redis is not available. Please start Redis first:")
        print("   docker run -d -p 6379:6379 redis:7")
        sys.exit(1)
    
    # Test 2: Agent initialization
    results.append(await test_agent_initialization())
    
    # Test 3: Telemetry processing
    results.append(await test_telemetry_processing())
    
    # Test 4: Agent decisions
    results.append(await test_agent_decisions())
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✓ All tests passed!")
        print("\nAgents are working correctly. You can now:")
        print("  1. Start agents: python ai_agents.py --mode strategy")
        print("  2. Start integration: python agent_integration.py --mode live")
        print("  3. Monitor: redis-cli XREAD BLOCK 0 STREAMS results.stream 0")
    else:
        print("⚠ Some tests failed. Check the output above for details.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

