"""
Driver Fingerprint API Routes
Endpoints for driver fingerprinting and coaching alerts
"""
import asyncio
import json
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from typing import Optional, Dict, Any
from pydantic import BaseModel

from app.services.driver_fingerprint_service import driver_fingerprint_service
from app.services.coaching_alert_service import coaching_alert_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/drivers", tags=["Driver Fingerprint"])

# WebSocket connections for driver fingerprints
fingerprint_connections: Dict[str, list] = {}


class TelemetryRequest(BaseModel):
    """Request model for telemetry processing"""
    session_id: Optional[str] = None
    brake_events: Optional[list] = []
    throttle_data: Optional[list] = []
    cornering_events: Optional[list] = []
    lap_times: Optional[list] = []
    sector_data: Optional[list] = []
    steering_data: Optional[list] = []
    session_type: Optional[str] = "practice"


@router.post("/{driver_id}/process")
async def process_telemetry(driver_id: str, request: TelemetryRequest):
    """
    Process telemetry data and generate driver fingerprint with coaching alerts
    
    Args:
        driver_id: Driver identifier
        request: Telemetry data
        
    Returns:
        Fingerprint, comparison, alerts, and coaching plan
    """
    try:
        # Convert request to dict
        telemetry_data = request.dict()
        
        # Extract features from telemetry
        features = driver_fingerprint_service.extract_features(driver_id, telemetry_data)
        
        # Store fingerprint
        fingerprint = await driver_fingerprint_service.store_fingerprint(driver_id, features)
        fingerprint["features"] = features
        
        # Compare with baseline
        comparison = await driver_fingerprint_service.compare_with_baseline(driver_id, features)
        
        # Generate coaching alerts
        alerts = coaching_alert_service.generate_coaching_alerts(fingerprint, comparison)
        
        # Generate coaching plan
        coaching_plan = coaching_alert_service.generate_coaching_plan(driver_id, alerts, fingerprint)
        
        # Broadcast update via WebSocket
        try:
            await broadcast_fingerprint_update(driver_id, fingerprint, alerts)
        except Exception as e:
            logger.warning(f"Failed to broadcast fingerprint update: {e}")
        
        return {
            "success": True,
            "fingerprint": fingerprint,
            "comparison": comparison,
            "alerts": alerts,
            "coaching_plan": coaching_plan
        }
    
    except Exception as error:
        logger.error(f"Error processing driver fingerprint: {error}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/{driver_id}/fingerprint")
async def get_fingerprint(driver_id: str):
    """
    Get driver's current fingerprint
    
    Args:
        driver_id: Driver identifier
        
    Returns:
        Current fingerprint data
    """
    try:
        fingerprint = await driver_fingerprint_service.get_current_fingerprint(driver_id)
        
        if not fingerprint:
            raise HTTPException(
                status_code=404,
                detail=f"No fingerprint found for driver {driver_id}"
            )
        
        return {"success": True, "fingerprint": fingerprint}
    
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error getting fingerprint: {error}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/{driver_id}/alerts")
async def get_alerts(driver_id: str):
    """
    Get coaching alerts for driver
    
    Args:
        driver_id: Driver identifier
        
    Returns:
        List of coaching alerts
    """
    try:
        fingerprint = await driver_fingerprint_service.get_current_fingerprint(driver_id)
        
        if not fingerprint:
            return {"success": True, "alerts": []}
        
        # Compare with baseline
        features = fingerprint.get("features", {})
        if isinstance(features, str):
            import json
            features = json.loads(features)
        
        comparison = await driver_fingerprint_service.compare_with_baseline(driver_id, features)
        
        # Generate alerts
        alerts = coaching_alert_service.generate_coaching_alerts(fingerprint, comparison)
        
        return {"success": True, "alerts": alerts}
    
    except Exception as error:
        logger.error(f"Error getting alerts: {error}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/{driver_id}/coaching-plan")
