"""
F1 Benchmarking API Routes
Compare GR Cup strategies with F1 historical data
Free APIs: Ergast, OpenF1, F1API.dev (no API keys required)
"""
import logging
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict
from datetime import date, datetime

from app.services.ergast_service import ergast_service
from app.services.openf1_service import openf1_service
from app.services.f1api_service import f1api_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/f1", tags=["F1 Benchmarking"])


@router.get("/seasons/current")
async def get_current_season():
    """Get current F1 season race calendar"""
    try:
        races = await ergast_service.get_current_season_races()
        return {
            "success": True,
            "source": "Ergast F1 API",
            "data": races,
            "count": len(races)
        }
    except Exception as e:
        logger.error(f"Error fetching current season: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/seasons/{year}")
async def get_season(year: int):
    """Get all races for a specific F1 season"""
    try:
        races = await ergast_service.get_season_races(year)
        return {
            "success": True,
            "source": "Ergast F1 API",
            "year": year,
            "data": races,
            "count": len(races)
        }
    except Exception as e:
        logger.error(f"Error fetching season {year}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/races/{year}/{round}")
async def get_race(
    year: int,
    round: int,
    include_qualifying: bool = False,
    include_laps: bool = False,
    include_pitstops: bool = False
):
    """Get comprehensive race data for strategy comparison"""
    try:
        # Get race results
        race_results = await ergast_service.get_race_results(year, round)
        
        if not race_results:
            raise HTTPException(status_code=404, detail=f"Race {year}/{round} not found")
        
        response_data = {
            "success": True,
            "source": "Ergast F1 API",
            "year": year,
            "round": round,
            "race": race_results
        }
        
        # Optionally include additional data
        if include_qualifying:
            qualifying = await ergast_service.get_qualifying_results(year, round)
            response_data["qualifying"] = qualifying
        
        if include_laps:
            lap_times = await ergast_service.get_lap_times(year, round)
            response_data["lap_times"] = lap_times
        
        if include_pitstops:
            pit_stops = await ergast_service.get_pit_stops(year, round)
            response_data["pit_stops"] = pit_stops
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching race {year}/{round}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/strategies/comparison")
async def compare_strategies(
    year: int = Query(..., description="F1 season year"),
    round: int = Query(..., description="Race round number"),
    comparison_type: str = Query("pit_stops", description="Type: pit_stops, lap_times, tire_deg")
):
    """
    Get F1 race data for strategy comparison with GR Cup
    Useful for benchmarking pit stop strategies, tire degradation patterns
    """
    try:
        if comparison_type == "pit_stops":
            pit_stops = await ergast_service.get_pit_stops(year, round)
            race_results = await ergast_service.get_race_results(year, round)
            return {
                "success": True,
                "comparison_type": "pit_stops",
                "source": "Ergast F1 API",
                "race": race_results,
                "pit_stops": pit_stops,
                "use_case": "strategy_benchmarking"
            }
        
        elif comparison_type == "lap_times":
            lap_times = await ergast_service.get_lap_times(year, round)
            race_results = await ergast_service.get_race_results(year, round)
            return {
                "success": True,
                "comparison_type": "lap_times",
                "source": "Ergast F1 API",
                "race": race_results,
                "lap_times": lap_times,
                "use_case": "tire_degradation_analysis"
            }
        
        elif comparison_type == "tire_deg":
            lap_times = await ergast_service.get_lap_times(year, round)
            pit_stops = await ergast_service.get_pit_stops(year, round)
            race_results = await ergast_service.get_race_results(year, round)
            return {
                "success": True,
                "comparison_type": "tire_degradation",
                "source": "Ergast F1 API",
                "race": race_results,
                "lap_times": lap_times,
                "pit_stops": pit_stops,
                "use_case": "tire_degradation_pattern_analysis"
            }
        
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid comparison_type: {comparison_type}. Must be pit_stops, lap_times, or tire_deg"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in strategy comparison: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/standings/drivers")
async def get_driver_standings(year: Optional[int] = None):
    """Get F1 driver championship standings"""
    try:
        standings = await ergast_service.get_driver_standings(year)
        return {
            "success": True,
            "source": "Ergast F1 API",
            "year": year or "current",
            "data": standings,
            "count": len(standings)
        }
    except Exception as e:
        logger.error(f"Error fetching driver standings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/standings/constructors")
