// window.addEventListener('beforeunload', () => {
//     sessionStorage.removeItem('productID')
// })


console.log('access_token: ' + sessionStorage.getItem('access_token'))
console.log('refresh_token: ' + sessionStorage.getItem('refresh_token'))

if(sessionStorage.getItem('product_id')) {
    console.log("Product ID products: " + sessionStorage.getItem('product_id'))
}
else { console.log("Product ID is not available")}


let variantsOfNewProduct = []               // biến lưu các variants được nhập cho product mới 



//----------------------------------------------------------------
// Tải submit button
//----------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("productFormSubmitBtn")

    const variantBtn = document.getElementById('addVariantBtn')

    if (sessionStorage.getItem("product_id") !== 'new_product') {
        btn.setAttribute('data-action', 'updateProduct')
        btn.innerHTML = '<i class="bi bi-floppy"></i><span> Lưu chỉnh sửa</span>'

        variantBtn.onclick = () => {
            addVariant(sessionStorage.getItem("product_id"), true)
        }
    }

    else {
        btn.setAttribute('data-action', 'createProduct')
        btn.innerHTML = '<i class="bi bi-plus"></i><span> Lưu sản phẩm</span>'

        const variant_container = document.getElementById('variantTextBoxContainer')

        const table = document.createElement('table')
        table.innerHTML = `<tbody id="variant_list"></tbody>`
        table.classList.add('table', 'table-bordered', 'border-custom', 'table-responsive')
        
        variant_container.insertAdjacentElement('afterbegin', table)

        variantBtn.onclick = () => {
            createVariantOfNewProduct()
        }
    }
})



//----------------------------------------------------------------
// Tạo slider hiển thị hình ảnh được tải lên của products (có thumbnails)
//----------------------------------------------------------------

let sliderIndex = 0

function plusSlides(n) {
    sliderIndex += n

    showSlides(sliderIndex)
}

function currentSlide(n) {
    sliderIndex = n
    showSlides(sliderIndex)
}

function moveThumbnails(n) {
    const thumbnail_container = document.getElementById('thumbnails')
    thumbnail_container.scrollLeft += n * 100;
}

function scrollThumbnailsToActive() {
    const thumbnails = document.getElementsByClassName("demo")
    const activeThumbnail = document.querySelector(".demo.active")

    if(activeThumbnail) {
        const thumbnail_container = document.getElementById('thumbnails')
        thumbnail_container.scrollLeft = activeThumbnail.offsetLeft - (thumbnail_container.clientWidth / 2) + (activeThumbnail.clientWidth / 2)
    }
}

function showSlides(n) {
    let i
    let slides = document.getElementsByClassName("slider-img")
    let thumbnails = document.getElementsByClassName("demo")
    
    if (n >= slides.length) { sliderIndex = 0 }
    else if (n < 0) { sliderIndex = slides.length - 1 }
    else { sliderIndex = n }

    for (let slide of slides) {
        slide.style.display = "none"
    }

    for (let thumbnail of thumbnails) {
        thumbnail.classList.remove("active")
    }

    slides[sliderIndex].style.display = "block"
    thumbnails[sliderIndex].classList.add("active")

    scrollThumbnailsToActive()
}


function showImageInSlider(imageFiles) {
    const slider = document.getElementById('slider-product-container')
    const thumbnails = document.getElementById('thumbnails')

    document.querySelectorAll('.slider-img').forEach(element => element.remove())

    thumbnails.innerHTML = ''

    const imagesPromise = imageFiles.map(file => {
        return new Promise((resolve) => {
            if(typeof file === 'string') {
                // console.log("Image:", file)
                resolve({src: file})
            }
            else {
                const reader = new FileReader()
                reader.onload = (e) => resolve({src: e.target.result})
                reader.readAsDataURL(file)
            }
        })
    })

    Promise.all(imagesPromise).then(images => {
        images.forEach((src, index) => {
            const img_container = document.createElement('div')
            img_container.classList.add('slider-img')
            slider.insertBefore(img_container, document.getElementById('thumbnail-container'))

            const img_number = document.createElement('div')
            img_number.innerHTML = (index + 1) + '/' + (images.length)
            img_number.classList.add('numberText')
            img_container.appendChild(img_number)

            const img_d = document.createElement('div')
            img_d.classList.add('d-flex', 'justify-content-center', 'align-items-center')
            img_d.style.backgroundColor = 'white;'
            img_container.appendChild(img_d)

            const img = document.createElement('img')
            img.classList.add('product-img')
            img.src = src.src
            img_d.appendChild(img)


            const thumbnail_container = document.createElement('div')
            thumbnail_container.classList.add('column')
            thumbnails.appendChild(thumbnail_container)

            const thumbnail_img = document.createElement('img')
            thumbnail_img.src = src.src
            thumbnail_img.classList.add('demo', 'cursor')
            thumbnail_img.onclick = () => {
                currentSlide(index)
            }
            thumbnail_container.appendChild(thumbnail_img)

            if(index === 0) {
                showSlides(sliderIndex)
            }
        })     
    })
}


document.getElementById('productImages').addEventListener('change', (event) => {

    if(sessionStorage.getItem('productImages')) {
        sessionStorage.removeItem('productImages')
    }
 
    const imageFiles = Array.from(event.target.files)
    if(imageFiles.length === 0)
        return

    showImageInSlider(imageFiles)
})


//----------------------------------------------------------------
// Lấy và hiển thị dữ liệu cho các selector
//----------------------------------------------------------------


function showSelector2(selectorID, placeholder, api) {
    $(selectorID).select2({
        placeholder: placeholder,
        allowClear: true,

        // Cho phép tạo thẻ mới
        tags: true,

    });

    $(selectorID).on("select2:select", function(evt) {

        console.log("Sự kiện đã được gọi")

        // Tạo thẻ mới nếu chưa tồn tại (lưu vào cơ sở dữ liệu)
        handleTagSelect(evt, api, selectorID);
        
        var element = evt.params.data.element;
        var $element = $(element);
        
        $element.detach();
        $(this).append($element);
        $(this).trigger("change");

    })

}


