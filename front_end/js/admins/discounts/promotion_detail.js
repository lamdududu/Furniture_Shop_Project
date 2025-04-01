document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('promotionFormSubmitBtn')
    
    if (sessionStorage.getItem('promotion_id') === 'new_promotion') {
        submitBtn.setAttribute('data-action', 'create')
        submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i><span> Tạo khuyến mãi mới</span>'
    }

    else {

        getPromotion(sessionStorage.getItem('promotion_id'))

        submitBtn.setAttribute('data-action', 'update')
        submitBtn.innerHTML = '<i class="bi bi-floppy"></i><span> Lưu khuyến mãi</span>'
    }

    validateForm(document.getElementById('promotionForm'), () => {}, submitEvent)
})


// ----------------------------------------------------------------
// Lấy dữ liệu cho selector
// ----------------------------------------------------------------

getOptionForSelector('saleProductSelector', 'http://127.0.0.1:8000/api/products/products/?no_pagination=true')

$(document).ready( () => {
    const productSelector = $('#saleProductSelector')
    let selectedValues = []

    productSelector.select2({
        placeholder: 'Chọn sản phẩm',
        allowClear: true,
        tags: false,
        // closeOnSelect: false,
        // templateSelection: function () {
        //     return ''; // Không hiển thị các mục đã chọn
        // }
    })

    productSelector.on('select2:unselecting', (event) => {
        event.preventDefault()


    })


    // productSelector.on('select2:unselect', (event) => {
    //     const removedValue = event.params.data

    //     $(`#saleProductList tr[data-id="${removedValue.id}"]`).remove()
    // })


    productSelector.on('select2:selecting', (event) => {
        selectedValues = productSelector.val() || []
    })

    productSelector.on('select2:select', (event) => {

        const data = event.params.data

        console.log("Đã chọn: ", data)
        const productListContainer = document.getElementById('saleProductList')

        console.log(selectedValues)
        
        if (!selectedValues.includes(String(data.id)) && event.params && data) {
            
            if(productSelector.find('option[value="' + data.id + '"]').length === 0)
                $('#saleProductSelector').append(new Option(data.text, data.id, true, true))
            
            console.log("checked")

            const row = document.createElement('tr')
            
            if (data.discount_id) {
                row.setAttribute('data-discount-id', data.discount_id)
            }

            row.setAttribute('data-id', data.id)

            row.innerHTML = `
                <td class="text-center">${data.id}</td>
                <td>${data.text}</td>
                <td class="text-center">
                    <input type="number" min="0" max="1" step="0.01" class="form-control" name="discountPercentage" ${data.percentage ? `value="${data.percentage}"`: '' } required>
                </td>
                <td class="text-center">
                    <button type="button" class="btn btn-warning btn-edit" ${data.percentage ? '' : 'disabled'}><i class="bi bi-pencil-square"></i></button>
                </td>
                <td class="text-center">
                    <button type="button" id class="btn btn-warning btn-delete"><i class="bi bi-x-square-fill"></i></button>
                </td>
            `
            productListContainer.appendChild(row)

            row.querySelector('.btn-edit').onclick = () => {
                
            }

            row.querySelector('.btn-delete').onclick = () => {
                showConfirmDeletingModal(row, JSON.stringify(data.text), data.discount_id)
            }

            console.log("Đã thêm")
            console.log("Products:", productSelector.val())
        }
    })
})



// ----------------------------------------------------------------
// Hiển thị dữ liệu cho promotion
// ----------------------------------------------------------------


