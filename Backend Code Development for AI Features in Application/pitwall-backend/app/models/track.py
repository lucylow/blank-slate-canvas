"""
Track and race data models
"""
from pydantic import BaseModel
from typing import List, Optional


class Track(BaseModel):
    """Track information"""
    id: str
    name: str
    location: str
    length_miles: float
    turns: int
    available_races: List[int] = []


class TrackList(BaseModel):
    """List of all tracks"""
    tracks: List[Track]


class RaceInfo(BaseModel):
    """Race information"""
    track: str
    race_number: int
    vehicles: List[int]
    total_laps: int
    date: Optional[str] = None