getOptionForSelector('categorySelector', 'http://127.0.0.1:8000/api/products/categories/')

getOptionForSelector('materialSelector', 'http://127.0.0.1:8000/api/products/materials/')

$(document).ready( () => {
    showSelector2('#categorySelector', 'Chọn danh mục sản phẩm', 'http://127.0.0.1:8000/api/products/categories/')
    showSelector2('#materialSelector', 'Chọn chất liệu sản phẩm', 'http://127.0.0.1:8000/api/products/materials/')
})

//----------------------------------------------------------------
// Tạo các textbox để nhập và lưu dữ liệu mới (phân loại, thành phần, tag)
//----------------------------------------------------------------

function handleTagSelect(evt, api, selectorID) {

    if(evt.params && evt.params.data) {
        console.log("Đã kiểm tra evt.params.data: ", evt.params.data)

        // Lấy thẻ mới được chọn
        const selectedTag = evt.params.data.text
        const selectedValue = evt.params.data.id

        // Không cần kiểm tra thẻ mới vì được back-end xử lý
        // Sửa lại sau khi hoàn thành front-end
        // contains() sẽ kiểm tra tương đối (vd: khi có ABCDEF, thì không thể thêm ABCD)
        const listOfAvailableOptions = $(evt.target).find("option:contains('" + selectedTag + "')")

        if((listOfAvailableOptions.length === 1) && (selectedValue === selectedTag)) {
            console.log("Đây là thẻ mới: ", $(listOfAvailableOptions[0]).text())
            showModalToConfirmEvent(
                listOfAvailableOptions,
                api,
                selectedTag,
                selectorID,
                true,
            )
        }

        else if((listOfAvailableOptions.length > 1) && (selectedValue === selectedTag)){
            showModalToConfirmEvent(
                listOfAvailableOptions,
                api,
                selectedTag,
                selectorID,
                false
            )
        }
    }
    else {
        console.log('Invalid event parameters')
    }
}

async function createNewTagSelectInput(api, selectedTag, selectorID) {

    const access_token = await getValidAccessToken()

    fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({name: selectedTag})
    })
    .then(response => {

        // Kiểm tra nếu API response lỗi (HTTP 409 (Conflict) - Thẻ đã tồn tại)
        if(response.status === 409) {
            console.error('Error fetch data:', error)
        }

        $(selectorID).trigger('change')

        return response.json()
    })
    .then(data => {
        console.log("Thêm thẻ mới thành công: ", data)
        
        const newOption = new Option(data.name, data.id)
        console.log("New Option: ", newOption)

        // lấy (danh sách) value (giá trị các option đã chọn) của selector
        let selected = $(selectorID).val()

        // kiểm tra nếu selector là một select multiple (nhiều lựa chọn)
        if($(selectorID).prop('multiple')) {

            // ép kiểu về mảng để tránh trường hợp trình duyệt trả về giá trị khác thay vì mảng
            // nếu val() là null thì gán [] để tránh lỗi
            selected = Array.isArray(selected) ? selected : selected ? [selected] : []

            selected.pop()

            // thêm option value mới vào mảng
            selected.push(newOption.value)
        }

        // nếu selector không phải là select multiple
        else {
            selected = newOption.value
        }

        // cập nhật lại selector với option mới
        $(selectorID).append(newOption).val(selected).trigger('change')

        console.log("Selector value: ", $(selectorID).val())
    })
    .catch(error => console.error('Error fetch data:', error))
}

function showModalToConfirmEvent(listOfAvailableOptions, api, selectedTag, selectorID, unavailableOption) {

    // Chèn option mới được thêm vào warnings
    // Xóa nội dung trước đó
    const newOptions = document.getElementById('new-option')
    newOptions.innerHTML = ''

    const newOption = document.createElement('b')
    newOption.textContent = selectedTag
    
    newOptions.appendChild(newOption)


    // Chèn danh sách option có sẵn tương tự với option mới
    
    const availableOptionContainer = document.getElementById('available-option-container')
    const availableOptions = document.getElementById('available-options')
    availableOptions.innerHTML = ''

    if(unavailableOption) {
        if(availableOptionContainer.style.display != 'none') {
            availableOptionContainer.style.display = 'none'
            // availableOptionContainer.disabled = true
    
        }
    }

    else {
        if(availableOptionContainer.style.display != 'block') {
            // availableOptionContainer.disabled = false
            availableOptionContainer.style.display = 'block'
        }

        $(listOfAvailableOptions).each(function(index, option) {

            if($(option).text() !== selectedTag) {
                const availableOption = document.createElement('span')
    
                if(index != 0) {
                    availableOption.textContent = ", "
                }
    
                availableOption.textContent += $(option).text()
        
                availableOptions.appendChild(availableOption)
            }
        })
    }

    var saveButton = document.getElementById('save-tag-btn')
    saveButton.onclick = function() {
        createNewTagSelectInput(api, selectedTag, selectorID)
        confirmModalForCreateNewTagSelect.hide()
    }

    var cancelButton = document.getElementById('cancel-saving-tag-btn')
    cancelButton.onclick = function() {
        $(selectorID).trigger('change')
        confirmModalForCreateNewTagSelect.hide()
    }

    var confirmModalForCreateNewTagSelect = new bootstrap.Modal(document.getElementById('newTagModal'))

    confirmModalForCreateNewTagSelect.show()
}



//----------------------------------------------------------------
// Lấy thông tin chi tiết của một product (chưa bao gồm thông tin của variant)
//----------------------------------------------------------------

