  const fileInput = document.getElementById('imageInput');
  const placeholder = document.getElementById('uploadPlaceholder');
  const preview = document.getElementById('previewImage');
  const uploadBox = document.getElementById('uploadBox');

  fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      // 显示图片，隐藏占位文字
      preview.classList.remove('hidden');
      placeholder.classList.add('hidden');
      uploadBox.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  });