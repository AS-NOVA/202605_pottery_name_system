from typing import Any, Dict, Mapping, Optional
import json

FIELDS = ["era", "culture", "pattern", "material", "shape", "shape_type"]

def empty_fields() -> Dict[str, Optional[str]]:
    return {key: None for key in FIELDS}

def _normalize_dict(data: Optional[Mapping[str, Any]]) -> Dict[str, Optional[str]]:
    if not data:
        return empty_fields()

    result = empty_fields()
    for key in FIELDS:
        value = data.get(key)
        result[key] = value if value not in (None, "") else None
    return result

def _truncate_culture(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    text = value.strip()
    if not text:
        return None

    if text.endswith("文化早期") or text.endswith("文化中期") or text.endswith("文化晚期"):
        idx = text.find("文化")
        return text[: idx + len("文化")]

    return text

def parse_structured_input(structured_data: Optional[object]) -> Dict[str, Optional[str]]:
    if not structured_data:
        return empty_fields()

    if isinstance(structured_data, Mapping):
        result = _normalize_dict(structured_data)
        result["culture"] = _truncate_culture(result.get("culture"))
        return result

    if isinstance(structured_data, str):
        text = structured_data.strip()
        if not text:
            return empty_fields()
        try:
            loaded = json.loads(text)
        except json.JSONDecodeError:
            return empty_fields()
        if isinstance(loaded, Mapping):
            result = _normalize_dict(loaded)
            result["culture"] = _truncate_culture(result.get("culture"))
            return result

    return empty_fields()

def merge_structured_fields(
    structured_data: Optional[Mapping[str, Any]],
    description_data: Optional[Mapping[str, Any]],
    image_data: Optional[Mapping[str, Any]],
) -> Dict[str, Optional[str]]:
    structured = _normalize_dict(structured_data)
    description = _normalize_dict(description_data)
    image = _normalize_dict(image_data)

    result: Dict[str, Optional[str]] = {}
    for field in FIELDS:
        if field in ("era", "culture"):
            result[field] = structured.get(field) or description.get(field) or image.get(field)
        else:
            result[field] = description.get(field) or structured.get(field) or image.get(field)
    return result
