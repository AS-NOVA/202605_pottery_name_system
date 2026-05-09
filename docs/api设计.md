前端需要将图片、结构化信息、非结构化描述文本、原名传递给后端

后端需要将六要素及其五分类传给前端

六个字段分别称为`era`、`culture`、`pattern`、`material`、`shape`、`shape_type`

# 彩陶智能命名系统 API 格式

## 1. 核心分析接口 (Analyze Pottery)

### 请求格式

- **路径:** `/api/analyze`
- **方法:** `POST`
- **Content-Type:** `multipart/form-data`

| 字段名            | 类型        | 必填 | 说明                                                            |
| :---------------- | :---------- | :--- | :-------------------------------------------------------------- |
| `image`           | File        | 否   | 彩陶文物图片文件                                                |
| `description`     | String      | 否   | 非结构化描述文本                                                |
| `structured_data` | JSON String | 否   | 结构化字段字典，如 `{"era":"新石器时代", "culture":"仰韶文化"}` |
| `original_name`   | String      | 否   | 现存的原始命名                                                  |

### 响应格式

- **Content-Type:** `application/json`
- **数据结构:** 包含 6 个固定 Key，每个 Key 对应一个要素状态对象。状态类型 (`type`) 枚举值为：

  - `MATCH`: 完全相同
  - `MISMATCH`: 都有但不同 (冲突)
  - `ADDED`: 原名无，系统补充
  - `UNVERIFIED`: 原名有，系统无法判定，沿用原名
  - `EMPTY`: 二者皆无

- **JSON 示例:**

```json
{
  "era": { "origin": "新石器时代", "new": null, "type": "UNVERIFIED" },
  "culture": { "origin": "仰韶文化", "new": "仰韶文化", "type": "MATCH" },
  "pattern": { "origin": null, "new": "几何纹", "type": "ADDED" },
  "material": { "origin": "彩陶", "new": "彩陶", "type": "MATCH" },
  "shape": { "origin": null, "new": null, "type": "EMPTY" },
  "shape_type": { "origin": "盘", "new": "盆", "type": "MISMATCH" }
}
```

