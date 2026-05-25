from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import Optional, List
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

@app.get("/api/example_data")
async def get_example_data():
    txt_path = BASE_DIR / "test_data" / "text_text.txt"
    img_path = BASE_DIR / "test_data" / "b1p22.png"
    
    original_name = ""
    culture = ""
    description = ""
    era = "新石器时代"
    
    if txt_path.exists():
        with open(txt_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                if "原参考名称" in line:
                    parts = line.split("：", 1)
                    if len(parts) < 2:
                        parts = line.split(":", 1)
                    if len(parts) >= 2:
                        original_name = parts[1].strip()
                elif "文化" in line:
                    parts = line.split("：", 1)
                    if len(parts) < 2:
                        parts = line.split(":", 1)
                    if len(parts) >= 2:
                        culture = parts[1].strip()
                elif "描述" in line:
                    parts = line.split("：", 1)
                    if len(parts) < 2:
                        parts = line.split(":", 1)
                    if len(parts) >= 2:
                        description = parts[1].strip()

    img_base64 = ""
    if img_path.exists():
        import base64
        with open(img_path, "rb") as f:
            content = f.read()
            encoded = base64.b64encode(content).decode('utf-8')
            img_base64 = f"data:image/png;base64,{encoded}"
            
    return {
        "original_name": original_name,
        "era": era,
        "culture": culture,
        "description": description,
        "image_filename": img_path.name if img_path.exists() else "b1p22.png",
        "image_base64": img_base64
    }

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
    images: List[UploadFile] = File([]),
    description: Optional[str] = Form(None),
    structured_data: Optional[str] = Form(None),
):
    print(f"\n[DEBUG] === 收到生成推荐命名请求 ===")
    print(f"[DEBUG] 上传图片张数: {len(images) if images else 0}")
    print(f"[DEBUG] 文字描述: {description}")
    print(f"[DEBUG] 结构化信息: {structured_data}")
    
    client = get_llm_client()
    
    parsed_desc = await asyncio.to_thread(
        parse_desc, client, description or ""
    )
    
    # 兼容处理多图：提取首张图片（Index 0）作为主力分析图送入大模型，其余暂不解析
    if images and len(images) > 0:
        primary_image = images[0]
        print(f"[DEBUG] 提取主视角图片: {primary_image.filename}")
        parsed_image = await asyncio.to_thread(
            parse_image, client, primary_image
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