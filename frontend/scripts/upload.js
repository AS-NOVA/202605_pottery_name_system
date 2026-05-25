document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('imageInput');
  if (!fileInput) return;

  fileInput.addEventListener('change', function () {
    const files = Array.from(this.files);
    if (files.length === 0) return;

    if (!ui.selectedFiles) {
        ui.selectedFiles = [];
    }

    files.forEach(file => {
        // 防止用户上传完全重复的文件 (比对文件名和文件大小)
        const isDuplicate = ui.selectedFiles.some(
            existing => existing.name === file.name && existing.size === file.size
        );
        if (!isDuplicate) {
            ui.selectedFiles.push(file);
        }
    });

    // 关键：清空 fileInput.value，让用户下次即使选择同一个文件也能触发 change 事件
    fileInput.value = '';

    // 更新前端图片网格预览
    ui.updateImagePreviews();
  });
});