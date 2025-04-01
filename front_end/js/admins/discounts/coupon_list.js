document.addEventListener("DOMContentLoaded", async () => {

    // Tải dữ liệu đã được phân trang từ back-end
    const paginatedData = await fetchCoupon(1)
    
    // Tạo pagination
    createPagination(paginatedData.total_pages, 1)

    // Hiển thị danh sách sản phẩm
    renderCouponList(paginatedData.results)


})

async function fetchCoupon(pageNumber) {
    try {

        const access_token = await getValidAccessToken()

        const response = await fetch(`http://127.0.0.1:8000/api/discounts/coupons/?page=${pageNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            }
        })

        const data = await response.json()
        return data
    }

    catch (e) { console.log(e) }
}


async function paginationClick(pageNumber) {
    const paginatedData = await await fetchCoupon(pageNumber)
    createPagination(paginatedData.total_pages, pageNumber)
    renderCouponList(paginatedData.results)
}


function renderCouponList(data) {
    
    const table = document.getElementById('couponList')

    data.forEach(coupon => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-center align-middle">${coupon.id}</td>
            <td class="align-middle">${coupon.code}</td>
            <td class="align-middle">${coupon.description}</td>
            <td class="text-center align-middle">${parseFloat(coupon.percentage)*100}%</td>
            <td class="text-center align-middle">${formatISODate(coupon.start_date)}</td>
            <td class="text-center align-middle">${formatISODate(coupon.end_date)}</td>
            <td class="text-center align-middle">${coupon.usage_limits === null ? 'Không giới hạn' : coupon.usage_limits}</td>
            <td class="text-center align-middle">${coupon.usage_count ? coupon.usage_count : 0}</td>
        `;
        row.onclick = () => {
            navigateToCouponDetail(coupon.id, coupon.code)
        }
        table.appendChild(row);
    })

}


