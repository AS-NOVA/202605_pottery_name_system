from typing import Dict, Optional
from core.llm_client import PotteryLLMClient
from schemas.field_rules import filter_shape
from dotenv import load_dotenv
import os
from fastapi import UploadFile
import base64
from pathlib import Path
import io

def parse_name(client: PotteryLLMClient, original_name: str) -> Dict[str, Optional[str]]:
    """
    使用大模型将原始名称拆分为六要素字典。
    如果 original_name 为空，直接返回全 None 的字典。
    """
    if not original_name or not original_name.strip():
        return {
            "era": None,
            "culture": None,
            "pattern": None,
            "material": None,
            "shape": None,
            "shape_type": None,
        }

    # 调用大模型解析
    result = client.parse_original_name(original_name.strip())
    return result

def parse_desc(client: PotteryLLMClient, description: str) -> Dict[str, Optional[Dict[str, str]]]:
    """
    使用大模型根据描述文本提取信息。返回值为嵌套字典，每个字段含有 value 和 source_text。
    """
    if not description or not description.strip():
        return {key: None for key in ["era", "culture", "pattern", "material", "shape", "shape_type"]}

    result = client.extract_from_description(description.strip())

    # 临时补丁规则：材质固定为彩陶，shape 需满足合法组合
    if result.get("material") is None:
        result["material"] = {"value": "彩陶", "source_text": ""}
    elif isinstance(result.get("material"), dict):
        result["material"]["value"] = "彩陶"
    else:
        result["material"] = {"value": "彩陶", "source_text": ""}

    shape_obj = result.get("shape")
    if isinstance(shape_obj, dict) and shape_obj.get("value"):
        shape_obj["value"] = filter_shape(shape_obj["value"])
        result["shape"] = shape_obj

    return result

def uploadfile_to_base64(file: UploadFile) -> str:
    """同步转换 UploadFile 为 base64 data URI"""
    content = file.file.read()
    encoded = base64.b64encode(content).decode('utf-8')
    mime_type = file.content_type or "image/jpeg"
    return f"data:{mime_type};base64,{encoded}"

def parse_image(client: PotteryLLMClient, image: UploadFile) -> Dict[str, Optional[str]]:
    """
    使用大模型根据图片提取信息。
    如果 image 不存在，直接返回全 None 的字典。
    """
    if not UploadFile:
        return {
            "era": None,
            "culture": None,
            "pattern": None,
            "material": None,
            "shape": None,
            "shape_type": None,
        }

    image_base64 = uploadfile_to_base64(image)
    

    # 调用大模型解析
    result = client.extract_from_image(image_base64)

    # 临时补丁规则：shape 需满足合法组合
    result["shape"] = filter_shape(result.get("shape"))
    return result

if __name__ == "__main__":
    # 快速测试
    load_dotenv()  # 从 .env 文件加载环境变量
    ds_api_key = os.getenv("DEEPSEEK_API_KEY", "")
    ds_base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    qwen_api_key = os.getenv("QWEN_API_KEY", "")
    qwen_base_url = os.getenv("QWEN_BASE_URL", "")
    client = PotteryLLMClient(text_llm_api_key=ds_api_key, text_llm_base_url=ds_base_url, text_llm_model="deepseek-v4-flash",
                              mutimodal_llm_api_key=qwen_api_key, mutimodal_llm_base_url=qwen_base_url, mutimodal_llm_model="qwen3.6-flash")
    
    test_name = "新石器时代仰韶文化彩陶盘"
    parsed_name = parse_name(client, test_name)
    print(parsed_name)

    test_desc = "钵。泥质陶。圆唇，微敛口，口部外壁加厚，口部和腹部交接处起折棱。口沿外表施红陶衣，饰黑彩平行斜线纹。线条头端圆宽，尾端尖细。这是一件新石器时代仰韶文化的彩陶盘，具有典型的红陶底色和黑色几何纹饰。"
    parsed_desc = parse_desc(client, test_desc)
    print(parsed_desc)

    test_img_path = Path(__file__).resolve().parent / "test_data" / "b1p22.png"
    with open(test_img_path, "rb") as f:
        content = f.read()
    
    test_img = UploadFile(
        filename=test_img_path.name,
        file=io.BytesIO(content),
    )
    
    parsed_img = parse_image(client, test_img)
    # 同步情况下可以直接关闭
    test_img.file.close()

    print(parsed_img)

