document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const imageInput = document.getElementById('image-input');
    const image = document.getElementById('image');
    const editorContainer = document.getElementById('editor-container');
    const cropBtn = document.getElementById('crop-btn');
    const resetBtn = document.getElementById('reset-btn');
    const aspectRatioSelect = document.getElementById('aspect-ratio');
    const qualityInput = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    const exportBtn = document.getElementById('export-btn');
    const exportZipBtn = document.getElementById('export-zip-btn');
    const resultContainer = document.getElementById('result-container');
    const resultImage = document.getElementById('result');
    const downloadLink = document.getElementById('download-link');
    const imagesPreview = document.getElementById('images-preview');
    const previewContainer = document.getElementById('preview-container');
    
    // Variáveis para armazenar as imagens e dados processados
    let cropper;
    let imageFiles = [];
    let currentImageIndex = -1;
    let processedImages = [];
    
    // Atualizar o valor de qualidade exibido
    qualityInput.addEventListener('input', function() {
        const quality = Math.round(this.value * 100);
        qualityValue.textContent = quality + '%';
    });
    
    // Manipular o upload de múltiplas imagens
    imageInput.addEventListener('change', function(e) {
        const files = e.target.files;
        
        if (files && files.length > 0) {
            // Limpar arrays e containers
            imageFiles = [];
            processedImages = [];
            previewContainer.innerHTML = '';
            
            // Processar cada arquivo
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Verificar se é uma imagem
                if (!file.type.startsWith('image/')) {
                    continue;
                }
                
                // Adicionar ao array de arquivos
                imageFiles.push(file);
                
                // Criar URL para a imagem
                const imageURL = URL.createObjectURL(file);
                
                // Criar elemento de preview
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.dataset.index = imageFiles.length - 1;
                
                const previewImg = document.createElement('img');
                previewImg.src = imageURL;
                previewImg.alt = file.name;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '×';
                removeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(previewItem.dataset.index);
                    removeImage(index);
                });
                
                previewItem.appendChild(previewImg);
                previewItem.appendChild(removeBtn);
                
                // Adicionar evento de clique para selecionar a imagem
                previewItem.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    selectImage(index);
                });
                
                previewContainer.appendChild(previewItem);
            }
            
            // Mostrar a área de preview se houver imagens
            if (imageFiles.length > 0) {
                imagesPreview.style.display = 'block';
                selectImage(0); // Selecionar a primeira imagem
            }
        }
    });
    
    // Função para remover uma imagem
    function removeImage(index) {
        // Remover do array
        imageFiles.splice(index, 1);
        if (processedImages[index]) {
            processedImages.splice(index, 1);
        }
        
        // Reconstruir a área de preview
        previewContainer.innerHTML = '';
        
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const imageURL = URL.createObjectURL(file);
            
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.dataset.index = i;
            
            const previewImg = document.createElement('img');
            previewImg.src = imageURL;
            previewImg.alt = file.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(previewItem.dataset.index);
                removeImage(index);
            });
            
            previewItem.appendChild(previewImg);
            previewItem.appendChild(removeBtn);
            
            previewItem.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                selectImage(index);
            });
            
            previewContainer.appendChild(previewItem);
        }
        
        // Se não houver mais imagens, esconder a área de preview
        if (imageFiles.length === 0) {
            imagesPreview.style.display = 'none';
            editorContainer.style.display = 'none';
            resultContainer.style.display = 'none';
        } else if (currentImageIndex >= imageFiles.length) {
            // Se a imagem atual foi removida, selecionar a última
            selectImage(imageFiles.length - 1);
        } else {
            // Reselecionar a imagem atual
            selectImage(currentImageIndex);
        }
    }
    
    // Função para selecionar uma imagem para edição
    function selectImage(index) {
        if (index < 0 || index >= imageFiles.length) return;
        
        // Atualizar o índice atual
        currentImageIndex = index;
        
        // Atualizar a classe ativa nos itens de preview
        const previewItems = document.querySelectorAll('.image-preview-item');
        previewItems.forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.index) === index) {
                item.classList.add('active');
            }
        });
        
        // Criar URL para a imagem
        const imageURL = URL.createObjectURL(imageFiles[index]);
        
        // Definir a imagem e mostrar o editor
        image.src = imageURL;
        editorContainer.style.display = 'block';
        resultContainer.style.display = 'none';
        
        // Destruir o cropper anterior se existir
        if (cropper) {
            cropper.destroy();
        }
        
        // Inicializar o Cropper quando a imagem for carregada
        image.onload = function() {
            cropper = new Cropper(image, {
                viewMode: 1,
                dragMode: 'move',
                aspectRatio: parseFloat(aspectRatioSelect.value),
                autoCropArea: 0.8,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false
            });
        };
    }
    
    // Alterar a proporção de aspecto
    aspectRatioSelect.addEventListener('change', function() {
        if (cropper) {
            cropper.setAspectRatio(parseFloat(this.value));
        }
    });
    
    // Botão de recorte
    cropBtn.addEventListener('click', function() {
        if (cropper && currentImageIndex >= 0) {
            // Obter a área recortada como Canvas
            const canvas = cropper.getCroppedCanvas({
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });
            
            if (canvas) {
                // Converter para JPEG com a qualidade selecionada
                const quality = parseFloat(qualityInput.value);
                const dataURL = canvas.toDataURL('image/jpeg', quality);
                
                // Salvar a imagem processada
                processedImages[currentImageIndex] = {
                    dataURL: dataURL,
                    filename: imageFiles[currentImageIndex].name.replace(/\.[^\.]+$/, '.jpg')
                };
                
                // Exibir a imagem recortada
                resultImage.src = dataURL;
                downloadLink.href = dataURL;
                downloadLink.download = processedImages[currentImageIndex].filename;
                resultContainer.style.display = 'block';
                
                // Rolar para o resultado
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
    
    // Botão de reset
    resetBtn.addEventListener('click', function() {
        if (cropper) {
            cropper.reset();
        }
    });
    
    // Botão de exportação JPEG
    exportBtn.addEventListener('click', function() {
        if (cropper && currentImageIndex >= 0) {
            // Obter a área recortada como Canvas
            const canvas = cropper.getCroppedCanvas({
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });
            
            if (canvas) {
                // Converter para JPEG com a qualidade selecionada
                const quality = parseFloat(qualityInput.value);
                const dataURL = canvas.toDataURL('image/jpeg', quality);
                
                // Salvar a imagem processada
                processedImages[currentImageIndex] = {
                    dataURL: dataURL,
                    filename: imageFiles[currentImageIndex].name.replace(/\.[^\.]+$/, '.jpg')
                };
                
                // Exibir a imagem recortada
                resultImage.src = dataURL;
                downloadLink.href = dataURL;
                downloadLink.download = processedImages[currentImageIndex].filename;
                resultContainer.style.display = 'block';
                
                // Rolar para o resultado
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
    
    // Botão de exportação ZIP
    exportZipBtn.addEventListener('click', async function() {
        // Verificar se há imagens para processar
        if (imageFiles.length === 0) {
            alert('Selecione pelo menos uma imagem para exportar.');
            return;
        }
        
        // Processar todas as imagens que ainda não foram processadas
        for (let i = 0; i < imageFiles.length; i++) {
            if (!processedImages[i]) {
                // Selecionar a imagem
                selectImage(i);
                
                // Esperar o cropper ser inicializado
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Obter a área recortada como Canvas
                const canvas = cropper.getCroppedCanvas({
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high'
                });
                
                if (canvas) {
                    // Converter para JPEG com a qualidade selecionada
                    const quality = parseFloat(qualityInput.value);
                    const dataURL = canvas.toDataURL('image/jpeg', quality);
                    
                    // Salvar a imagem processada
                    processedImages[i] = {
                        dataURL: dataURL,
                        filename: imageFiles[i].name.replace(/\.[^\.]+$/, '.jpg')
                    };
                }
            }
        }
        
        // Criar o arquivo ZIP
        const zip = new JSZip();
        const imgFolder = zip.folder('imagens_recortadas');
        
        // Adicionar cada imagem processada ao ZIP
        processedImages.forEach((img, index) => {
            if (img && img.dataURL) {
                // Converter o dataURL para blob
                const imageData = img.dataURL.split(',')[1];
                imgFolder.file(img.filename, imageData, {base64: true});
            }
        });
        
        // Gerar o arquivo ZIP
        zip.generateAsync({type: 'blob'}).then(function(content) {
            // Criar um link para download
            const zipUrl = URL.createObjectURL(content);
            const zipLink = document.createElement('a');
            zipLink.href = zipUrl;
            zipLink.download = 'imagens_recortadas.zip';
            zipLink.click();
        });
    });
});