async def get_coaching_plan(driver_id: str):
    """
    Get personalized coaching plan for driver
    
    Args:
        driver_id: Driver identifier
        
    Returns:
        Coaching plan
    """
    try:
        fingerprint = await driver_fingerprint_service.get_current_fingerprint(driver_id)
        
        if not fingerprint:
            raise HTTPException(
                status_code=404,
                detail=f"No fingerprint found for driver {driver_id}"
            )
        
        # Get features
        features = fingerprint.get("features", {})
        if isinstance(features, str):
            import json
            features = json.loads(features)
        
        # Compare with baseline
        comparison = await driver_fingerprint_service.compare_with_baseline(driver_id, features)
        
        # Generate alerts
        alerts = coaching_alert_service.generate_coaching_alerts(fingerprint, comparison)
        
        # Generate coaching plan
        coaching_plan = coaching_alert_service.generate_coaching_plan(driver_id, alerts, fingerprint)
        
        return {"success": True, "coaching_plan": coaching_plan}
    
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error getting coaching plan: {error}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/{driver_id}/compare/{baseline_driver_id}")
async def compare_drivers(driver_id: str, baseline_driver_id: str):
    """
    Compare driver fingerprint with another driver (e.g., teammate)
    
    Args:
        driver_id: Current driver identifier
        baseline_driver_id: Baseline driver identifier for comparison
        
    Returns:
        Comparison results
    """
    try:
        current_fingerprint = await driver_fingerprint_service.get_current_fingerprint(driver_id)
        baseline_fingerprint = await driver_fingerprint_service.get_current_fingerprint(baseline_driver_id)
        
        if not current_fingerprint or not baseline_fingerprint:
            raise HTTPException(
                status_code=404,
                detail="Fingerprints not found for comparison"
            )
        
        # Get features
        current_features = current_fingerprint.get("features", {})
        baseline_features = baseline_fingerprint.get("features", {})
        
        if isinstance(current_features, str):
            import json
            current_features = json.loads(current_features)
        if isinstance(baseline_features, str):
            import json
            baseline_features = json.loads(baseline_features)
        
        # Calculate differences
        current_score = current_features.get("overall_score", 0.5)
        baseline_score = baseline_features.get("overall_score", 0.5)
        
        # Find key differences
        key_differences = []
        for feature_name in ["braking_consistency", "throttle_smoothness", "cornering_style", 
                           "lap_consistency", "tire_stress_index"]:
            current_value = current_features.get(feature_name, 0.5)
            baseline_value = baseline_features.get(feature_name, 0.5)
            diff = current_value - baseline_value
            
            if abs(diff) > 0.1:  # Significant difference
                key_differences.append({
                    "feature": feature_name,
                    "driver_value": current_value,
                    "baseline_value": baseline_value,
                    "difference": diff,
                    "advantage": "driver" if diff > 0 else "baseline"
                })
        
        comparison = {
            "driver_score": current_score,
            "baseline_score": baseline_score,
            "score_difference": current_score - baseline_score,
            "key_differences": sorted(key_differences, key=lambda x: abs(x["difference"]), reverse=True)
        }
        
        return {"success": True, "comparison": comparison}
    
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Error comparing drivers: {error}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(error))


@router.websocket("/{driver_id}/fingerprint/ws")
async def ws_fingerprint(websocket: WebSocket, driver_id: str):
    """
    WebSocket endpoint for real-time driver fingerprint updates
    
    Sends fingerprint updates and coaching alerts as they are generated
    """
    await websocket.accept()
    
    if driver_id not in fingerprint_connections:
        fingerprint_connections[driver_id] = []
    fingerprint_connections[driver_id].append(websocket)
    
    logger.info(f"Driver fingerprint WebSocket connected: {driver_id}")
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "driver_id": driver_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages (with timeout to allow periodic updates)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Handle incoming messages if needed
                message = json.loads(data)
                logger.debug(f"Received message from {driver_id}: {message}")
            except asyncio.TimeoutError:
                # Send periodic heartbeat
                await websocket.send_json({
                    "type": "heartbeat",
                    "driver_id": driver_id
                })
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON"
                })
    
    except WebSocketDisconnect:
        logger.info(f"Driver fingerprint WebSocket disconnected: {driver_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {driver_id}: {e}", exc_info=True)
    finally:
        if driver_id in fingerprint_connections:
            fingerprint_connections[driver_id].remove(websocket)
            if not fingerprint_connections[driver_id]:
                del fingerprint_connections[driver_id]


async def broadcast_fingerprint_update(driver_id: str, fingerprint: Dict, alerts: list = None):
    """
    Broadcast fingerprint update to all connected clients for a driver
    
    This function should be called when a new fingerprint is generated
    """
    if driver_id not in fingerprint_connections:
        return
    
    message = {
        "type": "fingerprint_update",
        "driver_id": driver_id,
        "fingerprint": fingerprint,
        "alerts": alerts or [],
        "timestamp": datetime.utcnow().isoformat()
    }
    
    disconnected = []
    for ws in fingerprint_connections[driver_id]:
        try:
            await ws.send_json(message)
        except Exception as e:
            logger.warning(f"Error sending fingerprint update: {e}")
            disconnected.append(ws)
    
    # Remove disconnected clients
    for ws in disconnected:
        fingerprint_connections[driver_id].remove(ws)
    
    if not fingerprint_connections[driver_id]:
        del fingerprint_connections[driver_id]


async def broadcast_coaching_alert(driver_id: str, alert: Dict):
    """
    Broadcast a coaching alert to all connected clients for a driver
    """
    if driver_id not in fingerprint_connections:
        return
    
    message = {
        "type": "coaching_alert",
        "driver_id": driver_id,
        "alert": alert,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    disconnected = []
    for ws in fingerprint_connections[driver_id]:
        try:
            await ws.send_json(message)
        except Exception as e:
            logger.warning(f"Error sending coaching alert: {e}")
            disconnected.append(ws)
    
    # Remove disconnected clients
    for ws in disconnected:
        fingerprint_connections[driver_id].remove(ws)
    
    if not fingerprint_connections[driver_id]:
        del fingerprint_connections[driver_id]

