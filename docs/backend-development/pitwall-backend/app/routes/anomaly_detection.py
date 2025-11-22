"""
Anomaly Detection Routes - Real-time telemetry anomaly detection
"""
from fastapi import APIRouter, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from typing import Optional, Dict, List
import json
import logging
import asyncio
from datetime import datetime

from app.models.anomaly import (
    AnomalyDetectionResult,
    AnomalyDetectionRequest,
    BatchAnomalyDetectionRequest,
    AnomalyStats
)
from app.services.anomaly_detector import anomaly_detector
from app.data.data_loader import data_loader
import pandas as pd

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/anomaly", tags=["Anomaly Detection"])


# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time anomaly alerts"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, vehicle_id: str):
        """Connect a WebSocket client"""
        await websocket.accept()
        if vehicle_id not in self.active_connections:
            self.active_connections[vehicle_id] = []
        self.active_connections[vehicle_id].append(websocket)
        logger.info(f"WebSocket connected for vehicle {vehicle_id}. Total connections: {len(self.active_connections[vehicle_id])}")
    
    def disconnect(self, websocket: WebSocket, vehicle_id: str):
        """Disconnect a WebSocket client"""
        if vehicle_id in self.active_connections:
            self.active_connections[vehicle_id].remove(websocket)
            if not self.active_connections[vehicle_id]:
                del self.active_connections[vehicle_id]
        logger.info(f"WebSocket disconnected for vehicle {vehicle_id}")
    
    async def broadcast(self, vehicle_id: str, message: dict):
        """Broadcast anomaly alert to all connected clients for a vehicle"""
        if vehicle_id not in self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections[vehicle_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to WebSocket: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn, vehicle_id)


connection_manager = ConnectionManager()


@router.post("/detect", response_model=AnomalyDetectionResult)
async def detect_anomaly(request: AnomalyDetectionRequest):
    """
    Detect anomalies in a single telemetry point
    
    This endpoint analyzes a single telemetry data point and returns
    anomaly detection results including ML-based detection and rule-based alerts.
    """
    try:
        result = anomaly_detector.detect(
            vehicle_id=request.vehicle_id,
            telemetry_point=request.telemetry_point
        )
        
        # Broadcast to WebSocket clients if anomaly detected
        if result['is_anomaly']:
            await connection_manager.broadcast(request.vehicle_id, {
                'type': 'anomaly_alert',
                'data': result
            })
        
        return AnomalyDetectionResult(**result)
    
    except Exception as e:
        logger.error(f"Error detecting anomaly: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect/batch")
