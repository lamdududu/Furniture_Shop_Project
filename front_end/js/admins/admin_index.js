
const observer = new MutationObserver( (mutationList) => {
    mutationList.forEach(mutation => {
        mutation.addedNodes.forEach((node) => {
            if (node.id === 'sidebarToggle'){           
                document.getElementById("sidebarToggle").addEventListener("click", function () {
                    let sidebar = document.getElementById("sidebar");
                    sidebar.classList.toggle("show");
                })
            }
        })
    });
})

observer.observe(document.body, {childList: true, subtree: true})

document.addEventListener("DOMContentLoaded", async () => {

    // Kiểm tra đã đăng nhập và có quyền quản trị hay không.
    // Nếu không, chuyển hướng đến trang chủ của người dùng.
    const user = JSON.parse(sessionStorage.getItem('user'))
    if (!user || !user.is_staff) {
        window.location.href = '../users/index.html'
        return
    }

    // Tải vào DOM sidebar
    const sidebar = await loadHTMLContent("./components/sidebar.txt")
    document.getElementById('sidebarNav').innerHTML = sidebar
 
})


// ----------------------------------------------------------------
// Điều hướng trong trang admin
// ----------------------------------------------------------------

// Điều hướng đến trang chi tiết sản phẩm
function navigateToProductDetail(product_id=null, product_name=null) {

    sessionStorage.setItem('product_id', product_id ? product_id : 'new_product')

    window.location.href = `product_detail.html?name=${product_name ? product_name : 'new_product'}`
}

// Điều hướng đến trang chi tiết lô hàng
function navigateToBatchDetail(batch_id=null, batch_name=null) {
    sessionStorage.setItem('batch_id', batch_id ? batch_id : 'new_batch')
    window.location.href = `batch_detail.html?name=${batch_name ? batch_name : 'new_batch'}`
}

// Điều hướng đến trang chi tiết khuyến mãi
function navigateToPromotionDetail(promotion_id=null, promotion_name=null) {
    sessionStorage.setItem('promotion_id', promotion_id ? promotion_id : 'new_promotion')
    window.location.href = `promotion_detail.html?name=${promotion_name ? promotion_name : 'new_promotion'}`
}

// Điều hướng đến trang chi tiết mã giảm giá
function navigateToCouponDetail(coupon_id=null, coupon_code=null) {
    sessionStorage.setItem('coupon_id', coupon_id ? coupon_id : 'new_coupon')
    window.location.href = `coupon_detail.html?code=${coupon_code ? coupon_code : 'new_coupon'}`
}


// Điều hướng đến trang chi tiết đơn hàng
function navigateToOrderDetail(order_id=null) {
    sessionStorage.setItem('order_id', order_id? order_id : 'new_order')
    window.location.href = `order_detail.html?id=${order_id? order_id : 'new_order'}`
}


// ----------------------------------------------------------------
// fetch dữ liệu từ các api có phân trang
// ----------------------------------------------------------------

// Tạo pagination
function createPagination(totalPages, currentPage) {
    let pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    // Previous button
    addPage(currentPage, pagination, "Trang trước", false, currentPage === 1);


    // Nếu tổng số trang <= 6 thì hiển thị tất cả
    if (totalPages <= 6) {

        for (let i = 1; i <= totalPages; i++) {
            addPage(currentPage, pagination, i, i === currentPage);
        }

    }
    
    // Nếu tổng số trang > 6 thì hiển thị các trang đầu và cuối và nút rút gọn
    else {
        addPage(currentPage, pagination, 1, currentPage === 1);
        if (currentPage > 3) {
            if (currentPage === 4) {
                addPage(currentPage, pagination, 2);
            }
            else {
                // Tạo button thể hiện các trang được rút gọn
                const prevDots = document.createElement("li");
                prevDots.textContent = "...";
                prevDots.classList.add("dots");
                prevDots.addEventListener("click", () => createPagination(totalPages, currentPage - 1));
                pagination.appendChild(prevDots);
            }
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            addPage(currentPage, pagination, i, i === currentPage);
        }

        if (currentPage < totalPages - 2) {
            if (currentPage === totalPages - 3) {
                addPage(currentPage, pagination, totalPages - 1);
            }
            
            else {
                let nextDots = document.createElement("li");
                nextDots.textContent = "...";
                nextDots.classList.add("dots");
                nextDots.addEventListener("click", async () => {
                    createPagination(totalPages, currentPage + 1)
                    await paginationClick(currentPage+1)
                });
                pagination.appendChild(nextDots);
            }
        }
        addPage(currentPage, pagination, totalPages, currentPage === totalPages);
    }

    // Next Button
    addPage(currentPage,  pagination, "Trang sau", false, currentPage === totalPages);
}


// Thêm một trang vào pagination
function addPage(currentPage, pagination, number, isActive = false, isDisabled = false) {
    let li = document.createElement("li");

    // Hiển thị số trang (hoặc previous, next) trong button
    li.textContent = number;
    // li.classList.add("page-item")


    // Thêm lớp .active để hiển thị css nổi bật cho trang hiện tại
    if (isActive) {
        li.classList.add("active")
    };
    
    if (isDisabled) {
        li.classList.add("disabled")
    };
    
    li.addEventListener("click", async () => {
        // Tạo mới lại pagination mỗi khi click sang trang khác (nếu không phải disabled)
        if (!isDisabled) {
            if (number === 'Trang sau') {
                await paginationClick(currentPage+1)
            }
            else if (number === 'Trang trước') {
                await paginationClick(currentPage-1)
            }
            else {
                await paginationClick(number)
            }
        };
    });

    pagination.appendChild(li);
}