async function getProduct(id) {

    if (sessionStorage.getItem('productID-update')) {
        sessionStorage.setItem('productID', sessionStorage.getItem('productID-update')) 
        sessionStorage.removeItem('productID-update')
    }

    const productID = id ? id : sessionStorage.getItem('product_id')

    if(!productID) {
        alert('Không tìm thấy sản phẩm. Điều này có thể xảy ra khi bạn cố tải lại trang.')
            window.location.href = './admin-product-list.html'
    }
    
    if (productID !== 'new_product') {
        if (productID) {

            const response = await fetch(`http://127.0.0.1:8000/api/products/product_detail/${productID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            const data = await response.json()
            displayProduct(data)
        }
    }
}

function displayProduct(productData) {

    const product = productData.product
    
    document.getElementById('productName').value = product.name

    document.getElementById('categorySelector').value = product.category.id
    $('#categorySelector').trigger('change')

    $('#materialSelector').val(product.materials.map(material => material.id))
    $('#materialSelector').trigger('change')

    document.getElementById('productDescription').value = product.description

    getVariants(product.id)

    const images = productData.images.map(image => image.image_file)
    console.log('Images:', images)
    sessionStorage.setItem('images', true)
    showImageInSlider(images)
}

getProduct()



// ----------------------------------------------------------------
// Kiểm tra input
// ----------------------------------------------------------------

function validateDataFromProductForm() {
    
    if(document.getElementById("productFormSubmitBtn").getAttribute('data-action') === 'createProduct') {
        validateImages()
    }

    validateSelector($('#categorySelector'))
    validateSelector($('#materialSelector'))

    const variantSelector = $('#variantSelector')
    console.log('variantsOfNewProduct.length: ', variantsOfNewProduct.length)
    if (variantsOfNewProduct.length > 0) {
        if(variantSelector.hasClass('is-invalid')) {
            variantSelector.removeClass('is-invalid')
        }
        variantSelector.addClass('is-valid')
        return true
    }
    else {
        if(variantSelector.hasClass('is-valid')) {
            variantSelector.removeClass('is-valid')
        }
        variantSelector.addClass('is-invalid')
        return false
    }
}

function validateImages() {
    const imgInput = document.getElementById('productImages')
    if (imgInput.files.length < 1 && !sessionStorage.getItem('images')) {
        if(imgInput.classList.contains('is-valid')) {
            imgInput.classList.remove('is-valid')
        }
        imgInput.classList.add('is-invalid')
    }

    else {
        if(imgInput.classList.contains('is-invalid')) {
            imgInput.classList.remove('is-invalid')
        }
        imgInput.classList.add('is-valid')
    }
}

document.getElementById('productDescription').addEventListener('input', () => {
    document.getElementById('productDescription').style.height = 'auto'
    document.getElementById('productDescription').style.height = `${document.getElementById('productDescription').scrollHeight}px`
})


document.getElementById('productName').addEventListener('blur', async () => {
    const productName = document.getElementById('productName')

    if(productName.value.trim() === '') {
        productName.classList.add('is-invalid')
    }
    else {
        
        const response = await fetch('http://127.0.0.1:8000/api/products/check_product_name/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({name: productName.value.trim()})
        })

        const data = await response.json()

        console.log(data)

        if (data.exists) {
            if (sessionStorage.getItem('product_id') !== 'new_product') {
                if (productName.value == sessionStorage.getItem('productName')) {
                    if(productName.classList.contains('is-invalid')) {
                        productName.classList.remove('is-invalid')
                    }
                    productName.classList.add('is-valid')
                }
            }
            
            else {
                if(productName.classList.contains('is-valid')) {
                    productName.classList.remove('is-valid')
                }
                productName.classList.add('is-invalid')
                productName.nextElementSibling.innerHTML = 'Sản phẩm đã tồn tại'
            }
        }

        else {
            if(productName.classList.contains('is-invalid')) {
                productName.classList.remove('is-invalid')
            }
            productName.classList.add('is-valid')
        }
    }
})



// ----------------------------------------------------------------
// Thao tác trên product
// ----------------------------------------------------------------

// Lấy thông tin sản phẩm
function getDataFromProductForm(update=null) {

    const product = {
        name: (document.getElementById('productName').value).trim(),
        category_id: parseInt($('#categorySelector').val()),
        material_ids: $('#materialSelector').val().map(id => parseInt(id)),
        description: (document.getElementById('productDescription').value).trim(),
    }

    const data = new FormData()

    data.append("product", JSON.stringify(product))

    if (!update) {
        const variant_array = []

        const variants = document.querySelectorAll(".variant-row")

        if(variants) {

            Array.from(variants).forEach(variant => {

                const variant_data = {
                    name: variant.querySelector('[name="variantName"]').value.trim(),
                    items: []
                }

                const items = variant.querySelectorAll('.item-row')
                Array.from(items).forEach(item => {
                    console.log(item)
                    const item_data = {
                        name: item.querySelector('[name="itemName"]').value.trim(),
                        length: parseFloat(item.querySelector('[name="itemLength"]').value),
                        width: parseFloat(item.querySelector('[name="itemWidth"]').value),
                        height: parseFloat(item.querySelector('[name="itemHeight"]').value),
                        weights: parseFloat(item.querySelector('[name="itemWeights"]').value),
                        quantity: parseInt(item.querySelector('[name="itemQuantity"]').value)
                    }
                    variant_data.items.push(item_data)
                })

                variant_array.push(variant_data)
            })
        }

        data.append("variants", JSON.stringify(variant_array))
    }

    Array.from(document.getElementById('productImages').files).forEach(file => {
        data.append('images', file)
    })

    return data
}


// Tạo sản phẩm mới
async function createProduct() {
    
    const access_token = await getValidAccessToken()
    const data = getDataFromProductForm()

    console.log('Dữ liệu form:', data)

    fetch('http://127.0.0.1:8000/api/products/product_detail/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`
        },
        body: data
        
        // Vì có dữ liệu media (hình ảnh) nên không chuyển dữ liệu về dạng json (sẽ gây lỗi)
        // Không cần content-type ở headers
    })
   .then(response => {
        if (response.ok) {
            return response.json()
        } else {
            throw new Error('HTTP error! status: ', response.status)
        }
   })
   .then (productData => {
        alert('Sản phẩm mới đã tạo thành công!')
        console.log(productData)
        sessionStorage.setItem('productID', productData.id)
        sessionStorage.setItem('productName', productData.name)
        // window.location.href = `./admin-products.html?name=${productData.name}`
        window.location.reload()
    })
    .catch(error => console.error('Error:', error))
}


