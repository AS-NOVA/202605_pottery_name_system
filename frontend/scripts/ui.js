// ui.js - 专门负责 DOM 操作和页面渲染逻辑

const ui = {
    /**
     * 从表单中收集用户输入的数据并封装为 FormData
     * @returns {FormData}
     */
    getFormData() {
        const formData = new FormData();
        formData.append('original_name', document.getElementById('originalName').value);
        formData.append('description', document.getElementById('description').value);
        const era = document.getElementById('eraInput').value;
        const culture = document.getElementById('cultureInput').value;
        const structuredData = {era: era, culture: culture};
        formData.append('structured_data', JSON.stringify(structuredData));
        
        const imageFile = document.getElementById('imageInput').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        return formData;
    },

    /**
     * 在结果区域显示加载状态
     */
    showLoading() {
        const analysisResult = document.getElementById('analysisResult');
        analysisResult.textContent = "正在分析中...";
        // 恢复默认的占位样式
        analysisResult.className = "space-y-4 text-stone-500 italic";
    },

    /**
     * 在结果区域显示错误信息
     * @param {Error} error 
     */
    showError(error) {
        const analysisResult = document.getElementById('analysisResult');
        analysisResult.innerHTML = `<span class="text-red-500 font-bold">请求失败：${error.message} (请检查后端服务是否已启动)</span>`;
    },

    /**
     * 渲染后端返回的分析结果
     * @param {Object} result - 后端 API 返回的数据
     * @param {string} originalName - 用户填写的原名
     */
    renderResult(result, originalName) {
        const analysisResult = document.getElementById('analysisResult');
        analysisResult.innerHTML = ''; 
        analysisResult.className = "space-y-4 result-container";

        // 创建用于承载比对块的容器
        const nameContainer = document.createElement('div');
        nameContainer.className = 'name-container';
        nameContainer.id = 'pottery-name-container';
        analysisResult.appendChild(nameContainer);

        // 调用内部方法渲染细节
        this._renderComparison(result, nameContainer);
        this._renderSummary(result, originalName, analysisResult);
    },

    /**
     * 私有方法：渲染每个属性的比对块 (采用两行网格布局)
     */
    _renderComparison(apiData, container) {
        const orderedKeys = ['era', 'culture', 'pattern', 'material', 'shape', 'shape_type'];
        const labelMapping = {
            "era": "年代",
            "culture": "文化",
            "pattern": "纹饰",
            "material": "材质",
            "shape": "外形",
            "shape_type": "器型"
        };

        const gridContainer = document.createElement('div');
        gridContainer.className = 'comparison-grid';

        // 1. 表头行 (左上角留空 + 6个属性标签)
        gridContainer.appendChild(this._createGridCell('header', ''));
        orderedKeys.forEach(key => {
            gridContainer.appendChild(this._createGridCell('header', labelMapping[key]));
        });

        // 2. 原名行
        gridContainer.appendChild(this._createGridCell('row-label', '原名'));
        orderedKeys.forEach(key => {
            const item = apiData[key];
            const cell = this._createGridCell('original', this._getOriginalBoxHtml(item));
            gridContainer.appendChild(cell);
        });

        // 3. 推荐命名行
        gridContainer.appendChild(this._createGridCell('row-label', '推荐命名'));
        orderedKeys.forEach(key => {
            const item = apiData[key];
            const cell = this._createGridCell('new', this._getNewBoxHtml(item));
            gridContainer.appendChild(cell);
        });

        container.appendChild(gridContainer);
    },

    _createGridCell(type, content) {
        const div = document.createElement('div');
        div.className = `grid-cell cell-${type}`;
        if (typeof content === 'string') {
            div.innerHTML = content;
        } else if (content) {
            div.appendChild(content);
        }
        return div;
    },

    _getOriginalBoxHtml(item) {
        // 如果后端漏掉某些字段，给一个默认的空对象兜底
        if (!item) return `<div class="element-value-box state-empty">—</div>`;

        let valueHtml = '';
        let stateClass = '';
        const emptySymbol = '—'; // 横线代表空缺

        switch (item.type) {
            case 'MATCH':
                stateClass = 'state-match-top';
                valueHtml = item.origin;
                break;
            case 'MISMATCH':
                stateClass = 'state-mismatch-top';
                valueHtml = item.origin;
                break;
            case 'UNVERIFIED':
                stateClass = 'state-unverified-top';
                valueHtml = item.origin;
                break;
            case 'ADDED':
                stateClass = 'state-empty';
                valueHtml = emptySymbol;
                break;
            case 'EMPTY':
            default:
                stateClass = 'state-empty';
                valueHtml = emptySymbol;
                break;
        }
        return `<div class="element-value-box ${stateClass}">${valueHtml}</div>`;
    },

    _getNewBoxHtml(item) {
        if (!item) return `<div class="element-value-box state-empty">—</div>`;

        let valueHtml = '';
        let stateClass = '';
        const emptySymbol = '—'; // 横线代表空缺

        switch (item.type) {
            case 'MATCH':
                stateClass = 'state-match-bottom';
                valueHtml = item.new;
                break;
            case 'MISMATCH':
                stateClass = 'state-mismatch-bottom';
                valueHtml = item.new;
                break;
            case 'UNVERIFIED':
                stateClass = 'state-unverified-bottom'; // 沿用
                valueHtml = item.origin; // 要求显示原名
                break;
            case 'ADDED':
                stateClass = 'state-added-bottom';
                valueHtml = item.new;
                break;
            case 'EMPTY':
            default:
                stateClass = 'state-empty';
                valueHtml = emptySymbol;
                break;
        }
        return `<div class="element-value-box ${stateClass}">${valueHtml}</div>`;
    },

    /**
     * 私有方法：渲染底部总结区域 (原名 vs 系统命名)
     */
    _renderSummary(result, originalName, container) {
        const orderedKeys = ['era', 'culture', 'pattern', 'material', 'shape', 'shape_type'];
        const systemParts = orderedKeys
            .map((key) => result[key]?.new || result[key]?.origin)
            .filter((value) => value && String(value).trim());
        const systemName = systemParts.length ? systemParts.join('') : '（空）';

        const summary = document.createElement('div');
        summary.className = 'name-summary';
        summary.innerHTML = `
            <div class="element-box">
                <span class="element-label">原名</span>
                <div class="element-value-box state-empty">${originalName || '（空）'}</div>
            </div>
            <div class="name-arrow">➔</div>
            <div class="element-box">
                <span class="element-label">推荐命名</span>
                <div class="element-value-box state-match">${systemName}</div>
            </div>
        `;
        container.appendChild(summary);
    }
};
