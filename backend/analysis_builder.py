from typing import Any, Dict, Mapping, Optional
from schemas import AnalyzeResponse, ElementAnalysis, ElementStatusType

FIELDS = ["era", "culture", "pattern", "material", "shape", "shape_type"]

def _normalize_value(value: Optional[Any]) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
        return text if text else None
    return str(value).strip() or None

def _build_element(origin: Optional[Any], new: Optional[Any]) -> ElementAnalysis:
    origin_value = _normalize_value(origin)
    new_value = _normalize_value(new)

    if origin_value and new_value:
        status = ElementStatusType.MATCH if origin_value == new_value else ElementStatusType.MISMATCH
    elif origin_value and not new_value:
        status = ElementStatusType.UNVERIFIED
    elif not origin_value and new_value:
        status = ElementStatusType.ADDED
    else:
        status = ElementStatusType.EMPTY

    return ElementAnalysis(origin=origin_value, new=new_value, type=status)

def build_analysis_response(
    origin_data: Optional[Mapping[str, Any]],
    merged_data: Optional[Mapping[str, Any]],
) -> AnalyzeResponse:
    origin = origin_data or {}
    merged = merged_data or {}

    return AnalyzeResponse(
        era=_build_element(origin.get("era"), merged.get("era")),
        culture=_build_element(origin.get("culture"), merged.get("culture")),
        pattern=_build_element(origin.get("pattern"), merged.get("pattern")),
        material=_build_element(origin.get("material"), merged.get("material")),
        shape=_build_element(origin.get("shape"), merged.get("shape")),
        shape_type=_build_element(origin.get("shape_type"), merged.get("shape_type")),
    )
