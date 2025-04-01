document.addEventListener('DOMContentLoaded', async() => {
    const paginatedData = await fetchPaginatedData('http://127.0.0.1:8000/api/products/batches/?', 1)
    createPagination(paginatedData.total_pages, 1)
    renderBatchList(paginatedData.results)
})

async function paginationClick(pageNumber) {

    const searchInput = document.getElementById('batchSearching')
    let paginatedData

    if (!searchInput.value || searchInput.value.trim() === '') {
        paginatedData = await fetchPaginatedData('http://127.0.0.1:8000/api/products/batches/?', pageNumber)
    }

    else {
        paginatedData = await fetchPaginatedDataWithToken(
            `http://127.0.0.1:8000/api/products/searching/?batch_info=${searchInput.value}&&`, 1, access_token
        )
    }
     
    createPagination(paginatedData.total_pages, pageNumber)
    renderBatchList(paginatedData.results)
}

function renderBatchList(batchList) {
    var table = document.getElementById('batch-list')
    table.innerHTML = ''

    batchList.forEach(batch => {
        const row = document.createElement('tr');
        
        row.onclick = () => {
            navigateToBatchDetail(batch.id, batch.batch_number)
        }

        row.innerHTML = `
            <td class="text-center">${batch.id}</td>
            <td class="text-center">${batch.batch_number}</td>
            <td class="text-center">${batch.item_quantity}</td>
            <td class="text-center">${batch.origin}</td>
            <td class="text-center">${batch.imported_at}</td>
        `;
        table.appendChild(row);
    })
}


// ----------------------------------------------------------------
// Tìm kiếm lô hàng
// ----------------------------------------------------------------

document.getElementById('batchSearching').addEventListener('input', async () => {
    const searchInput = document.getElementById('batchSearching')

    if (!searchInput.value || searchInput.value.trim() === '') {
        return
    }

    try {
        const access_token = await getValidAccessToken()

        const data = await fetchPaginatedDataWithToken(
            `http://127.0.0.1:8000/api/products/searching/?batch_info=${searchInput.value}&&`, 1, access_token
        )

        createPagination(data.total_pages, 1)
        renderBatchList(data.results)
    }

    catch (err) {
        console.log(err)
    }
})