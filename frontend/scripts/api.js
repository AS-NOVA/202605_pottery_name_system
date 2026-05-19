// api.js - 专门处理所有与后端的网络通信逻辑

const api = {
    async parseOriginalName(originalName) {
        const formData = new FormData();
        formData.append('original_name', originalName);
        const response = await fetch('http://127.0.0.1:8000/api/parse_name', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`原名拆解请求失败: ${response.statusText}`);
        }
        
        return await response.json();
    },

    async generateRecommendedName(formData) {
        // Ensure we don't send original_name to generate_name endpoint
        formData.delete('original_name');
        
        const response = await fetch('http://127.0.0.1:8000/api/generate_name', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`推荐命名请求失败: ${response.statusText}`);
        }
        
        return await response.json();
    }
};
