document.addEventListener("DOMContentLoaded", async () => {

    // Tải dữ liệu đã được phân trang từ back-end
    const paginatedData = await fetchPaginatedData('http://127.0.0.1:8000/api/products/products/?', 1)
    
    // Tạo pagination
    createPagination(paginatedData.total_pages, 1)

    // Hiển thị danh sách sản phẩm
    renderProductList(paginatedData.results)
})


// Thay đổi dữ liệu mỗi khi chọn page khác
async function paginationClick(pageNumber) {

    const searchingInput = document.getElementById('productSearching')

    let paginatedData

    if (!searchingInput.value || searchingInput.value.trim() === '') {
        paginatedData = await fetchPaginatedData('http://127.0.0.1:8000/api/products/products/?', pageNumber)
    }

    else {
        paginatedData = await fetchPaginatedData(`http://127.0.0.1:8000/api/products/searching/?query=${searchingInput.value}&&`, pageNumber)
    }

    createPagination(paginatedData.total_pages, pageNumber)
    renderProductList(paginatedData.results)
}


function renderProductList(products) {
    const product_list_container = document.getElementById('product_list_container')

    product_list_container.innerHTML = ''

    products.forEach(product => {
        const row = document.createElement('tr')

        row.onclick = () => {
            navigateToProductDetail(product.id, product.name)
        }

        row.innerHTML = `
            <td class="text-center align-middle">${product.id}</td>
            <td class="align-middle">${product.name}</td>
            <td class="text-center align-middle">${product.category ? product.category.name : product.category__name}</td>
            <td class="text-center align-middle">${product.status ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}</td>
        `
        
        product_list_container.appendChild(row)

        initTooltips()
    })
}


// ----------------------------------------------------------------
// Tìm kiếm sản phẩm
// ----------------------------------------------------------------

document.getElementById('productSearching').addEventListener('input', async () => {
    const searchInput = document.getElementById('productSearching')

    if (!searchInput.value && searchInput.value.trim() === '') {
        return
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/products/searching/?query=${searchInput.value}`)
        const data = await response.json()

        createPagination(data.total_pages, 1)
        renderProductList(data.results)
    }

    catch (error) {
        console.log(error)
    }
})