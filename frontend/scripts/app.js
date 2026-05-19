// app.js - 主控制器，负责监听事件并协调 API 和 UI 模块

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('potteryForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // 阻止浏览器默认的页面刷新行为

        // 1. 更新 UI 状态：显示加载中
        ui.showLoading();

        try {
            // 2. 收集数据
            const formData = ui.getFormData();
            
            // 3. 发送请求
            const result = await api.analyzePottery(formData);
            
            // 4. 渲染结果
            const originalName = document.getElementById('originalName').value.trim();
            ui.renderResult(result, originalName);

        } catch (error) {
            console.error('Error:', error);
            // 5. 渲染错误信息
            ui.showError(error);
        }
    });
});