前端需要将图片、结构化信息、非结构化描述文本、原名传递给后端

后端需要将六要素及其五分类传给前端

六个字段分别称为`era`、`culture`、`pattern`、`material`、`shape`、`shape_type`

# 彩陶智能命名系统 API 格式

## 1. 拆解原名接口 (Parse Original Name)

### 请求格式

- **路径:** `/api/parse_name`
- **方法:** `POST`
- **Content-Type:** `multipart/form-data`

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `original_name` | String | 是 | 现存的原始命名 |

### 响应格式

- **Content-Type:** `application/json`
- **数据结构:** 包含 6 个固定 Key 的 JSON 字典，表示抽取出的原名要素。

```json
{
  "era": "新石器时代",
  "culture": "仰韶文化",
  "pattern": null,
  "material": "彩陶",
  "shape": null,
  "shape_type": "盘"
}
```

## 2. 生成命名接口 (Generate Recommended Name)

### 请求格式

- **路径:** `/api/generate_name`
- **方法:** `POST`
- **Content-Type:** `multipart/form-data`

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `image` | File | 否 | 彩陶文物图片文件 |
| `description` | String | 否 | 非结构化描述文本 |
| `structured_data` | JSON String | 否 | 结构化字段字典，如 `{"era":"新石器时代", "culture":"仰韶文化"}` |

### 响应格式

- **Content-Type:** `application/json`
- **数据结构:** 包含 6 个固定 Key 的 JSON 字典，表示系统推荐的新命名要素。每个要素是一个包含 `value`, `source` 和 `source_text` 的对象。
  - `value`: 推荐命名的具体值
  - `source`: 来源类别（如："结构化输入", "文字描述", "图片上传"）
  - `source_text`: 仅当来源为文字描述时，附带的大模型抽取的原文摘录

```json
{
  "era": {
    "value": null,
    "source": null,
    "source_text": null
  },
  "culture": {
    "value": "仰韶文化",
    "source": "结构化输入",
    "source_text": null
  },
  "pattern": {
    "value": "几何纹",
    "source": "文字描述",
    "source_text": "饰黑色几何纹"
  },
  "material": {
    "value": "彩陶",
    "source": "图片上传",
    "source_text": null
  },
  "shape": {
    "value": null,
    "source": null,
    "source_text": null
  },
  "shape_type": {
    "value": "盆",
    "source": "文字描述",
    "source_text": "盆。"
  }
}
```

> **注意：** 状态属性（确认、补充、纠正等）由前端通过缓存这 2 个接口的返回值自行比对计算。
