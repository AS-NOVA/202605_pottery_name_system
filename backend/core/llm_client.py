import json
import os
from openai import OpenAI

class PotteryLLMClient:
    def __init__(self, text_llm_api_key: str, text_llm_base_url: str, text_llm_model: str,
                 mutimodal_llm_api_key: str, mutimodal_llm_base_url: str, mutimodal_llm_model: str):
        self.text_llm_api_key = text_llm_api_key
        self.text_llm_base_url = text_llm_base_url
        self.text_llm_model = text_llm_model
        self.text_llm_client = OpenAI(api_key=text_llm_api_key, base_url=text_llm_base_url)
        self.mutimodal_llm_api_key = mutimodal_llm_api_key
        self.mutimodal_llm_base_url = mutimodal_llm_base_url
        self.mutimodal_llm_model = mutimodal_llm_model
        self.multimodal_llm_client = OpenAI(api_key=mutimodal_llm_api_key, base_url=mutimodal_llm_base_url)

    def _load_system_prompt(self, prompt_file) -> str:
        """加载系统提示语"""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(current_dir, prompt_file)
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    def parse_original_name(self, name: str) -> dict:
        """
        模块 1: 拆分原名为六要素 (调用 DeepSeek API，启用 JSON 模式)
        """
        system_prompt = self._load_system_prompt("prompts/parse_original_name_system.txt")

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": name}   # 或者 "原始名称：{name}" 更清晰
        ]

        try:
            response = self.text_llm_client.chat.completions.create(
                model=self.text_llm_model,
                messages=messages,
                temperature=0.1,
                response_format={'type': 'json_object'},   # 启用 JSON 模式
                extra_body={
                    'enable_thinking': False,  # 非标准参数放这里
                },
            )
            content = response.choices[0].message.content
            result = json.loads(content)
        except Exception as e:
            # 调用失败或解析失败时，返回全 None 字典
            result = {}

        # 确保所有六个键都存在，缺失的补 None
        expected_keys = ["era", "culture", "pattern", "material", "shape", "shape_type"]
        final_result = {}
        for key in expected_keys:
            final_result[key] = result.get(key) if result.get(key) is not None else None

        return final_result



    def extract_from_description(self, text: str) -> dict:
        """
        模块 2: 根据描述文本提取信息 (纯文本大模型)
        """
        system_prompt = self._load_system_prompt("prompts/parse_description_system.txt")

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}   # 或者 "原始名称：{name}" 更清晰
        ]

        try:
            response = self.text_llm_client.chat.completions.create(
                model=self.text_llm_model,
                messages=messages,
                temperature=0.1,
                response_format={'type': 'json_object'},   # 启用 JSON 模式
                extra_body={
                    'enable_thinking': False,  # 非标准参数放这里
                },
            )
            content = response.choices[0].message.content
            result = json.loads(content)
        except Exception as e:
            # 调用失败或解析失败时，返回全 None 字典
            result = {}

        # 确保所有键都存在，缺失的补 None
        expected_keys = ["era", "culture", "pattern", "material", "shape", "shape_type"]
        final_result = {}
        for key in expected_keys:
            final_result[key] = result.get(key) if result.get(key) is not None else None

        return final_result

    def extract_from_image(self, img_base64: str) -> dict:
        """
        模块 3: 从彩陶文物图片提取六要素 (调用 Qwen-VL 多模态 API，启用 JSON 模式)
        
        Args:
            img_base64: 图片的 base64 字符串，支持两种格式：
                    - 纯 base64: "/9j/4AAQSkZJRg..."
                    - data URI: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        
        Returns:
            dict: 包含六要素的字典，缺失字段自动补 None
            {
                "era": str or None,      # 年代
                "culture": str or None,  # 文化
                "pattern": str or None,  # 纹饰
                "material": str or None, # 材质
                "shape": str or None,    # 外形特点
                "shape_type": str or None # 通称
            }
        """
        # 1. 加载 system prompt（外部文件管理，便于迭代优化）
        system_prompt = self._load_system_prompt("prompts/extract_from_image_system.txt")
        
        # # 2. 标准化 base64 格式：确保符合 Qwen API 要求的 data URI 格式
        # if img_base64.startswith("data:image"):
        #     image_url = img_base64  # 已是完整 data URI
        # else:
        #     # 补充 MIME 头，默认按 jpeg 处理（Qwen-VL 能自动兼容常见格式）
        #     image_url = f"data:image/jpeg;base64,{img_base64}"
        image_url = img_base64
        
        # 3. 构建多模态消息（image + text）
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text", "text": "请分析这张彩陶文物图片，提取六要素信息。"}
            ]}
        ]
        
        # 4. 调用 Qwen-VL 多模态模型
        try:
            response = self.multimodal_llm_client.chat.completions.create(
                model=self.mutimodal_llm_model,
                messages=messages,
                temperature=0.1,                  # 低温度保证输出稳定
                response_format={'type': 'json_object'},  # 启用 JSON 模式
                extra_body={
                    'enable_thinking': False,  # 非标准参数放这里
                },
            )
            content = response.choices[0].message.content
            result = json.loads(content)
            # result = response.model_dump_json()
            print(f"[Debug] Raw Qwen-VL response: {result}")
            
        except json.JSONDecodeError as e:
            # JSON 解析失败（模型未严格返回合法 JSON）
            print(f"[Warning] JSON parse failed: {e}")
            result = {}
        except Exception as e:
            # 网络错误 / API 限流 / 其他异常
            print(f"[Error] Qwen-VL API call failed: {e}")
            result = {}
        
        # 5. 兜底处理：确保返回字典始终包含六个标准键
        expected_keys = ["era", "culture", "pattern", "material", "shape", "shape_type"]
        final_result = {key: result.get(key) for key in expected_keys}
        
        return final_result