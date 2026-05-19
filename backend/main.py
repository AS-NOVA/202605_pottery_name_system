from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import Optional
import os
import asyncio
from dotenv import load_dotenv


from core.llm_client import PotteryLLMClient
from services.information_extract import parse_name, parse_desc, parse_image
from services.structured_merge import merge_structured_fields, parse_structured_input, empty_fields

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

from schemas.models import ParseNameResponse, GenerateNameResponse

# ==========================================
# 2. 核心接口：拆解原名与生成命名
# ==========================================

def get_llm_client():
    load_dotenv()
    ds_api_key = os.getenv("DEEPSEEK_API_KEY", "")
    ds_base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    ds_model = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")
    qwen_api_key = os.getenv("QWEN_API_KEY", "")
    qwen_base_url = os.getenv("QWEN_BASE_URL", "")
    qwen_model = os.getenv("QWEN_MODEL", "qwen3.6-flash")
    return PotteryLLMClient(
        text_llm_api_key=ds_api_key,
        text_llm_base_url=ds_base_url,
        text_llm_model=ds_model,
        mutimodal_llm_api_key=qwen_api_key,
        mutimodal_llm_base_url=qwen_base_url,
        mutimodal_llm_model=qwen_model,
    )

@app.post("/api/parse_name", response_model=ParseNameResponse)
async def api_parse_name(
    original_name: str = Form(""),
):
    print(f"\n[DEBUG] === 收到拆解原名请求 ===")
    print(f"[DEBUG] 输入原名: {original_name}")
    
    client = get_llm_client()
    parsed_name = await asyncio.to_thread(
        parse_name, client, original_name
    )
    
    import json
    print(f"[DEBUG] 拆解结果:\n{json.dumps(parsed_name, ensure_ascii=False, indent=2)}")
    print(f"[DEBUG] ==========================\n")
    return parsed_name

@app.post("/api/generate_name", response_model=GenerateNameResponse)
async def api_generate_name(
    image: Optional[UploadFile] = File(None),
    description: Optional[str] = Form(None),
    structured_data: Optional[str] = Form(None),
):
    print(f"\n[DEBUG] === 收到生成推荐命名请求 ===")
    print(f"[DEBUG] 图片上传: {'是' if image else '否'}")
    print(f"[DEBUG] 文字描述: {description}")
    print(f"[DEBUG] 结构化信息: {structured_data}")
    
    client = get_llm_client()
    
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

    import json
    print(f"[DEBUG] 最终生成命名及溯源结果:\n{json.dumps(merged_structured, ensure_ascii=False, indent=2)}")
    print(f"[DEBUG] ==============================\n")
    return merged_structured