async def detect_anomalies_batch(request: BatchAnomalyDetectionRequest):
    """
    Detect anomalies in a batch of telemetry data
    
    Loads telemetry data for specified track/race/laps and performs
    batch anomaly detection. Useful for analyzing historical data.
    """
    try:
        # Load telemetry data
        telemetry_df = data_loader.load_telemetry(
            request.track,
            request.race,
            request.lap_start or 1,
            request.lap_end,
            None  # All vehicles
        )
        
        if telemetry_df is None or telemetry_df.empty:
            raise HTTPException(status_code=404, detail="Telemetry data not found")
        
        # Filter by vehicle if needed
        if 'vehicle_number' in telemetry_df.columns:
            # Get vehicle_id from first row
            vehicle_id = request.vehicle_id
        else:
            vehicle_id = request.vehicle_id
        
        # Perform batch detection
        result_df = anomaly_detector.detect_batch(
            vehicle_id=vehicle_id,
            telemetry_df=telemetry_df,
            retrain=request.retrain
        )
        
        # Calculate statistics
        total_points = len(result_df)
        anomaly_count = result_df['is_anomaly'].sum()
        anomaly_rate = (anomaly_count / total_points * 100) if total_points > 0 else 0.0
        avg_score = result_df['anomaly_score'].mean() if 'anomaly_score' in result_df.columns else 0.0
        
        # Convert to records for JSON response
        results = result_df.to_dict('records')
        
        return {
            "success": True,
            "stats": {
                "total_points": total_points,
                "anomaly_count": int(anomaly_count),
                "anomaly_rate": float(anomaly_rate),
                "avg_anomaly_score": float(avg_score)
            },
            "results": results[:1000],  # Limit to first 1000 for response size
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_anomaly_stats(
    track: str = Query(..., description="Track identifier"),
    race: int = Query(..., description="Race number"),
    vehicle: Optional[int] = Query(None, description="Vehicle number (optional)"),
    lap_start: Optional[int] = Query(None, description="Starting lap"),
    lap_end: Optional[int] = Query(None, description="Ending lap")
):
    """
    Get anomaly statistics for a race or vehicle
    
    Returns summary statistics about anomalies detected in the specified data range.
    """
    try:
        # Load telemetry data
        telemetry_df = data_loader.load_telemetry(
            track, race, lap_start or 1, lap_end, vehicle
        )
        
        if telemetry_df is None or telemetry_df.empty:
            raise HTTPException(status_code=404, detail="Telemetry data not found")
        
        # Get vehicle_id
        if vehicle:
            vehicle_id = f"vehicle_{vehicle}"
        else:
            # Use first vehicle in data
            if 'vehicle_number' in telemetry_df.columns:
                first_vehicle = telemetry_df['vehicle_number'].iloc[0]
                vehicle_id = f"vehicle_{first_vehicle}"
            else:
                vehicle_id = "vehicle_unknown"
        
        # Perform batch detection
        result_df = anomaly_detector.detect_batch(
            vehicle_id=vehicle_id,
            telemetry_df=telemetry_df,
            retrain=True
        )
        
        # Calculate statistics
        total_points = len(result_df)
        anomaly_count = result_df['is_anomaly'].sum()
        anomaly_rate = (anomaly_count / total_points * 100) if total_points > 0 else 0.0
        avg_score = result_df['anomaly_score'].mean() if 'anomaly_score' in result_df.columns else 0.0
        
        # Count alert types (simplified - would need to parse alerts column)
        critical_alerts = 0
        roc_alerts = 0
        ml_alerts = anomaly_count  # Approximate
        
        # Get top anomalous sensors (if we have sensor data)
        top_sensors = []
        if 'alert_count' in result_df.columns:
            # This is simplified - in production, parse actual alerts
            pass
        
        stats = AnomalyStats(
            total_points=total_points,
            anomaly_count=int(anomaly_count),
            anomaly_rate=float(anomaly_rate),
            critical_alerts=critical_alerts,
            rate_of_change_alerts=roc_alerts,
            ml_detected_anomalies=int(ml_alerts),
            avg_anomaly_score=float(avg_score),
            top_anomalous_sensors=top_sensors
        )
        
        return {
            "success": True,
            "data": stats.dict(),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting anomaly stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{vehicle_id}")
async def websocket_anomaly_stream(websocket: WebSocket, vehicle_id: str):
    """
    WebSocket endpoint for real-time anomaly alerts
    
    Clients connect to receive real-time anomaly detection alerts as telemetry
    data is processed. Alerts are pushed immediately when anomalies are detected.
    
    Frontend usage:
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/api/anomaly/ws/vehicle_7');
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'anomaly_alert') {
            console.log('Anomaly detected:', data.data);
        }
    };
    ```
    """
    await connection_manager.connect(websocket, vehicle_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "vehicle_id": vehicle_id,
            "message": "Connected to anomaly detection stream",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep connection alive and handle incoming messages
        while True:
            # Wait for messages from client (ping/pong for keepalive)
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Handle ping/pong or other client messages
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                # Send keepalive
                await websocket.send_json({
                    "type": "keepalive",
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, vehicle_id)
        logger.info(f"WebSocket disconnected for vehicle {vehicle_id}")
    except Exception as e:
        logger.error(f"WebSocket error for vehicle {vehicle_id}: {e}")
        connection_manager.disconnect(websocket, vehicle_id)


@router.get("/health")
async def anomaly_detection_health():
    """Health check for anomaly detection service"""
    try:
        # Check if PyOD is available
        from app.services.anomaly_detector import PYOD_AVAILABLE
        
        return {
            "status": "healthy" if PYOD_AVAILABLE else "degraded",
            "pyod_available": PYOD_AVAILABLE,
            "active_connections": sum(len(conns) for conns in connection_manager.active_connections.values()),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


