// app.js - 主控制器，负责监听事件并协调 API 和 UI 模块

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('potteryForm');

// 全局状态维护
    const state = {
        era: { origin: null, new: null },
        culture: { origin: null, new: null },
        pattern: { origin: null, new: null },
        material: { origin: null, new: null },
        shape: { origin: null, new: null },
        shape_type: { origin: null, new: null },
    };

    const btnParseName = document.getElementById('btnParseName');
    const btnGenerateName = document.getElementById('btnGenerateName');

    btnParseName.addEventListener('click', async () => {
        const originalName = document.getElementById('originalName').value.trim();
        if (!originalName) {
            alert("请填写原参考名后再进行拆解分析");
            return;
        }

        // 清除现有的 origin 状态并重新渲染，以达到清空视图的效果
        for (let key in state) {
            state[key].origin = null;
        }
        ui.renderResult(state, originalName);
        ui.showLoading("正在拆解原名...");
        
        try {
            const result = await api.parseOriginalName(originalName);
            
            // 更新状态中的 origin
            for (let key in state) {
                state[key].origin = result[key] !== undefined ? result[key] : null;
            }
            
            ui.renderResult(state, originalName);

        } catch (error) {
            console.error('Error:', error);
            ui.showError(error);
        } finally {
            ui.hideLoading();
        }
    });

    btnGenerateName.addEventListener('click', async () => {
        // 清除现有的 new 状态并重新渲染，以达到清空视图的效果
        for (let key in state) {
            state[key].new = null;
        }
        const originalName = document.getElementById('originalName').value.trim();
        ui.renderResult(state, originalName);
        ui.showLoading("正在生成推荐命名...");
        
        try {
            const formData = ui.getFormData();
            const result = await api.generateRecommendedName(formData);
            
            // 更新状态中的 new
            for (let key in state) {
                state[key].new = result[key] !== undefined ? result[key] : null;
            }
            
            ui.renderResult(state, originalName);

        } catch (error) {
            console.error('Error:', error);
            ui.showError(error);
        } finally {
            ui.hideLoading();
        }
    });

    const btnAnalyzeBoth = document.getElementById('btnAnalyzeBoth');
    if (btnAnalyzeBoth) {
        btnAnalyzeBoth.addEventListener('click', async () => {
            const originalName = document.getElementById('originalName').value.trim();
            if (!originalName) {
                alert("请填写原参考名后再进行全面分析");
                return;
            }

            // 清空所有状态并重新渲染
            for (let key in state) {
                state[key].origin = null;
                state[key].new = null;
            }
            ui.renderResult(state, originalName);
            ui.showLoading("正在进行全面分析...");

            try {
                const formData = ui.getFormData();
                
                // 并发请求两个接口
                const [parseResult, generateResult] = await Promise.all([
                    api.parseOriginalName(originalName),
                    api.generateRecommendedName(formData)
                ]);

                // 更新状态
                for (let key in state) {
                    state[key].origin = parseResult[key] !== undefined ? parseResult[key] : null;
                    state[key].new = generateResult[key] !== undefined ? generateResult[key] : null;
                }
                
                ui.renderResult(state, originalName);

            } catch (error) {
                console.error('Error:', error);
                ui.showError(error);
            } finally {
                ui.hideLoading();
            }
        });
    }

    const btnClearAll = document.getElementById('btnClearAll');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            // 清空状态
            for (let key in state) {
                state[key].origin = null;
                state[key].new = null;
            }
            // 清空UI
            ui.clearUI();
        });
    }
});