function getPromotion(id) {

    const promotionID = sessionStorage.getItem('promotionID') || id

    fetch(`http://127.0.0.1:8000/api/discounts/promotions/${promotionID}/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(promotion => {
        displayPromotion(promotion)
    })
    .catch(error => console.error('Error fetch data:', error))
}


function displayPromotion(data) {

    const promotion = data.promotion
    const discounts = data.discounts

    document.getElementById('promotionName').value = promotion.name || null
    document.getElementById('startDateSale').value = parseDateTimeLocal(promotion.start_date)
    document.getElementById('endDateSale').value = parseDateTimeLocal(promotion.end_date)

    const productListContainer = document.getElementById('saleProductList')
    productListContainer.innerHTML = ''

    discounts.forEach(discount => {

        const selectedValues = $('#saleProductSelector').val() || []
        selectedValues.push(String(discount.product.id))  
        $('#saleProductSelector').val(selectedValues).trigger({
            type:'select2:select',
            params: {
                data: {
                    id: discount.product.id,
                    text: discount.product.name,
                    discount_id: discount.id,
                    percentage: discount.percentage,
                }
            }
        })

        console.log($('#saleProductSelector').val())
    })
 }


// ----------------------------------------------------------------
// Lấy dữ liệu từ form
// ----------------------------------------------------------------

function getDataFromPromotionForm() {
    const data = {
        promotion: {
            name: document.getElementById('promotionName').value,
            start_date: new Date(document.getElementById('startDateSale').value).toISOString(),
            end_date: new Date(document.getElementById('endDateSale').value).toISOString(),
        },
        discounts: []
    }

    const productListContainer = document.getElementById('saleProductList')
    const rows = productListContainer.querySelectorAll('#saleProductList > tr')   
    
    rows.forEach((row, index) => {
        // if (index > 0) {
            
        // }
        const productId = parseInt(row.querySelector('td:nth-child(1)').textContent)
        const discountPercentage = parseFloat(row.querySelector('input[name="discountPercentage"]').value)

        if (row.getAttribute('data-discount-id')) {
            data.discounts.push({
                id: parseInt(row.getAttribute('data-discount-id')),
                product_id: productId,
                percentage: discountPercentage,
            })
        }
        else {
            data.discounts.push({
                product_id: productId,
                percentage: discountPercentage,
            })
        }
    
    })

    return data
}


// ----------------------------------------------------------------
// Thao tác trên promotions
 // ----------------------------------------------------------------


function submitEvent() {
    const action = document.getElementById('promotionFormSubmitBtn').getAttribute('data-action')

    if (action === 'create') {
        createPromotion()
    }
    else if (action === 'update') {
        updatePromotion()
    }
}

async function createPromotion() {

    const access_token = await getValidAccessToken()

    const data = getDataFromPromotionForm()
    fetch('http://127.0.0.1:8000/api/discounts/promotions/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify(data)
    })
    .then((response) => response.json())
    .then((promotion) => {
         console.log('Tạo promotion thành công:', promotion)
         sessionStorage.setItem('promotion_id', promotion.id)
         sessionStorage.setItem('promotion_name', promotion.name)
         window.location.href = `./promotion_detail.html?name=${promotion.name}`
     })
}

async function updatePromotion() {

    const access_token = await getValidAccessToken()
    const data = getDataFromPromotionForm()

    fetch(`http://127.0.0.1:8000/api/discounts/promotions/${sessionStorage.getItem('promotion_id')}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify(data)
    })
    .then((response) => response.json())
    .then((promotion) => {
        console.log('Tạo promotion thành công:', promotion)
        sessionStorage.setItem('promotion_id', promotion.id)
        sessionStorage.setItem('promotion_id', promotion.name)
        getPromotion(promotion.id)
        console.log("Data:", data)
         //  window.location.href = `./admin-promotions.html?name=${promotion.name}`
     })
}

async function deleteDiscount(row, discountID=null) { 

    try {

        if (discountID) {
            const access_token = await getValidAccessToken()

            const response = await fetch(`http://127.0.0.1:8000/api/products/discounts/${discountID}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                }
            })
            
            const result = await response.json()

            if (!response.ok) {

                const deleteModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmDeletingModal'))
                deleteModal.hide()

                setTimeout( () => {
                    alert('Đã xảy ra lỗi!')
                }, 300)

                return
            }

        }

        removeSelectedItem(row)
        row.remove()

        const deleteModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmDeletingModal'))
        deleteModal.hide()

        setTimeout( () => {
            alert('Xóa thành công!')
        }, 300)
    }
    
    catch(error) {
        console.error('Error:', error)
    }
}


function showConfirmDeletingModal(row, productName, discountID=null,) {

    if (!document.getElementById('confirmDeletingModal')) {
        const modal = document.createElement('section')
        modal.classList.add('modal', 'fade')
        modal.tabIndex = -1
        modal.setAttribute('aria-hidden', 'true')
        modal.setAttribute('aria-labelledby', 'confirmDeletingModalLabel')
        modal.setAttribute('id', 'confirmDeletingModal')
        modal.setAttribute('data-bs-backdrop', 'static')
        modal.setAttribute('data-bs-keyboard', 'false')

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="priceModalLabel">
                            Xác nhận hủy giảm giá
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        </button>
                    </div>
                    <div class="modal-body text-danger">
                        Bạn có chắc chắn xóa giảm giá cho sản phẩm <strong class="productToDelete"></strong> không?
                    </div>
                    <div class="modal-footer d-flex gap-1 justify-content-center">     
                        <button type="button" class="btn btn-sub btn-delete">Xóa</button>
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Hủy</button>
                    </div>
                </div>
            </div>
        `

        document.body.appendChild(modal)
    }

    const modal = document.getElementById('confirmDeletingModal')

    modal.querySelector('.productToDelete').textContent = productName

    modal.querySelector('.btn-delete').onclick = () => {
        deleteDiscount(row, discountID)
    }

    $('#confirmDeletingModal').modal('show')
}


function removeSelectedItem(row) {
    let selectedValues = $('#saleProductSelector').val() || []

    selectedValues = selectedValues.filter(value => value !== row.getAttribute('data-id'))

    $('#saleProductSelector').val(selectedValues).trigger('change')
}