// Cập nhật sản phẩm
async function updateProduct() {

    const access_token = await getValidAccessToken()
    const data = getDataFromProductForm(true)
    console.log('Dữ liệu form:', data)
    console.log('Product:', data.product)
    console.log('Image:', data.images)

    const productID = sessionStorage.getItem('product_id')

    if(!productID) {
        console.error('Product ID does not exist')
        return
    }

    fetch(`http://127.0.0.1:8000/api/products/product_detail/${productID}/`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${access_token}`,
        },
        body: data
    })
    .then(response => {
        if (response.ok) {
            return response.json()
        } else {
            console.error('API response failed: ', error)
        }
    })
    .then(product => {
        console.log("Update:", product)
        sessionStorage.setItem('productID-update', product.id)
        sessionStorage.setItem('productName', product.name)
        alert('Sản phẩm đã cập nhật thành công!')
        window.location.reload()
    })
    .catch(error => console.error('Error:', error))
}


validateForm(document.getElementById('productForm'), validateDataFromProductForm, submitProductForm)

function submitProductForm() {

    const action = document.getElementById('productFormSubmitBtn').getAttribute('data-action')
    
    if(action === 'updateProduct') {
        updateProduct()
        console.log('update success');
    }

    else if (action === 'createProduct') {
        createProduct()
        console.log('create success');
    }
};


//----------------------------------------------------------------
// Tạo variants
//----------------------------------------------------------------

// Tạo variants cho product mới
function createVariantOfNewProduct() {
    const variant_container = document.getElementById('variant_list')

    const row = document.createElement('tr')

    row.classList.add('variant-row')

    row.innerHTML = `
        <td class="d-flex flex-column gap-3">
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-warning" onclick="deleteParentOfBtn(this)">
                    <i class="bi bi-trash"></i>
                    Xóa phân loại
                </button>
            </div>
            <div>
                <label for="variantName" class="form-label">Tên phân loại</label>
                <input type="text" name="variantName" class="form-control" placeholder="Nhập tên phân loại..." required>
                <div class="invalid-feedback"></div>
            </div>
            <table class="table table-bordered table-responsive">
                <tbody class="item_container">
                    
                </tbody>
            </table>

            <div class="text-center">
                <button type="button" id="addItem" class="btn btn-primary">
                    <b><i class="bi bi-plus"></i> Thêm chi tiết</b>
                </button>
            </div>
        </td>
    `

    row.querySelector('#addItem').onclick = () => {
        addItemForVariant(row)
    }

    variant_container.appendChild(row)

    addItemForVariant(row)
}

// Thêm chi tiết cho phân loại
function addItemForVariant(parent=null) {
    const item_container = parent ? parent.querySelector('.item_container') : document.querySelector('.item_container')

    const row = document.createElement('tr')

    row.classList.add('item-row')

    row.innerHTML = `
        <td>
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-warning" onclick="deleteParentOfBtn(this)">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            <div>
                <label for="itemName" class="form-label">Tên chi tiết:</label>
                <input type="text" name="itemName" class="form-control" placeholder="Nhập tên chi tiết..." required>
                <div class="invalid-feedback"></div>
            </div>
            <div class="d-flex gap-4 align-items-center flex-wrap w-100">
                <div>
                    <label for="itemLength" class="form-label w-100">Chiều dài (kích thước dài nhất - cm):</label>
                    <input type="number" name="itemLength" class="form-control" placeholder="Nhập chiều dài chi tiết..." step="0.1" required>
                    <div class="invalid-feedback"></div>
                </div>
                <div>
                    <label for="itemLength" class="form-label w-100">Chiều cao (kích thước ngắn nhất - cm):</label>
                    <input type="number" name="itemHeight" class="form-control" placeholder="Nhập chiều cao chi tiết..." step="0.1" required>
                    <div class="invalid-feedback"></div>
                </div>
                <div>
                    <label for="itemWidth" class="form-label w-100">Chiều rộng (cm):</label>
                    <input type="number" name="itemWidth" class="form-control" placeholder="Nhập chiều rộng chi tiết..." step="0.1" required>
                    <div class="invalid-feedback"></div>
                </div>
            </div>
            <div class="d-flex gap-4 align-items-center flex-wrap">
                <div>
                    <label for="itemWeights" class="form-label w-100">Trọng lượng (gram):</label>
                    <input type="number" name="itemWeights" class="form-control" placeholder="Nhập trọng lượng chi tiết..." step="0.1" required>
                    <div class="invalid-feedback"></div>
                </div>
                <div>
                    <label for="itemQuantity" class="form-label w-100">Nhập số lượng chi tiết:</label>
                    <input type="number" name="itemQuantity" class="form-control" placeholder="Nhập số lượng item..." step="1" min="1" required>
                    <div class="invalid-feedback"></div>
                </div>
            </div>
        </td>
    `

    item_container.appendChild(row)
}


// Tạo variants cho product đã có trước đó
function createVariantBtn(variant) {

    if (document.getElementById('variantTextBoxContainer')) {
        const variantBtn = document.createElement('button')

        variantBtn.classList.add('btn', 'btn-secondary');
        variantBtn.innerHTML = variant.name;
        variantBtn.dataset.id = variant.id;
        variantBtn.onclick = function (event) {
            getVariantDetails(event, this.dataset.id)
        }

        const addBtn = document.getElementById('addVariantBtn')
        if(addBtn) {
            document.getElementById('variantTextBoxContainer').insertBefore(variantBtn, addBtn)
        }
    }
}



//----------------------------------------------------------------
// Hiển thị chi tiết variant (sidebar)
//----------------------------------------------------------------

function toggleVariantSidebar() {
    document.getElementById('variantSidebar').classList.toggle('show');
    document.getElementById('productFormSubmitBtn').classList.toggle('hidden');
}

// document.addEventListener('keydown', (event) => {
//     if (event.key === 'Escape') {
//         if (!document.querySelector('.modal.show')) {
//             document.getElementById('variantSidebar').classList.remove('show');
//             document.getElementById('productFormSubmitBtn').classList.remove('hidden');
//         }
//     }
// })

// document.addEventListener('keydown', (event) => {
//     if (event.key === 'Escape') {
//         const openModal = document.querySelector('.modal.show'); // Kiểm tra modal mở

//         if (openModal) {
//             // Nếu modal mở, đóng modal trước
//             event.stopPropagation();
//             return
//         } else {
//             // Nếu không có modal nào mở, đóng sidebar
//             document.getElementById('variantSidebar').classList.remove('show');
//             document.getElementById('productFormSubmitBtn').classList.remove('hidden');
//         }
//     }
// });

function scrollToTop() {
    document.getElementById('variantSidebar').scrollTop = 0;
}

function getVariantDetails(event, id) {

    event.preventDefault()

    if(id) {
        fetch(`http://127.0.0.1:8000/api/products/variant_detail/${id}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
       .then(response => response.json())
       .then(data => {  
            console.log(data)
            displayVariantDetails(data)
       })
       .catch(error => console.error('Error fetch data:', error))
    }
}