async def get_constructor_standings(year: Optional[int] = None):
    """Get F1 constructor championship standings"""
    try:
        standings = await ergast_service.get_constructor_standings(year)
        return {
            "success": True,
            "source": "Ergast F1 API",
            "year": year or "current",
            "data": standings,
            "count": len(standings)
        }
    except Exception as e:
        logger.error(f"Error fetching constructor standings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/circuits")
async def get_circuits():
    """Get all F1 circuits for track comparison"""
    try:
        circuits = await ergast_service.get_all_circuits()
        return {
            "success": True,
            "source": "Ergast F1 API",
            "data": circuits,
            "count": len(circuits)
        }
    except Exception as e:
        logger.error(f"Error fetching circuits: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/circuits/{circuit_id}")
async def get_circuit_info(circuit_id: str):
    """Get detailed circuit information"""
    try:
        circuit = await ergast_service.get_circuit_info(circuit_id)
        if not circuit:
            raise HTTPException(status_code=404, detail=f"Circuit {circuit_id} not found")
        
        return {
            "success": True,
            "source": "Ergast F1 API",
            "circuit_id": circuit_id,
            "data": circuit
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching circuit {circuit_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# OpenF1 API endpoints
@router.get("/telemetry/sessions")
async def get_openf1_sessions(
    date_filter: Optional[date] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    location: Optional[str] = Query(None, description="Filter by circuit location")
):
    """Get F1 sessions from OpenF1 API (for telemetry analysis)"""
    try:
        if date_filter:
            sessions = await openf1_service.get_sessions_by_date(date_filter)
        elif location:
            sessions = await openf1_service.get_sessions_by_location(location)
        else:
            raise HTTPException(
                status_code=400, 
                detail="Must provide either date_filter or location parameter"
            )
        
        return {
            "success": True,
            "source": "OpenF1 API",
            "data": sessions,
            "count": len(sessions)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching OpenF1 sessions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/telemetry/laps/{session_key}")
async def get_telemetry_laps(
    session_key: int,
    driver_number: Optional[int] = None,
    lap_number: Optional[int] = None
):
    """Get lap time telemetry from OpenF1"""
    try:
        laps = await openf1_service.get_lap_times(session_key, driver_number, lap_number)
        return {
            "success": True,
            "source": "OpenF1 API",
            "session_key": session_key,
            "data": laps,
            "count": len(laps)
        }
    except Exception as e:
        logger.error(f"Error fetching telemetry laps: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/telemetry/car_data/{session_key}")
async def get_car_telemetry(
    session_key: int,
    driver_number: Optional[int] = None
):
    """Get car telemetry data (speed, throttle, brake, gear) from OpenF1"""
    try:
        telemetry = await openf1_service.get_car_telemetry(session_key, driver_number)
        return {
            "success": True,
            "source": "OpenF1 API",
            "session_key": session_key,
            "driver_number": driver_number,
            "data": telemetry,
            "count": len(telemetry)
        }
    except Exception as e:
        logger.error(f"Error fetching car telemetry: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/telemetry/stints/{session_key}")
async def get_stints(
    session_key: int,
    driver_number: Optional[int] = None
):
    """Get stint data (tire compounds, pit stops) from OpenF1"""
    try:
        stints = await openf1_service.get_stints(session_key, driver_number)
        return {
            "success": True,
            "source": "OpenF1 API",
            "session_key": session_key,
            "data": stints,
            "count": len(stints)
        }
    except Exception as e:
        logger.error(f"Error fetching stints: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# F1API.dev endpoints (alternative source)
@router.get("/alternative/drivers")
async def get_f1api_drivers():
    """Get F1 drivers from f1api.dev (alternative source)"""
    try:
        drivers = await f1api_service.get_drivers()
        return {
            "success": True,
            "source": "F1API.dev",
            "data": drivers,
            "count": len(drivers)
        }
    except Exception as e:
        logger.error(f"Error fetching drivers from f1api.dev: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alternative/races/{year}")
async def get_f1api_races(year: int):
    """Get F1 races from f1api.dev (alternative source)"""
    try:
        races = await f1api_service.get_season_races(year)
        return {
            "success": True,
            "source": "F1API.dev",
            "year": year,
            "data": races,
            "count": len(races)
        }
    except Exception as e:
        logger.error(f"Error fetching races from f1api.dev: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

