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
) -> Dict[str, Dict[str, Optional[str]]]:
    structured = _normalize_dict(structured_data)
    image = _normalize_dict(image_data)
    
    # description_data 可能是 {"pattern": {"value": "x", "source_text": "y"}, ...} 结构
    description = description_data or {}

    result = {}
    for field in FIELDS:
        val_struct = structured.get(field)
        val_img = image.get(field)
        
        desc_obj = description.get(field)
        if isinstance(desc_obj, dict):
            val_desc = desc_obj.get("value")
            source_text = desc_obj.get("source_text")
        else:
            val_desc = desc_obj if isinstance(desc_obj, str) else None
            source_text = None

        if field in ("era", "culture"):
            if val_struct:
                result[field] = {"value": val_struct, "source": "结构化输入", "source_text": None}
            elif val_desc:
                result[field] = {"value": val_desc, "source": "文字描述", "source_text": source_text}
            elif val_img:
                result[field] = {"value": val_img, "source": "图片上传", "source_text": None}
            else:
                result[field] = {"value": None, "source": None, "source_text": None}
        else:
            if val_desc:
                result[field] = {"value": val_desc, "source": "文字描述", "source_text": source_text}
            elif val_struct:
                result[field] = {"value": val_struct, "source": "结构化输入", "source_text": None}
            elif val_img:
                result[field] = {"value": val_img, "source": "图片上传", "source_text": None}
            else:
                result[field] = {"value": None, "source": None, "source_text": None}
    return result
