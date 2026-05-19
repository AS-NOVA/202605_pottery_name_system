# 后端返回前端的数据结构定义

from pydantic import BaseModel
from typing import Optional

class ParseNameResponse(BaseModel):
    era: Optional[str] = None
    culture: Optional[str] = None
    pattern: Optional[str] = None
    material: Optional[str] = None
    shape: Optional[str] = None
    shape_type: Optional[str] = None

class ElementResult(BaseModel):
    value: Optional[str] = None
    source: Optional[str] = None
    source_text: Optional[str] = None

class GenerateNameResponse(BaseModel):
    era: Optional[ElementResult] = None
    culture: Optional[ElementResult] = None
    pattern: Optional[ElementResult] = None
    material: Optional[ElementResult] = None
    shape: Optional[ElementResult] = None
    shape_type: Optional[ElementResult] = None