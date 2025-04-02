document.addEventListener('DOMContentLoaded', async() => {

    const access_token = await getValidAccessToken()
    const paginatedData = await fetchPaginatedDataWithToken('http://127.0.0.1:8000/api/orders/orders/?', 1, access_token)

    createPagination(paginatedData.total_pages, 1)
    renderOrderList(paginatedData.results)
})

async function paginationClick(pageNumber) {

    const access_token = await getValidAccessToken()

    const searchValue = document.getElementById('orderSearching').value.trim()
    let paginatedData

    if (!searchValue) {
        paginatedData = await fetchPaginatedDataWithToken('http://127.0.0.1:8000/api/orders/orders/?', pageNumber, access_token)
    }

    else {
        paginatedData = await fetchPaginatedDataWithToken(
            `http://127.0.0.1:8000/api/orders/orders/?query=${searchValue}&&`, pageNumber, access_token
        )
    }

    createPagination(paginatedData.total_pages, pageNumber)
    renderOrderList(paginatedData.results)
}


function renderOrderList(data) {
    
    const table = document.getElementById('orderList')

    table.innerHTML = ''

    data.forEach(order => {

        const status = order.order_status

        // max là giá trị tích lũy qua mỗi vòng lặp (giá trị ban đầu = stt đầu tiên)
        // stt là giá trị hiện tại đang duyệt trong mảng
        const now_status = status.reduce((max, stt) => 
            parseInt(stt.id) > parseInt(max.id) ? stt : max
        );

        console.log(now_status)

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-center align-middle">${order.id}</td>
            <td class="text-center align-middle">${order.user.username}</td>
            <td class="text-center align-middle">${formatISODate(new Date(order.order_date))}</td>
            <td class="text-center align-middle">${formatPrice(parseFloat(order.total_amount))}</td>
            <td class="text-center align-middle">${order.payment_method.name}</td>
            <td class="text-center align-middle">${(now_status.status.id == '6' ? 'Đã hủy' : (order.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'))}</td>
            <td class="text-center align-middle">${now_status.status.name}</td>
        `;

        row.onclick = () => {
            navigateToOrderDetail(order.id)
        }
        table.appendChild(row);
    })

}


// -------------------------------------------------------
// Tìm kiếm đơn hàng
// -------------------------------------------------------

document.getElementById('orderSearching').addEventListener('input', async () => {
    const searchValue = document.getElementById('orderSearching').value.trim()
    const access_token = await getValidAccessToken()


    if (!searchValue) {
        return
    }
 
    const paginatedData = await fetchPaginatedDataWithToken(
        `http://127.0.0.1:8000/api/orders/orders/?query=${searchValue}`, 1, access_token
    )

    createPagination(paginatedData.total_pages, 1)
    renderOrderList(paginatedData.results)
})