//----------------------------------------------------------------
// Dữ liệu cho phân loại
//----------------------------------------------------------------


// fetch dữ diệu
function getVariants(productID) {
    if(productID) {
        fetch(`http://127.0.0.1:8000/api/products/variants/?product=${productID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
       .then(response => response.json())
       .then(variantsData => {
            console.log(variantsData)
            sessionStorage.setItem('productID', productID);
            variantsData.forEach(variant => {
                createVariantBtn(variant)
            })
       })
       .catch(err => console.log(err))
    }
}

// Tạo phân loại mới
function createNewDataFromTextBox(api, productID) {

    var name = document.getElementById('newVariantInput')
    
    if(name) { 
        name = name.value.trim()
    }

    console.log("Variant:", name, productID)

    fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            product: productID
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json()
        } else {
            throw new Error('HTTP error! status: ', response.status)
        }
    })
    .then(data => {
        try {
            createVariantBtn(data)
        }
        catch {
            createVariantInput(data)
        }

        const variantModal = bootstrap.Modal.getInstance(document.getElementById('newVariantModal'))
        if(variantModal) {
            variantModal.hide()

        }
        console.log("Thêm thành công:", data)
    })
    .catch(error => console.error('Error fetch data:', error))
}

// Show modal tạo phân loại
async function addVariant(productID, createBtn) {

    if(productID) {
        if(document.getElementById('newVariantModal') == null) {
            const newVariantModal = await loadHTMLContent('./components/new_variant_modal.txt')          
                // () => {setTimeout(() => showAndBindVariantModal(), 100)})

            document.getElementById('newVariantSection').innerHTML = newVariantModal

            document.getElementById('addItem').onclick = () => {
                addItemForVariant()
            }

            showAndBindVariantModal(productID, createBtn)
        }
        else {
            showAndBindVariantModal(productID, createBtn)
        }
        
    }
}

function showAndBindVariantModal(productID, createBtn) {
    const variantModal = document.getElementById('newVariantModal')

    if(variantModal) {

        const createVariantBtn = document.getElementById('createNewVariantBtn');
        if(createVariantBtn) {
            createVariantBtn.onclick = () => {
                createNewVariant(productID)
            };
        }

        const modal = bootstrap.Modal.getOrCreateInstance(variantModal)

        modal.show()

        variantModal.addEventListener('shown.bs.modal', () => {
            validateForm(document.getElementById('newVariantForm'), () => {}, () => {createNewVariant(productID, createBtn)})
        })
        
    }
    else {
        console.log('Modal không tồn tại')
    }
}

async function createNewVariant(productID, createBtn=null) {

    const access_token = await getValidAccessToken()

    const variant = {
        variant: {
            name: document.getElementById('variantName').value.trim(),
            product_id: productID
        },
        items: []
    }    

    Array.from(document.querySelectorAll('#newVariantForm .item-row')).forEach(item => {
        const item_data = {
            name: item.querySelector('[name="itemName"]').value.trim(),
            length: parseFloat(item.querySelector('[name="itemLength"]').value),
            width: parseFloat(item.querySelector('[name="itemWidth"]').value),
            height: parseFloat(item.querySelector('[name="itemHeight"]').value),
            weights: parseFloat(item.querySelector('[name="itemWeights"]').value),
            quantity: parseInt(item.querySelector('[name="itemQuantity"]').value)
        }

        variant.items.push(item_data)
    })

    fetch('http://127.0.0.1:8000/api/products/variants/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify(variant)
    })
    .then (response => response.json())
    .then(variant => {
        alert('Thêm phân loại mới thành công.')
    
        if (createBtn) {
            createVariantBtn(variant)
        }

        else {
            addVariantInput(variant)
        }

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('newVariantModal'))
        modal.hide()

    })
}

function addVariantInput(variant) {
    const variantList = document.getElementById('variantList')
    const variantGroup = document.createElement('div')
    variantGroup.classList.add('input-group')

    const variantLabel = document.createElement('label')
    variantLabel.for = 'variantItemQuantity'
    variantLabel.classList.add('input-group-text')
    variantLabel.textContent = variant.name

    const variantInput = document.createElement('input')
    variantInput.type = 'number'
    variantInput.step = '1'
    variantInput.name = 'variantItemQuantity'
    variantInput.setAttribute('data-id', variant.id)
    variantInput.placeholder = "Nhập số lượng..."
    variantInput.classList.add('form-control')

    const invalidVariant = document.createElement('div')
    invalidVariant.classList.add('invalid-feedback')
    invalidVariant.innerHTML = 'Số lượng phải là số nguyên dương'

    variantList.appendChild(variantGroup)
    variantGroup.appendChild(variantLabel)
    variantGroup.appendChild(variantInput)
    variantGroup.appendChild(invalidVariant)
}


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


// Xóa chi tiết/phân loại (mới, chưa lưu vào DB)
function deleteParentOfBtn(button) {
    const row = button.closest('tr')
    row.remove()
}


//----------------------------------------------------------------
//----------------------------------------------------------------
//----------------------------------------------------------------


