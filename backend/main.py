from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from schemas import AnalyzeResponse, ElementAnalysis, ElementStatusType
from typing import Optional
import os
import asyncio
from dotenv import load_dotenv


from llm_client import PotteryLLMClient
from information_extract import parse_name

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

    # ------------- 初始化大模型客户端（复用同一实例） -------------
    # 建议从环境变量或配置中心读取
    load_dotenv()  # 从 .env 文件加载环境变量
    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    client = PotteryLLMClient(api_key=api_key, base_url=base_url)

    # ------------- 解析原名（耗时的同步调用放入线程池） -------------
    parsed_name = await asyncio.to_thread(
        parse_name, client, original_name or ""
    )


    origin_era = parsed_name.get("era")
    origin_culture = parsed_name.get("culture")
    origin_pattern = parsed_name.get("pattern")
    origin_material = parsed_name.get("material")
    origin_shape = parsed_name.get("shape")
    origin_shape_type = parsed_name.get("shape_type")



    # return AnalyzeResponse(
    #     era=ElementAnalysis(origin="新石器时代", new=None, type=ElementStatusType.UNVERIFIED),
    #     culture=ElementAnalysis(origin="仰韶文化", new="仰韶文化", type=ElementStatusType.MATCH),
    #     pattern=ElementAnalysis(origin=None, new="几何纹", type=ElementStatusType.ADDED),
    #     material=ElementAnalysis(origin="彩陶", new="彩陶", type=ElementStatusType.MATCH),
    #     shape=ElementAnalysis(origin=None, new=None, type=ElementStatusType.EMPTY),
    #     shape_type=ElementAnalysis(origin="盘", new="盆", type=ElementStatusType.MISMATCH)
    # )
    return parsed_name