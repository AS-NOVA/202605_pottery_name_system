
// 后端传来的新数据结构
const apiData = {
    "era": { "origin": "新石器时代", "new": null, "type": "UNVERIFIED" },
    "culture": { "origin": "仰韶文化", "new": "仰韶文化", "type": "MATCH" },
    "pattern": { "origin": null, "new": "几何纹", "type": "ADDED" },
    "material": { "origin": "彩陶", "new": "彩陶", "type": "MATCH" },
    "shape": { "origin": null, "new": null, "type": "EMPTY" },
    "shape_type": { "origin": "盘", "new": "盆", "type": "MISMATCH" }
};

function renderComparison(apiData) {
    // 1. 建立英文 Key 到中文 Label 的映射字典
    const labelMapping = {
        "era": "年代",
        "culture": "文化",
        "pattern": "纹饰",
        "material": "材质",
        "shape": "外形",
        "shape_type": "器型"
    };

    const container = document.getElementById('pottery-name-container');
    // 确保每次渲染前清空容器，防止重复追加
    container.innerHTML = ''; 

    // 2. 遍历新的 JSON 对象
    Object.entries(apiData).forEach(([key, item]) => {
        const boxDiv = document.createElement('div');
        boxDiv.className = 'element-box';

        let valueHtml = '';
        let stateClass = '';

        // 3. 核心逻辑极大简化：直接使用后端计算好的 type 进行 switch 判断
        switch (item.type) {
            case 'MATCH':
                // 1. 确认
                stateClass = 'state-match';
                valueHtml = item.new;
                break;
            case 'MISMATCH':
                // 2. 纠正
                stateClass = 'state-mismatch';
                valueHtml = `<span class="mismatch-old">${item.origin}</span><span class="mismatch-arrow">➔</span><span class="mismatch-new">${item.new}</span>`;
                break;
            case 'UNVERIFIED':
                // 3. 沿用 (旧有新无)
                stateClass = 'state-unverified';
                valueHtml = item.origin;
                break;
            case 'ADDED':
                // 4. 补充 (旧无新有)
                stateClass = 'state-added';
                valueHtml = item.new;
                break;
            case 'EMPTY':
            default:
                // 5. 空缺
                stateClass = 'state-empty';
                valueHtml = '无';
                break;
        }

        // 4. 使用映射字典获取中文标签并拼接 HTML
        boxDiv.innerHTML = `
            <span class="element-label">${labelMapping[key]}</span>
            <div class="element-value-box ${stateClass}">${valueHtml}</div>
        `;
        
        container.appendChild(boxDiv);
    });
}

// 页面加载完成后调用渲染函数
document.addEventListener('DOMContentLoaded', () => {
    renderComparison(apiData);
});