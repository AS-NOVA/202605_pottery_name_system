# 后端返回前端的数据结构定义

from pydantic import BaseModel
from typing import Optional
from enum import Enum

# 定义你设计的五种状态枚举，规范代码，防止手滑拼错
class ElementStatusType(str, Enum):
    MATCH = "MATCH"
    MISMATCH = "MISMATCH"
    ADDED = "ADDED"
    UNVERIFIED = "UNVERIFIED"
    EMPTY = "EMPTY"

# 定义单个要素的结构
class ElementAnalysis(BaseModel):
    origin: Optional[str] = None
    new: Optional[str] = None
    type: ElementStatusType

# 定义最终返回给前端的完整大 JSON
class AnalyzeResponse(BaseModel):
    era: ElementAnalysis
    culture: ElementAnalysis
    pattern: ElementAnalysis
    material: ElementAnalysis
    shape: ElementAnalysis
    shape_type: ElementAnalysis