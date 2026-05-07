// 1. 获取 DOM 元素
const form = document.getElementById('potteryForm');    // 左侧的整个表单，是一个form，内含四个div和一个button
const tagsContainer = document.getElementById('tagsContainer'); // 右侧三个div中第一个div内部的子容器，结果要在这里显示，目前内部只有一个占位符span
const conflictBox = document.getElementById('conflictBox'); // 右侧第二个div，默认隐藏，用于显示冲突警告，目前为空
const suggestedNameBox = document.getElementById('suggestedName');  // 右侧第三个div内部的子容器，用于显示最终命名，目前只写了“暂无”

// 定义一个颜色映射字典，实现导师要求的“彩色拆解可视”
const colorMap = {
    "时代": "bg-blue-100 text-blue-800 border-blue-200",
    "文化": "bg-green-100 text-green-800 border-green-200",
    "材质/色彩": "bg-purple-100 text-purple-800 border-purple-200",
    "纹饰": "bg-pink-100 text-pink-800 border-pink-200",
    "器形": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "类型": "bg-teal-100 text-teal-800 border-teal-200"
};

// 2. 绑定表单提交事件
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // 阻止浏览器默认的页面刷新行为

    // 立刻进行 UI 状态反馈：提示正在分析
    tagsContainer.innerHTML = '<span class="text-stone-500 animate-pulse">正在进行多模态分析...</span>';
    conflictBox.classList.add('hidden');
    suggestedNameBox.textContent = "分析中...";

    // 3. 收集表单中用户填写的数据
    const formData = new FormData();
    formData.append('original_name', document.getElementById('originalName').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('era', document.getElementById('eraSelect').value);
    formData.append('culture', document.getElementById('cultureSelect').value);
    
    const imageFile = document.getElementById('imageInput').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        // 4. 发起 HTTP 请求到 FastAPI 后端
        // 注意：发送的数据formData的格式必须和后端/api/analyze接口预期的格式一致
        // 这里需要等待await，当后端返回response后，才能继续
        // response里面先是有状态码，但fetch结束后，数据还没送到
        const response = await fetch('http://127.0.0.1:8000/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('网络请求失败');
        
        // 如果请求成功，不代表数据已经拿到了，还需要继续等待response.json()把数据解析出来，所以这里也要await
        // 把后端返回的response解析成可用的result
        const result = await response.json();
        
        // 5. 渲染返回的数据
        if (result.status === "success") {
            const data = result.data;
            
            // 渲染“画圈”彩色标签
            tagsContainer.innerHTML = '';
            for (const [key, value] of Object.entries(data.slots)) {
                if (value) {
                    const span = document.createElement('span');
                    // 动态应用 Tailwind 颜色类
                    span.className = `px-3 py-1 rounded-md text-sm font-medium border shadow-sm ${colorMap[key] || 'bg-gray-100 text-gray-800 border-gray-200'}`;
                    span.textContent = `[${key}] ${value}`;
                    tagsContainer.appendChild(span);
                }
            }

            // 渲染冲突警告（如果是警告则标红，目前是安全提示，所以稍微改一下样式以示区分）
            conflictBox.textContent = data.conflict_warning;
            conflictBox.classList.remove('hidden');
            // 这里为了展示 Mock 效果，如果是假装无冲突，就用绿色背景
            if(data.conflict_warning.includes("正常")) {
                conflictBox.className = "mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-medium";
            }

            // 渲染最终建议名称
            suggestedNameBox.textContent = data.suggested_name;
        }

    } catch (error) {
        console.error('Error:', error);
        tagsContainer.innerHTML = `<span class="text-red-500 font-bold">请求失败：${error.message} (请检查后端服务是否已启动)</span>`;
    }
});