function displayVariantDetails(variant) {


    // đặt hành động thêm chi tiết mới
    document.getElementById('addNewItemBtn').addEventListener('click', () => {
        showItemModal(null, null, variant.id)
    })

    // lấy modal
    const variantModal = document.getElementById('variantSidebar')

    // hiển thị tên của variant
    document.getElementById('variantNameSpan').innerHTML = variant.name

    // Hiển thị chi tiết
    const itemList = document.getElementById('variantItemList')
    itemList.innerHTML = ''
    variant.items.forEach(item => {
        const row = document.createElement('tr')

        row.innerHTML = `
            <td class="text-center align-middle">${item.id}</td>
            <td class="text-center align-middle">${item.name}</td>
            <td class="text-center align-middle">${item.length}</td>
            <td class="text-center align-middle">${item.height}</td>
            <td class="text-center align-middle">${item.width}</td>
            <td class="text-center align-middle">${item.weights}</td>
            <td class="text-center align-middle">${item.quantity}</td>
            <td class="text-center align-middle">
                <button class="btn btn-warning btn-edit">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
            <td class="text-center align-middle">
                <button class="btn btn-warning btn-delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `

        itemList.appendChild(row)

        row.querySelector('.btn-edit').onclick = () => {
            showItemModal(item, row, variant.id)
        }

        row.querySelector('.btn-delete').onclick = () => {

            const deleteItemModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteItemModal'))

            document.getElementById('deleteItemMessage').innerHTML =   `
                <span>Bạn có chắc chắn xóa chi tiết</span>
                <b>${item.name}</b>
                <span>không?</span>
            `
            document.getElementById('deleteItemBtn').onclick = () => {
                deleteVariantItem(item.id, row)
                deleteItemModal.hide()
            }
            
            deleteItemModal.show()
        }
    })

    let sumStock = 0

    // hiển thị hàng tồn theo lô
    const stockTable = document.getElementById('stockList')
    stockTable.innerHTML = '';

    variant.stocks.forEach(stock => {
        const row = document.createElement('tr');
        
        row.onclick = () => {
            navigateToBatchDetail(stock.batch.id, stock.batch.batch_number)
        }

        row.innerHTML = `
            <td class="text-center">${stock.batch.id}</td>
            <td class="text-center">${stock.batch.batch_number}</td>
            <td class="text-center">${stock.batch.origin}</td>
            <td class="text-center">${stock.batch.imported_at}</td>
            <td class="text-center">${stock.stock}</td>
        `;
        stockTable.appendChild(row);
        sumStock += parseInt(stock.stock) || 0
    })

    document.getElementById('variantStockSpan').innerHTML = sumStock

    let nowPrice = null
    document.getElementById('variantPriceSpan').innerHTML = 0
    // hiển thị giá bán
    const priceTable = document.getElementById('priceList')
    priceTable.innerHTML = ''

    if (variant.prices.length > 0) {
        variant.prices.forEach(price => {
            const row = document.createElement('tr');
    
            const formattedPrice = formatPrice(parseFloat(price.price))
    
            const startDateTime = formatISODate(price.start_date)
            const endDateTime = formatISODate(price.end_date)
    
            row.setAttribute('data-id', price.id)
    
            row.innerHTML = `
                <td class="text-center">${price.id}</td>
                <td class="text-center">${startDateTime}</td>
                <td class="text-center">${endDateTime}</td>
                <td class="text-center">${formattedPrice}</td>
                <td class="text-center">
                    <button onclick="editPrice(${price.id})" type="button" class="btn btn-edit" data-bs-toggle="tooltip" data-bs-placeme="bottom" data-bs-title="Chỉnh sửa">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                </td>
            `;
            priceTable.appendChild(row);
    
            if (nowPrice === null) {
                nowPrice = price
            }
    
            else {
                if (new Date(price.start_date) <= new Date() && (price.end_date === null || new Date(price.end_date) >= new Date())) {
                    nowPrice = price
                }
                else {
                    if (new Date(nowPrice.end_date) <= new Date(price.end_date)) {
                        nowPrice = price
                    }
                }
            }
        })
    
        document.getElementById('variantPriceSpan').innerHTML = formatPrice(nowPrice.price);
    }

    sessionStorage.setItem('variantID', variant.id)

    initTooltips()

    toggleVariantSidebar()
}

