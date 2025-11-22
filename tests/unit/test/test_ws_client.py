#!/usr/bin/env python3
"""
WebSocket client for testing anomaly detection
Usage: python test/test_ws_client.py --ws ws://localhost:8000/ws/telemetry/GR86-001
"""
import argparse
import asyncio
import json
import websockets
from datetime import datetime
import random

async def test_websocket(uri: str, vehicle_id: str, num_messages: int = 10):
    """Test WebSocket connection and send sample telemetry"""
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"✓ Connected to {uri}")
            print(f"Sending {num_messages} telemetry frames...\n")
            
            for i in range(num_messages):
                # Generate sample telemetry frame
                frame = {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "telemetry_name": random.choice(["speed", "brake_pressure", "accx_can", "accy_can", "tire_temp"]),
                    "telemetry_value": random.uniform(0, 150),
                    "vehicle_id": vehicle_id,
                    "vehicle_number": int(vehicle_id.split("-")[-1]) if "-" in vehicle_id else 1
                }
                
                # Send frame
                await websocket.send(json.dumps(frame))
                print(f"[{i+1}] Sent: {frame['telemetry_name']} = {frame['telemetry_value']:.2f}")
                
                # Wait for response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(response)
                    print(f"     Received: {data}")
                    
                    # Check for anomaly alert
                    if "alert" in data or "anomaly" in str(data).lower():
                        print(f"     ⚠️  ANOMALY DETECTED!")
                        print(f"     {json.dumps(data, indent=2)}")
                    
                except asyncio.TimeoutError:
                    print(f"     (no response)")
                
                await asyncio.sleep(0.5)
            
            print("\n✓ Test complete")
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    
    return True

def main():
    parser = argparse.ArgumentParser(description="Test WebSocket telemetry endpoint")
    parser.add_argument("--ws", type=str, default="ws://localhost:8000/ws/telemetry/GR86-001",
                       help="WebSocket URL")
    parser.add_argument("--vehicle", type=str, default="GR86-001",
                       help="Vehicle ID")
    parser.add_argument("--messages", type=int, default=10,
                       help="Number of messages to send")
    args = parser.parse_args()
    
    # Extract vehicle ID from URL if present
    if "/" in args.ws:
        parts = args.ws.split("/")
        if len(parts) > 0:
            vehicle_id = parts[-1]
        else:
            vehicle_id = args.vehicle
    else:
        vehicle_id = args.vehicle
    
    print("=" * 60)
    print("WebSocket Telemetry Test Client")
    print("=" * 60)
    print(f"URL: {args.ws}")
    print(f"Vehicle: {vehicle_id}")
    print(f"Messages: {args.messages}")
    print("=" * 60)
    print()
    
    asyncio.run(test_websocket(args.ws, vehicle_id, args.messages))

if __name__ == "__main__":
    main()


