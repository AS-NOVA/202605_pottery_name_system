// ui.js - 专门负责 DOM 操作和页面渲染逻辑

const ui = {
    // 全局已选择的图片文件数组
    selectedFiles: [],

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
        
        // 遍历所有选中的多图并添加到 Form 数据中 (多值同键 'images')
        if (this.selectedFiles && this.selectedFiles.length > 0) {
            this.selectedFiles.forEach(file => {
                formData.append('images', file);
            });
        }
        return formData;
    },

    /**
     * 更新图片预览缩略图网格
     */
    updateImagePreviews() {
        const previewGrid = document.getElementById('previewGrid');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const uploadBox = document.getElementById('uploadBox');
        if (!previewGrid) return;
        
        previewGrid.innerHTML = '';
        
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            if (uploadPlaceholder) {
                uploadPlaceholder.textContent = '📷 点击上传图片 (支持多张，可多次上传)';
                uploadPlaceholder.classList.remove('hidden');
            }
            if (uploadBox) uploadBox.classList.remove('has-image');
            return;
        }
        
        if (uploadPlaceholder) {
            uploadPlaceholder.textContent = '📷 继续添加图片...';
            uploadPlaceholder.classList.remove('hidden'); // 决不隐藏，而是切换为紧凑文案
        }
        if (uploadBox) uploadBox.classList.add('has-image');
        
        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            
            // 创建容器（比例为 1:1，隐藏溢出，有微阴影）
            const container = document.createElement('div');
            container.className = 'relative group border border-stone-200 bg-stone-50 p-1 flex justify-center items-center overflow-hidden transition-all';
            container.style.aspectRatio = '1/1';
            
            // 预览图片
            const img = document.createElement('img');
            img.className = 'w-full h-full object-contain';
            img.alt = file.name;
            
            // 独立删除按钮
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shadow-md transition-colors';
            removeBtn.innerHTML = '×';
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectedFiles.splice(index, 1);
                this.updateImagePreviews();
            });
            
            container.appendChild(img);
            container.appendChild(removeBtn);
            previewGrid.appendChild(container);
            
            reader.onload = function (e) {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
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
        
        // 重置多图缓存列表
        this.selectedFiles = [];
        this.updateImagePreviews();

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
     * 将获取到的后端测试示例数据回填表单
     */
    loadExampleData(data) {
        document.getElementById('originalName').value = data.original_name || '';
        document.getElementById('eraInput').value = data.era || '';
        document.getElementById('cultureInput').value = data.culture || '';
        document.getElementById('description').value = data.description || '';
        
        if (data.image_base64) {
            try {
                const file = this._dataURLtoFile(data.image_base64, data.image_filename || 'b1p22.png');
                this.selectedFiles = [file];
                this.updateImagePreviews();
            } catch (e) {
                console.error("还原物理示例图片失败:", e);
            }
        }
    },

    /**
     * 辅助工具：将 Base64 dataURL 还原为标准的 HTML5 File 对象
     */
    _dataURLtoFile(dataurl, filename) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
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
        const sourceTextAttr = `data-source-text="${sourceText || ''}"`;

        return `
            <div class="element-value-box ${stateClass} cursor-pointer hover:shadow-md transition-shadow" ${sourceAttr} ${sourceTextAttr}>
                ${valueHtml}
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
     * 绑定悬浮高亮事件与全局视口 Fixed 悬浮窗定位
     */
    _bindHoverHighlights() {
        // 1. 确保全局唯一定位的悬浮窗 DOM 挂载在 body 根节点，以彻底突破局部 overflow 裁剪和滚动条限制
        let globalTooltip = document.getElementById('global-tooltip');
        if (!globalTooltip) {
            globalTooltip = document.createElement('div');
            globalTooltip.id = 'global-tooltip';
            // 设置 position: fixed, z-50 极高层级, 经典的 stone-800 极简灰黑色背景和圆角细阴影
            globalTooltip.className = 'fixed hidden bg-stone-800 text-white text-xs px-3 py-2 rounded-md shadow-lg z-50 w-max max-w-[220px] whitespace-normal pointer-events-none transition-opacity duration-150';
            
            // 向上指的小三角形，位于悬浮窗顶部中央
            const arrow = document.createElement('div');
            arrow.className = 'absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-stone-800';
            
            const content = document.createElement('div');
            content.id = 'global-tooltip-content';
            
            globalTooltip.appendChild(arrow);
            globalTooltip.appendChild(content);
            document.body.appendChild(globalTooltip);
        }

        const elements = document.querySelectorAll('.element-value-box[data-source]');
        elements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                const source = el.getAttribute('data-source');
                const sourceText = el.getAttribute('data-source-text');
                
                // 2. 触发关联输入框的高亮逻辑
                let targetInput = null;
                if (source === '文字描述') {
                    targetInput = document.getElementById('description');
                    if (targetInput && sourceText && sourceText !== 'null') {
                        const val = targetInput.value;
                        const idx = val.indexOf(sourceText);
                        if (idx !== -1) {
                            targetInput.focus();
                            targetInput.setSelectionRange(idx, idx + sourceText.length);
                        }
                    }
                } else if (source === '结构化输入') {
                    const eraVal = document.getElementById('eraInput').value;
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

                // 3. 渲染全局悬浮窗内容
                const contentDiv = globalTooltip.querySelector('#global-tooltip-content');
                contentDiv.innerHTML = `
                    <p class="font-bold border-b border-stone-600 pb-1 mb-1">来源: ${source}</p>
                    ${sourceText && sourceText !== 'null' && sourceText !== 'undefined' ? `<p class="text-stone-300">"${sourceText}"</p>` : ''}
                `;

                // 4. 显式化展现以准确获取渲染宽高度
                globalTooltip.classList.remove('hidden');

                // 5. 动态计算视口坐标：定位到被触发要素的“正下方”
                const rect = el.getBoundingClientRect();
                const tooltipRect = globalTooltip.getBoundingClientRect();
                
                // 水平居中定位，垂直紧贴要素下边距外加 8px 间隙
                let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                const top = rect.bottom + 8;

                // 6. 视口边缘溢出守护策略：保证弹出框永远在屏幕左右边界内完整显现
                const safetyPadding = 10;
                if (left < safetyPadding) {
                    left = safetyPadding;
                } else if (left + tooltipRect.width > window.innerWidth - safetyPadding) {
                    left = window.innerWidth - tooltipRect.width - safetyPadding;
                }

                globalTooltip.style.left = `${left}px`;
                globalTooltip.style.top = `${top}px`;
            });

            el.addEventListener('mouseleave', () => {
                // 恢复关联输入框状态
                if (el._targetInput) {
                    el._targetInput.classList.remove('ring-4', 'ring-orange-500', 'transition-all', 'z-10', 'relative');
                    if (el._targetInput.id === 'description' || el._targetInput.id === 'originalName') {
                        el._targetInput.blur();
                    }
                    el._targetInput = null;
                }

                // 隐藏全局悬浮窗
                globalTooltip.classList.add('hidden');
            });
        });
    }
};