async function editVariantItem(variant, item, row) {
    const data = await postApiItem('PUT', item, variant)

    if (data) {
        row.cells[0].innerHTML = data.id
        row.cells[1].innerHTML = data.name
        row.cells[2].innerHTML = data.length
        row.cells[3].innerHTML = data.height
        row.cells[4].innerHTML = data.width
        row.cells[5].innerHTML = data.weights
        row.cells[6].innerHTML = data.quantity

        const itemModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('itemModal'))
        itemModal.hide()

        alert('Cập nhật chi tiết sản phẩm thành công!')
    }

    else {
        alert('Cập nhật thông tin sản phẩm thất bại!')
    }
}

async function createVariantItem(variant) {
    const item = await postApiItem('POST', null, variant)
    
    const itemList = document.getElementById('variantItemList')

    const row = document.createElement('tr')

    row.innerHTML = `
        <td class="text-center align-middle">${item.id}</td>
        <td class="text-center align-middle">${item.name}</td>
        <td class="text-center align-middle">${item.length}</td>
        <td class="text-center align-middle">${item.height}</td>
        <td class="text-center align-middle">${item.width}</td>
        <td class="text-center align-middle">${item.weights}</td>
        <td class="text-center align-middle">${item.quantity}</td>
        <td class="text-center align-middle">
            <button class="btn btn-warning btn-edit">
                <i class="bi bi-pencil"></i>
            </button>
        </td>
        <td class="text-center align-middle">
            <button class="btn btn-warning btn-delete">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `

    itemList.appendChild(row)

    row.querySelector('.btn-edit').onclick = () => {
        showItemModal(item, row)
    }

    row.querySelector('.btn-delete').onclick = () => {

        const deleteItemModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteItemModal'))

        document.getElementById('deleteItemMessage').innerHTML =   `
            <span>Bạn có chắc chắn xóa chi tiết</span>
            <b>${item.name}</b>
            <span>không?</span>
        `
        document.getElementById('deleteItemBtn').onclick = () => {
            deleteVariantItem(item.id, row)
            deleteItemModal.hide()
        }
        
        deleteItemModal.show()
    }

    const itemModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('itemModal'))
    itemModal.hide()

    alert("Thêm chi tiết mới thành công.")
}

async function deleteVariantItem(item, row) {
    const data = await deleteItem(item)

    if (data) {
        row.remove()

        alert('Xóa chi tiết sản phẩm thành công!')
    }

    else {
        alert('Xóa sản phẩm thất bại!')
    }
}




// ----------------------------------------------------------------
// Thao tác với item
// ----------------------------------------------------------------


function showItemModal(item=null, row=null, variant=null) {
    const itemModal = document.getElementById('itemModal')

    if (item) {
        document.getElementById('itemName').value = item.name
        document.getElementById('itemLength').value = item.length
        document.getElementById('itemHeight').value = item.height
        document.getElementById('itemWidth').value = item.width
        document.getElementById('itemWeights').value = item.weights
        document.getElementById('itemQuantity').value = item.quantity
    }

    else {
        document.getElementById('itemName').value = ''
        document.getElementById('itemLength').value = ''
        document.getElementById('itemHeight').value = ''
        document.getElementById('itemWidth').value = ''
        document.getElementById('itemWeights').value = ''
        document.getElementById('itemQuantity').value = ''
    }
    
    itemModal.addEventListener('shown.bs.modal', () => {
        if (item) {

            validateForm(document.getElementById('itemForm'), () => {}, () => { editVariantItem (variant, item.id, row) })
        }

        else if (variant) {

            validateForm(document.getElementById('itemForm'), () => {}, () => { createVariantItem(variant) })
        }
    })

    const modal = bootstrap.Modal.getOrCreateInstance(itemModal)
    modal.show()
}


async function deleteItem(item) {
    try {

        const access_token = await getValidAccessToken()

        const response = await fetch(`http://127.0.0.1:8000/api/products/item_detail/${item}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            }
        })

        if (!response.ok) {
            return false
        }

        return true
    }

    catch (error) {
        console.error('Error delete item:', error)
        return false
    }
}

async function postApiItem(method, item=null, variant=null) {

    let api = 'http://127.0.0.1:8000/api/products/item_detail/'

    const item_data = {
        name: document.getElementById('itemName').value.trim(),
        length: parseFloat(document.getElementById('itemLength').value),
        height: parseFloat(document.getElementById('itemHeight').value),
        width: parseFloat(document.getElementById('itemWidth').value),
        weights: parseFloat(document.getElementById('itemWeights').value),
        quantity: parseInt(document.getElementById('itemQuantity').value),
        variant: parseInt(variant)
    }

    if (method === 'PUT') {
        api = `http://127.0.0.1:8000/api/products/item_detail/${item}/`
    }

    console.log(variant)

    try {
        console.log("Data:", item_data)

        const access_token = await getValidAccessToken()

        const response = await fetch(api, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            body: JSON.stringify(item_data)
        })

        const data = await response.json()

        if (!response.ok) {
            return False
        }

        return data
    }

    catch (error) {
        console.error('Error update item:', error)
        return False
    }
}



//----------------------------------------------------------------
// Thay đổi tên của variants
//----------------------------------------------------------------

document.getElementById('newVariantName').addEventListener('blur', () => {
    const variantNameInput = document.getElementById('newVariantName')

    if (!variantNameInput.value || variantNameInput.value.trim() === '') {
        if (variantNameInput.classList.contains('is-valid')) {
            variantNameInput.classList.remove('is-valid');
        }
        variantNameInput.classList.add('is-invalid');
    }
    else {
        if (variantNameInput.classList.contains('is-invalid')) {
            variantNameInput.classList.remove('is-invalid');
        }
        variantNameInput.classList.add('is-valid');
    }
})

