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
     * 在结果区域显示加载状态，不覆盖现有结果
     */
    showLoading(text = "正在分析中...") {
        let loadingIndicator = document.getElementById('loadingIndicator');
        const analysisResult = document.getElementById('analysisResult');

        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loadingIndicator';
            loadingIndicator.className = 'text-orange-600 font-medium italic mt-4';
            analysisResult.appendChild(loadingIndicator);
        }
        loadingIndicator.textContent = text;
    },

    hideLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    },

    clearUI() {
        // 重置左侧表单
        document.getElementById('potteryForm').reset();
        
        // 重置图片预览
        const previewImage = document.getElementById('previewImage');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        previewImage.classList.add('hidden');
        previewImage.src = '';
        uploadPlaceholder.classList.remove('hidden');

        // 重置右侧视图
        const analysisResult = document.getElementById('analysisResult');
        Array.from(analysisResult.children).forEach(child => {
            if (child.id !== 'welcomePlaceholder') {
                child.remove();
            }
        });
        
        const welcome = document.getElementById('welcomePlaceholder');
        if (welcome) welcome.classList.remove('hidden');
        
        analysisResult.className = "space-y-4";
    },

    /**
     * 在结果区域显示错误信息
     * @param {Error} error 
     */
    showError(error) {
        const analysisResult = document.getElementById('analysisResult');
        
        const welcome = document.getElementById('welcomePlaceholder');
        if (welcome) welcome.classList.add('hidden');

        Array.from(analysisResult.children).forEach(child => {
            if (child.id !== 'welcomePlaceholder') {
                child.remove();
            }
        });

        const errorSpan = document.createElement('span');
        errorSpan.className = 'text-red-500 font-bold block mt-4';
        errorSpan.textContent = `请求失败：${error.message} (请检查后端服务是否已启动)`;
        analysisResult.appendChild(errorSpan);
    },

    /**
     * 渲染后端返回的分析结果
     * @param {Object} result - 后端 API 返回的数据
     * @param {string} originalName - 用户填写的原名
     */
    renderResult(result, originalName) {
        const analysisResult = document.getElementById('analysisResult');
        
        const welcome = document.getElementById('welcomePlaceholder');
        if (welcome) welcome.classList.add('hidden');

        Array.from(analysisResult.children).forEach(child => {
            if (child.id !== 'welcomePlaceholder') {
                child.remove();
            }
        });

        analysisResult.className = "space-y-4 result-container";

        // 前端计算状态类型
        const orderedKeys = ['era', 'culture', 'pattern', 'material', 'shape', 'shape_type'];
        orderedKeys.forEach(key => {
            const origin_value = result[key]?.origin;
            const new_obj = result[key]?.new;
            const new_value = new_obj ? new_obj.value : null;

            let status = 'EMPTY';
            if (origin_value && new_value) {
                status = (origin_value === new_value) ? 'MATCH' : 'MISMATCH';
            } else if (origin_value && !new_value) {
                status = 'UNVERIFIED';
            } else if (!origin_value && new_value) {
                status = 'ADDED';
            } else {
                status = 'EMPTY';
            }
            if (!result[key]) {
                result[key] = { origin: origin_value, new: new_obj };
            }
            result[key].type = status;
        });

        // 创建用于承载比全面块的容器
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
        this._bindHoverHighlights();
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
        const newValue = item.new?.value || '';
        let source = item.new?.source || '';
        let sourceText = item.new?.source_text || '';

        switch (item.type) {
            case 'MATCH':
                stateClass = 'state-match-bottom';
                valueHtml = newValue;
                // 现名与原名相同时，追加原参考名的溯源
                source = source ? `${source} / 原参考名` : '原参考名';
                sourceText = item.origin;
                break;
            case 'MISMATCH':
                stateClass = 'state-mismatch-bottom';
                valueHtml = newValue;
                break;
            case 'UNVERIFIED':
                stateClass = 'state-unverified-bottom'; // 沿用
                valueHtml = item.origin; // 要求显示原名
                source = '原参考名';
                sourceText = item.origin;
                break;
            case 'ADDED':
                stateClass = 'state-added-bottom';
                valueHtml = newValue;
                break;
            case 'EMPTY':
            default:
                stateClass = 'state-empty';
                valueHtml = emptySymbol;
                break;
        }

        if (item.type === 'EMPTY' || !source) {
            return `<div class="element-value-box ${stateClass}">${valueHtml}</div>`;
        }

        const sourceAttr = `data-source="${source}"`;
        const sourceTextAttr = `data-source-text="${sourceText}"`;

        return `
            <div class="element-value-box ${stateClass} group relative cursor-pointer hover:shadow-md transition-shadow" ${sourceAttr} ${sourceTextAttr}>
                ${valueHtml}
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-stone-800 text-white text-xs px-3 py-2 rounded-md shadow-lg w-max max-w-[200px] whitespace-normal z-10 pointer-events-none">
                    <p class="font-bold border-b border-stone-600 pb-1 mb-1">来源: ${source}</p>
                    ${sourceText && sourceText !== 'null' ? `<p class="text-stone-300">"${sourceText}"</p>` : ''}
                    <!-- 小三角形 -->
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800"></div>
                </div>
            </div>
        `;
    },

    /**
     * 私有方法：渲染底部总结区域 (原名 vs 系统命名)
     */
    _renderSummary(result, originalName, container) {
        const orderedKeys = ['era', 'culture', 'pattern', 'material', 'shape', 'shape_type'];
        const systemParts = orderedKeys
            .map((key) => result[key]?.new?.value || result[key]?.origin)
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
    },

    /**
     * 绑定悬浮高亮事件
     */
    _bindHoverHighlights() {
        const elements = document.querySelectorAll('.element-value-box[data-source]');
        elements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                const source = el.getAttribute('data-source');
                const sourceText = el.getAttribute('data-source-text');
                
                let targetInput = null;
                if (source === '文字描述') {
                    targetInput = document.getElementById('description');
                    // 如果有 sourceText，尝试在 textarea 内高亮文本
                    if (targetInput && sourceText && sourceText !== 'null') {
                        const val = targetInput.value;
                        const idx = val.indexOf(sourceText);
                        if (idx !== -1) {
                            targetInput.focus();
                            targetInput.setSelectionRange(idx, idx + sourceText.length);
                        }
                    }
                } else if (source === '结构化输入') {
                    // 获取是年代还是文化，这个可能需要依赖 key，我们可以根据文字内容来判断，
                    // 或者更好的做法是给 DOM 也绑定 data-key，但现在简单地根据值去两个 input 里找
                    const eraVal = document.getElementById('eraInput').value;
                    const cultureVal = document.getElementById('cultureInput').value;
                    const elValue = el.textContent.trim();
                    if (elValue === eraVal) targetInput = document.getElementById('eraInput');
                    else targetInput = document.getElementById('cultureInput');
                } else if (source.includes('原参考名')) {
                    targetInput = document.getElementById('originalName');
                    if (targetInput && sourceText && sourceText !== 'null') {
                        const val = targetInput.value;
                        const idx = val.indexOf(sourceText);
                        if (idx !== -1) {
                            targetInput.focus();
                            targetInput.setSelectionRange(idx, idx + sourceText.length);
                        }
                    }
                } else if (source === '图片上传') {
                    targetInput = document.getElementById('uploadBox');
                }

                if (targetInput) {
                    targetInput.classList.add('ring-4', 'ring-orange-500', 'transition-all', 'z-10', 'relative');
                    el._targetInput = targetInput;
                }
            });

            el.addEventListener('mouseleave', () => {
                if (el._targetInput) {
                    el._targetInput.classList.remove('ring-4', 'ring-orange-500', 'transition-all', 'z-10', 'relative');
                    // 如果是 description 或 originalName，移除高亮（失焦即可）
                    if (el._targetInput.id === 'description' || el._targetInput.id === 'originalName') {
                        el._targetInput.blur();
                    }
                    el._targetInput = null;
                }
            });
        });
    }
};
