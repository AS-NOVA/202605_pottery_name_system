from typing import Optional, Set

SHAPE_TERMS: Set[str] = {"单耳", "双耳", "高柄"}
_SEPARATORS = {" ", "\t", "\n", "\r", ",", "，", "、", ";", "；", "/", "|", "_"}

def _normalize_shape(text: str) -> str:
    return "".join(ch for ch in text.strip() if ch not in _SEPARATORS)

def is_shape_composed_of_terms(shape: Optional[str], terms: Set[str] = SHAPE_TERMS) -> bool:
    if not shape:
        return False

    normalized = _normalize_shape(shape)
    if not normalized:
        return False

    term_list = sorted(terms, key=len, reverse=True)
    length = len(normalized)
    dp = [False] * (length + 1)
    dp[0] = True

    for i in range(length):
        if not dp[i]:
            continue
        for term in term_list:
            if normalized.startswith(term, i):
                dp[i + len(term)] = True

    return dp[length]

def filter_shape(shape: Optional[str], terms: Set[str] = SHAPE_TERMS) -> Optional[str]:
    if not shape:
        return None

    return shape.strip() if is_shape_composed_of_terms(shape, terms) else None
