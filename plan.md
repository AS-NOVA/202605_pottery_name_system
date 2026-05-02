### 项目：彩陶智能信息提取与命名解析系统 (MVP V1.0)

**核心命名公式：** `[时代] + [文化] + [纹饰] + [器形] + [材质/色彩] + [类型]`

#### **Day 1: 基础设施搭建与前后端通信闭环**
**技术栈：** FastAPI (后端), HTML5 + Tailwind CSS + Vanilla JS (前端)
**核心目标：** 完成项目物理目录初始化，跑通假数据（Mock）的请求与渲染，实现“原名拆解为彩色标签”的 UI 效果。

*   **1. 目录结构与初始化**
    *   创建项目根目录 `pottery_naming_system/`。
    *   **规范约束：** 根目录下创建 `uploads/`（存放前端传来的临时图片）和 `logs/`（存放运行日志）目录。
*   **2. 创建 `main.py` (FastAPI 核心路由)**
    *   **规范约束：** 文件首行引入 `pathlib`，定义全局变量 `BASE_DIR = Path(__file__).resolve().parent`。后续所有路径读写均基于 `BASE_DIR` 拼接。
    *   **功能：** 编写 POST 路由 `/api/analyze`。接收 `FormData`（包含图片文件、原参考名、描述文本、时代下拉值、文化下拉值）。
    *   **逻辑：** 暂时不写处理逻辑。无论接收到什么，直接 `return` 一个包含 6 个槽位键值对、1 个冲突警告字段的 Mock JSON 字典。
*   **3. 创建 `index.html` (前端展示页)**
    *   **功能 1 (输入区)：** 使用 Tailwind CSS 快速搭建。包含表单元素：原名称 `<input>`、多模态补充描述 `<textarea>`、时代/文化 `<select>`、图片 `<input type="file">`，以及一个触发请求的 `<button>`。
    *   **功能 2 (请求逻辑)：** 编写 JavaScript，绑定按钮点击事件，获取表单数据封装为 `FormData`，使用 `fetch` API 以 POST 方式向 `[http://127.0.0.1:8000/api/analyze](http://127.0.0.1:8000/api/analyze)` 发送异步请求。
    *   **功能 3 (渲染区)：** 解析后端返回的 JSON。通过 JS 动态创建带有不同 Tailwind 背景色类名（如 `bg-blue-100`, `bg-red-100`）和圆角属性（`rounded-md`）的 `<span>` 标签，实现命名成分的高亮隔离显示。

#### **Day 2: 文本信息处理引擎与规则校验**
**技术栈：** Python (正则/集合匹配), LLM API (如通义千问/智谱)
**核心目标：** 接入真实文本提取逻辑，替换 Day 1 的假数据，实现基于“原参考名”的解构。

*   **1. 创建 `parser.py` (硬规则提取器)**
    *   **功能：** 定义三个 Python `List`，存入少量考古学术语（如 `ERA_LIST = ["新石器时代晚期", ...]`, `CULTURE_LIST = ["仰韶文化", "马家窑文化", ...]`, `SHAPE_LIST = ["盆", "钵", "双耳壶"]`）。
    *   **逻辑：** 编写 `extract_from_text(text: str) -> dict` 函数。遍历列表，若术语在输入文本中命中，则填入对应字典槽位，并将其从原字符串中剔除。
*   **2. 创建 `llm_service.py` (模糊文本与图片兜底)**
    *   **功能：** 编写调用外部大模型 API 的函数，用于提取难以规则化的“纹饰”和“材质/色彩”。
    *   **规范约束：** 强制日志记录。使用 Python `logging` 模块或手动文件写入，在 `logs/` 目录下生成 `.log` 文件，明确记录单次请求的 Timestamp、Prompt 内容、API Status Code 及原始 Response，以便追溯幻觉或请求失败。
*   **3. 创建 `reviewer.py` (冲突检测器)**
    *   **功能：** 编写 `check_conflict(structured_data, parsed_data) -> str` 函数。
    *   **逻辑：** 提取前端传入的结构化“文化”字段，比对 `parser.py` 从“原参考名”中提取的“文化”字段。若两者字符串不一致，返回标准化的错误警告文本；否则返回空字符串。
*   **4. 路由集成**
    *   在 `main.py` 中引入上述三个模块，组合逻辑并替换掉 Day 1 的 Mock JSON。

#### **Day 3: 计算机视觉模型微调与系统联调测试**
**技术栈：** PyTorch, torchvision
**核心目标：** 在本地 GPU 训练极简器型分类网络，并执行系统级批量测试。

*   **1. 数据集组建 (极速版)**
    *   建立 `dataset/train/` 和 `dataset/val/` 目录。
    *   人工挑选 3 种特征极度明显的器型（如“双耳罐”、“盆”、“钵”），每种 40-50 张图片，按分类名称放入对应子文件夹。
*   **2. 创建 `train.py` (迁移学习微调)**
    *   **功能：** 载入 `torchvision.models.resnet18(pretrained=True)`。
    *   **逻辑：** 冻结 Backbone 层权重。将 `fc` (Fully Connected) 层的 `out_features` 修改为 3。定义 CrossEntropyLoss 和 Adam 优化器。将模型与张量推入 `.cuda()`。
    *   **规范约束：** 在 DataLoader 的 Epoch 循环中，强制挂载 `tqdm` 进度条。
    *   训练 5-10 个 Epoch 后，保存权重至 `BASE_DIR / 'weights' / 'resnet18_shape_v1.pth'`。
*   **3. 创建 `infer_vision.py` (视觉推理接口)**
    *   **功能：** 编写 `predict_shape(image_path: Path) -> str` 函数。加载 `.pth` 权重，对单张传入图片进行 `transform` 预处理，执行前向传播，返回器型名称。
    *   在 `main.py` 中接入此函数，用于填补前端上传图片的“器型”槽位。
*   **4. 创建 `batch_test.py` (批量离线测试)**
    *   **功能：** 编写脚本对本地若干真实彩陶数据（图文对）进行连贯的系统级推理测试。
    *   **规范约束：** 测试循环强制使用 `tqdm`。测试结果输出的报告文件（.csv 或 .json格式）名称中必须包含精确到分钟的时间戳（例如：`report_20260502_1308.csv`），绝对禁止写死固定文件名引发覆盖。

---

如果对上述工程规范和接口定义没有疑义，请在此工作区创建 `main.py` 和 `index.html`，开始 Day 1 的代码编写。遇到任何卡点，随时将报错信息或代码片段发给我。准备好出发了吗？