async function editVariantName() {
    const variantID = sessionStorage.getItem('variantID')
    const access_token = await getValidAccessToken()

    fetch(`http://127.0.0.1:8000/api/products/variant_detail/${variantID}/`, {
        method: 'PUT',
        body: JSON.stringify({name: document.getElementById('newVariantName').value}),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        }
    })
    .then(response => response.json())
    .then(variant => {
        // if (variant && variant.name) { // Kiểm tra dữ liệu trả về có hợp lệ không
        document.getElementById('variantNameSpan').innerHTML = variant.name;
        document.getElementById('variantNameSpan').offsetHeight;
        // } else {
        //     console.error("Invalid API response:", variant);
        // }

        console.log("Variant:", document.getElementById('variantNameSpan').innerHTML )

        const newVariantNameModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('newVariantNameModal'))
        newVariantNameModal.hide()
    })
    .catch(error => console.error('Error:', error))
}

validateForm(document.getElementById('newVariantNameForm'), () => {}, editVariantName)

//----------------------------------------------------------------
// Validate price form
//----------------------------------------------------------------

function confirmSaving(input) {
    if (input.classList.contains('is-invalid')) {
        input.classList.remove('is-invalid');
    }

    input.classList.add('is-valid');
    document.getElementById('price-warning-message').innerHTML = ''

    hideWarningPriceModal()
}

function confirmEdtiting(input) {
    if (input.classList.contains('is-valid')) {
        input.classList.remove('is-valid');
    }
    input.classList.add('is-invalid');
    input.nextElementSibling.innerHTML = 'Vui lòng nhập lại giá trị mới'

    hideWarningPriceModal()
}

function showWarningPriceModal() {
    const warningModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('warningPriceModal'))

    $('#warningPriceModal').on('show.bs.modal', () => {
        document.getElementById('priceModal').style.filter = 'blur(3px)'
    })

    warningModal.show()
}

function hideWarningPriceModal() {
    const warningModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('warningPriceModal'))

    $('#warningPriceModal').on('hidden.bs.modal', () => {
        document.getElementById('priceModal').style.filter = 'none'
    })

    warningModal.hide()
}

document.getElementById('newPrice').addEventListener('blur', () => {
    const priceInput = document.getElementById('newPrice')

    const regex = /^\d+$/
    
    if(!priceInput.value || priceInput.value.trim() === '') {
        if (priceInput.classList.contains('is-valid')) {
            priceInput.classList.remove('is-valid');
        }
        priceInput.classList.add('is-invalid');
        priceInput.nextElementSibling.innerHTML = 'Vui lòng nhập giá bán'
    }

    else {
        if (!regex.test(priceInput.value)) {
            if (priceInput.classList.contains('is-valid')) {
                priceInput.classList.remove('is-valid');
            }
            priceInput.classList.add('is-invalid');
            priceInput.nextElementSibling.innerHTML = 'Giá bán phải là số'
        }
        else {
            if (parseFloat(priceInput.value) < 1000) {
                document.getElementById('price-warning-message').innerHTML = `Giá bán dưới 1.000 VND. Bạn có chắc chắn lưu với giá <strong>${formatPrice(parseFloat(priceInput.value))}</strong> không?`
                
                document.getElementById('confirmSavingBtn').onclick = () => {
                    confirmSaving(priceInput)
                }
                
                document.getElementById('confirmEditingBtn').onclick = () => {
                    confirmEdtiting(priceInput)
                }

                showWarningPriceModal()
            }
            else {
                if (priceInput.classList.contains('is-invalid')) {
                    priceInput.classList.remove('is-invalid');
                }
                priceInput.classList.add('is-valid');
                priceInput.nextElementSibling.innerHTML = ''
                document.getElementById('price-warning-message').innerHTML = ''      
            }
        }
    }
})

document.getElementById('startDateTime').addEventListener('change', async () => {
    const startDateTime = document.getElementById('startDateTime')
    sessionStorage.setItem('conflict_id', false)

    const response = await fetch('http://127.0.0.1:8000/api/products/check_date_time_price/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            start_date: new Date(startDateTime.value).toISOString(),
            variant: parseFloat(sessionStorage.getItem('variantID')),
        }),
    })

    const result = await response.json()

    console.log('conflicts: ', result)

    if (result.conflicts) {
        if (startDateTime.classList.contains('is-valid')) {
            startDateTime.classList.remove('is-valid');
        }
        startDateTime.classList.add('is-invalid');

        document.getElementById('price-warning-message').innerHTML = 
        `Hiện tại giá bán <strong>${formatPrice(result.price)}</strong> vẫn còn hiệu lực đến
        <strong>${formatISODate(result.end_date)}</strong>.
        Nếu bạn tiếp tục lưu, giá bán này sẽ được thay đổi thời gian để
         <strong class="text-danger">ngừng hiệu lực vào ${formatISODate(new Date(startDateTime.value))}</strong>.
        Bạn có chắc chắn giữ ngày bắt đầu hiệu lực này không?`;
        
        document.getElementById('confirmSavingBtn').onclick = () => {
            confirmSaving(startDateTime)
            sessionStorage.setItem('conflict_id', result.id)
        }
        
        document.getElementById('confirmEditingBtn').onclick = () => {
            confirmEdtiting(startDateTime)
        }

        showWarningPriceModal()
    }

    else {
        if (startDateTime.classList.contains('is-invalid')) {
            startDateTime.classList.remove('is-invalid');
        }
        startDateTime.classList.add('is-valid');
        document.getElementById('price-warning-message').innerHTML = ''
        document.getElementById('price-warning-message').classList.remove('warning-price')
    }

    if (startDateTime.classList.contains('is-valid')) {
        const endDateTime = document.getElementById('endDateTime')
        if (endDateTime.classList.contains('end-before-start')) {
            if (new Date(endDateTime.value) >= new Date(startDateTime.value)) {
                endDateTime.classList.remove('is-invalid', 'end-before-start');
            }
            endDateTime.classList.add('is-valid')
        }
    }
})

