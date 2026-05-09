// 1. 获取 DOM 元素
const form = document.getElementById('potteryForm');    // 左侧的整个表单，是一个form，内含四个div和一个button
const analysisResult = document.getElementById('analysisResult');    // 右侧的分析结果展示区域



// 2. 绑定表单提交事件
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // 阻止浏览器默认的页面刷新行为

    analysisResult.textContent = "正在分析中...";

    // 3. 收集表单中用户填写的数据
    const formData = new FormData();
    formData.append('original_name', document.getElementById('originalName').value);
    formData.append('description', document.getElementById('description').value);
    // const era = document.getElementById('eraSelect').value;
    const era = document.getElementById('eraInput').value;
    // const culture = document.getElementById('cultureSelect').value;
    const culture = document.getElementById('cultureInput').value;
    const structuredData = {era: era, culture: culture};
    formData.append('structured_data', JSON.stringify(structuredData));

    
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
        analysisResult.innerHTML = ''; // 先清空之前的结果
        analysisResult.textContent = JSON.stringify(result, null, 2);

    } catch (error) {
        console.error('Error:', error);
        analysisResult.innerHTML = `<span class="text-red-500 font-bold">请求失败：${error.message} (请检查后端服务是否已启动)</span>`;
    }
});