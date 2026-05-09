from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from schemas import AnalyzeResponse, ElementAnalysis, ElementStatusType
from typing import Optional

# ==========================================
# 1. 基础配置与目录初始化
# ==========================================
BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
LOGS_DIR = BASE_DIR / "logs"
UPLOADS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# 初始化 FastAPI 实例
app = FastAPI(title="彩陶智能命名系统")

# 配置 CORS跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 暂时允许所有来源，方便本地开发
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "后端已启动"}

# ==========================================
# 2. 核心接口：分析与命名建议
# ==========================================

@app.post("/api/analyze")
async def analyze_pottery(
    image: Optional[UploadFile] = File(None),
    description: Optional[str] = Form(None),
    structured_data: Optional[str] = Form(None),
    original_name: Optional[str] = Form(""),
):

    # 这里我们先返回一个模拟的结果，方便前端开发和接口联调
    # {
    #   "era": { "origin": "新石器时代", "new": null, "type": "UNVERIFIED" },
    #   "culture": { "origin": "仰韶文化", "new": "仰韶文化", "type": "MATCH" },
    #   "pattern": { "origin": null, "new": "几何纹", "type": "ADDED" },
    #   "material": { "origin": "彩陶", "new": "彩陶", "type": "MATCH" },
    #   "shape": { "origin": null, "new": null, "type": "EMPTY" },
    #   "shape_type": { "origin": "盘", "new": "盆", "type": "MISMATCH" }
    # }

    return AnalyzeResponse(
        era=ElementAnalysis(origin="新石器时代", new=None, type=ElementStatusType.UNVERIFIED),
        culture=ElementAnalysis(origin="仰韶文化", new="仰韶文化", type=ElementStatusType.MATCH),
        pattern=ElementAnalysis(origin=None, new="几何纹", type=ElementStatusType.ADDED),
        material=ElementAnalysis(origin="彩陶", new="彩陶", type=ElementStatusType.MATCH),
        shape=ElementAnalysis(origin=None, new=None, type=ElementStatusType.EMPTY),
        shape_type=ElementAnalysis(origin="盘", new="盆", type=ElementStatusType.MISMATCH)
    )