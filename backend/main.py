from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from schemas import AnalyzeResponse
from typing import Optional
import os
import asyncio
from dotenv import load_dotenv


from llm_client import PotteryLLMClient
from information_extract import parse_name, parse_desc, parse_image
from structured_merge import merge_structured_fields, parse_structured_input, empty_fields
from analysis_builder import build_analysis_response

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
    ds_api_key = os.getenv("DEEPSEEK_API_KEY", "")
    ds_base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    ds_model = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")
    qwen_api_key = os.getenv("QWEN_API_KEY", "")
    qwen_base_url = os.getenv("QWEN_BASE_URL", "")
    qwen_model = os.getenv("QWEN_MODEL", "qwen3.6-flash")
    client = PotteryLLMClient(
        text_llm_api_key=ds_api_key,
        text_llm_base_url=ds_base_url,
        text_llm_model=ds_model,
        mutimodal_llm_api_key=qwen_api_key,
        mutimodal_llm_base_url=qwen_base_url,
        mutimodal_llm_model=qwen_model,
    )

    # ------------- 解析原名（耗时的同步调用放入线程池） -------------
    parsed_name = await asyncio.to_thread(
        parse_name, client, original_name or ""
    )

    # ------------- 解析描述与图片 -------------
    parsed_desc = await asyncio.to_thread(
        parse_desc, client, description or ""
    )
    
    if image:
        parsed_image = await asyncio.to_thread(
            parse_image, client, image
        )
    else:
        parsed_image = empty_fields()

    structured_dict = parse_structured_input(structured_data)
    merged_structured = merge_structured_fields(
        structured_dict,
        parsed_desc,
        parsed_image,
    )


    # origin_era = parsed_name.get("era")
    # origin_culture = parsed_name.get("culture")
    # origin_pattern = parsed_name.get("pattern")
    # origin_material = parsed_name.get("material")
    # origin_shape = parsed_name.get("shape")
    # origin_shape_type = parsed_name.get("shape_type")



    return build_analysis_response(parsed_name, merged_structured)