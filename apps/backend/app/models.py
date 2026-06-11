from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


Degree = Literal["I", "IV", "V"]
BluesFlavor = Literal["minor", "major"]


class Bend(BaseModel):
    toMidi: int = Field(ge=45, le=84)
    start: float = Field(ge=0, le=4)
    end: float = Field(ge=0, le=4)


class Vibrato(BaseModel):
    depthSemitones: float = Field(ge=0, le=0.5)
    rateHz: float = Field(ge=3, le=9)
    start: float = Field(ge=0, le=4)


class LickNote(BaseModel):
    midi: int = Field(ge=45, le=84)
    noteName: str
    start: float = Field(ge=0, lt=4)
    duration: float = Field(gt=0, le=4)
    velocity: float = Field(ge=0, le=1)
    bend: Optional[Bend] = None
    vibrato: Optional[Vibrato] = None
    technique: Literal[
        "normal",
        "bend",
        "slide",
        "hammer_on",
        "pull_off",
        "vibrato",
    ] = "normal"


class GenerateLickRequest(BaseModel):
    key: Literal["A"] = "A"
    degree: Degree
    chord: str
    flavor: BluesFlavor
    tempo: int = Field(ge=40, le=220)


class GenerateChorusRequest(BaseModel):
    key: Literal["A"] = "A"
    flavor: BluesFlavor
    tempo: int = Field(ge=40, le=220)


class GeneratedLick(BaseModel):
    key: Literal["A"] = "A"
    degree: Degree
    chord: str
    flavor: BluesFlavor
    tempo: int = Field(ge=40, le=220)
    timeSignature: Literal["4/4"] = "4/4"
    notes: list[LickNote] = Field(min_length=1, max_length=12)


class GeneratedChorus(BaseModel):
    key: Literal["A"] = "A"
    flavor: BluesFlavor
    tempo: int = Field(ge=40, le=220)
    bars: list[GeneratedLick] = Field(min_length=12, max_length=12)


class FormSummary(BaseModel):
    id: str
    slug: str
    name: str
    key_root: str
    bar_count: int
    time_signature: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime


class FormBarContext(BaseModel):
    id: str
    form_id: str
    bar_index: int
    degree: str
    chord_symbol: str
    chord_root: Optional[str] = None
    created_at: datetime


class StoredLick(BaseModel):
    id: str
    form_id: str
    bar_index: int
    note_policy: str
    source: str
    tempo: int
    difficulty_level: Optional[int] = None
    is_active: bool
    created_at: datetime
    generated: GeneratedLick