document.getElementById('endDateTime').addEventListener('change', () => {
    const endDateTime = document.getElementById('endDateTime')
    const startDateTime = document.getElementById('startDateTime')

    if (startDateTime.value === '' || startDateTime.classList.contains('is-invalid')) {
        if (endDateTime.classList.contains('is-valid')) {
            endDateTime.classList.remove('is-valid');
        }
        endDateTime.classList.add('is-invalid');
        endDateTime.nextElementSibling.innerHTML = 'Vui lòng chọn ngày giá bắt đầu có hiệu lực trước'
    }

    else {
        const start = new Date(startDateTime.value)
        const end = new Date(endDateTime.value)

        if (end < start) {
            if (endDateTime.classList.contains('is-valid')) {
                endDateTime.classList.remove('is-valid');
            }
            endDateTime.classList.add('is-invalid', 'end-before-start');
            endDateTime.nextElementSibling.innerHTML = 'Ngày giá kết thúc hiệu lực phải sau ngày bắt đầu'
        }

        else {
            if (endDateTime.classList.contains('is-invalid')) {
                endDateTime.classList.remove('is-invalid', 'end-before-start');
            }
            endDateTime.classList.add('is-valid');
            endDateTime.nextElementSibling.innerHTML = ''
        }
    }
})



//----------------------------------------------------------------
// Thao tác với price
//----------------------------------------------------------------

function submitPriceForm() {

    const action = document.getElementById('priceFormSubmitBtn').getAttribute('data-action')
    
    if(action === 'update') {
        updatePrice()
        console.log('update success');
    }

    else if (action === 'create') {
        createPrice()
        console.log('create success');
    }
};

validateForm(document.getElementById('priceForm'), () => {}, submitPriceForm)


//----------------------------------------------------------------
// Thêm giá bán mới

$('#priceModal').on('hidden.bs.modal', () => {
    document.getElementById('startDateTime').disabled = false
    document.getElementById('endDateTime').disabled = false
    document.getElementById('priceForm').reset()
    document.getElementById('priceForm').classList.remove('was-validated')
    document.querySelectorAll('#priceForm input').forEach(input => {
        input.classList.remove('is-valid', 'is-invalid')
    })
})

function showNewPriceModal() {

    document.getElementById('priceFormSubmitBtn').setAttribute('data-action', 'create')

    const priceModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('priceModal'))
    priceModal.show()
}

async function createPrice() {

    const access_token = await getValidAccessToken()

    const price = parseFloat(document.getElementById('newPrice').value)
    const start_date = new Date(document.getElementById('startDateTime').value).toISOString()
    const end_date = new Date(document.getElementById('endDateTime').value).toISOString()
    const variantID = parseInt(sessionStorage.getItem('variantID'))

    const newPrice = {  
        price: price,
        start_date: start_date,
        end_date: end_date,
        variant: variantID
    }

    if (sessionStorage.getItem('conflict_id') !== false) {
        newPrice.conflict_id = parseInt(sessionStorage.getItem('conflict_id'))
    }

    fetch('http://127.0.0.1:8000/api/products/prices/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify(newPrice)
    })
    .then(response => response.json())
    .then(price => {
        alert("Lưu giá bán mới thành công.")
        console.log(price)
        document.getElementById('priceList').innerHTML += `
            <tr data-id='${price.id}'>
                <td class="text-center">${price.id}</td>
                <td class="text-center">${formatISODate(price.start_date)}</td>
                <td class="text-center">${formatISODate(price.end_date)}</td>
                <td class="text-center">${formatPrice(price.price)}</td>
                <td class="text-center">
                    <button onclick="editPrice(${price.id})" type="button" class="btn btn-edit" data-bs-toggle="tooltip" data-bs-placeme="bottom" data-bs-title="Chỉnh sửa">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                </td>
            </tr>
        `

        if (new Date(price.start_date) <= new Date()) {
            document.getElementById('variantPriceSpan').innerHTML = formatPrice(price.price);
        }
        
        const priceModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('priceModal'))
        priceModal.hide()
    })
    .catch(error => console.error('Error:', error))
}

//----------------------------------------------------------------
// Chỉnh sửa giá bán
function editPrice(priceID) {

    fetch(`http://127.0.0.1:8000/api/products/prices/${priceID}/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(price => {
        sessionStorage.setItem('priceID', price.id)

        document.getElementById('priceModalLabel').innerHTML = 'Chỉnh sửa giá bán'


        document.getElementById('startDateTime').value = parseDateTimeLocal(price.start_date)
        document.getElementById('endDateTime').value = parseDateTimeLocal(price.end_date)

        // Tạm thời vô hiệu hóa
        document.getElementById('startDateTime').disabled = true
        document.getElementById('endDateTime').disabled = true

        document.getElementById('newPrice').value = parseFloat(price.price)
        document.getElementById('priceFormSubmitBtn').setAttribute('data-action', 'update')
        sessionStorage.setItem('conflict_id', false)

        const priceModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('priceModal'))
        priceModal.show()
    })
}

async function updatePrice() {
    const access_token = await getValidAccessToken()
    const new_price = parseFloat(document.getElementById('newPrice').value)

    const newPrice = {  
        price: new_price,
    }

    fetch(`http://127.0.0.1:8000/api/products/prices/${sessionStorage.getItem('priceID')}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify(newPrice)
    })
    .then(response => response.json())
    .then(price => {
        const row = document.querySelector('#priceList [data-id="' + price.id + '"]');


        row.children[3].innerHTML = formatPrice(price.price)


        const priceModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('priceModal'))
        priceModal.hide()
    })
}

