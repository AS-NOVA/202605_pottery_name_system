// api.js - 专门处理所有与后端的网络通信逻辑

const api = {
    /**
     * 将表单数据发送到后端进行分析
     * @param {FormData} formData - 包含图片、文本和结构化数据的表单对象
     * @returns {Promise<Object>} 后端返回的 JSON 分析结果
     */
    async analyzePottery(formData) {
        const response = await fetch('http://127.0.0.1:8000/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`网络请求失败: ${response.statusText}`);
        }
        
        return await response.json();
    }
};
