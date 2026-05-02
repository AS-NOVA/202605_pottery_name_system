from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

# ==========================================
# 1. 基础配置与目录初始化
# ==========================================
BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
LOGS_DIR = BASE_DIR / "logs"
UPLOADS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# 初始化 FastAPI 实例
app = FastAPI(title="彩陶命名体检系统 (MVP)")

# 配置 CORS跨域（极其重要，否则前端 fetch 会被浏览器拦截）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # MVP阶段允许所有来源，方便本地开发
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "彩陶系统后端已启动，工作目录就绪。"}

# ==========================================
# 2. 核心路由：多模态体检与命名分析 (Mock版)
# ==========================================

@app.post("/api/analyze")
async def analyze_pottery(
    original_name: str = Form(""),
    description: str = Form(""),
    era: str = Form(""),
    culture: str = Form(""),
    image: UploadFile = File(None)
):
    # 这是 Day 1 的造假逻辑：无论前端传什么，我们都返回固定的结构
    # 目的是先让前端能拿到数据，把“画圈”的UI效果做出来
    return {
        "status": "success",
        "data": {
            "slots": {
                "时代": era if era else "新石器时代",
                "文化": culture if culture else "马家窑文化",
                "材质/色彩": "黑彩",
                "纹饰": "网格纹",
                "器形": "双耳壶",
                "类型": "半山类型"
            },
            "conflict_warning": "假装做了一次冲突检测：当前各项特征匹配正常，无明显冲突。",
            "suggested_name": f"{era if era else '新石器时代'}{culture if culture else '马家窑文化'}黑彩网格纹双耳壶"
        }
    }