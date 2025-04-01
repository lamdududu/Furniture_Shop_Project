document.addEventListener("DOMContentLoaded", async () => {

    // Tải dữ liệu đã được phân trang từ back-end
    const paginatedData = await fetchPaginatedData('http://127.0.0.1:8000/api/discounts/promotions/?', 1)
    
    // Tạo pagination
    createPagination(paginatedData.total_pages, 1)

    // Hiển thị danh sách sản phẩm
    renderPromotionList(paginatedData.results)


})


async function paginationClick(pageNumber) {
    const paginatedData = await fetchPaginatedData('http://127.0.0.1:8000/api/discounts/promotions/?', pageNumber)
    createPagination(paginatedData.total_pages, pageNumber)
    renderPromotionList(paginatedData.results)
}


function renderPromotionList(data) {
    
    const table = document.getElementById('promotionList')

    data.forEach(promotion => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${promotion.id}</td>
            <td>${promotion.name}</td>
            <td>${formatISODate(promotion.start_date)}</td>
            <td>${formatISODate(promotion.end_date)}</td>
        `;
        row.onclick = () => {
            navigateToPromotionDetail(promotion.id, promotion.name)
        }
        table.appendChild(row);
    })

}


