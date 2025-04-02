
document.addEventListener('DOMContentLoaded', async () => {

    const accountType = sessionStorage.getItem('accountType') === 'customer' ? false : true

    if (accountType) {
        document.getElementById('activeBreadcrumb').innerHTML = 'Tài khoản nhân viên'
    }

    else {
        document.getElementById('activeBreadcrumb').innerHTML = 'Tài khoản khách hàng'
    }

    const access_token = await getValidAccessToken()
    const paginatedData = await fetchPaginatedDataWithToken(`http://127.0.0.1:8000/api/users/users/?is_staff=${accountType}&`, 1, access_token)

    createPagination(paginatedData.total_pages, 1)
    renderAccountList(paginatedData.results)

})


async function paginationClick(pageNumber) {
    const access_token = await getValidAccessToken()
    const paginatedData = await fetchPaginatedDataWithToken(`http://127.0.0.1:8000/api/users/users/?is_staff=${accountType}&`, pageNumber, access_token)
    createPagination(paginatedData.total_pages, pageNumber)
    renderAccountList(paginatedData.results)
}


function renderAccountList (data) {
    
    const accountContainer = document.getElementById('accountContainer')
    accountContainer.innerHTML = ''

    data.forEach(account => {
        const row = document.createElement('tr')
        row.innerHTML = `
            <td class="text-center align-middle">${account.id}</td>
            <td class="align-middle">${account.username}</td>
            <td class="align-middle">${account.email}</td>
            <td class="text-center align-middle">${account.phone_number}</td>
            <td class="text-center align-middle">${account.is_active ? 'Đang hoạt động' : 'Đã khóa'}</td>
            <td class="text-center align-middle">${formatISODate(new Date(account.last_login).toISOString())}</td>
            <td class="text-center align-middle">
                <button type="button" class="btn btn-warning" data-bs-toggle="tooltip" data-bs-placement="bottom" data-bs-title="${account.is_active ? 'Khoá tài khoản' : 'Mở khóa tài khoản'}">
                    <i class="bi bi-${account.is_active ? 'unlock-fill' : 'lock-fill'}"></i>
                </button>
            </td>
        `
        accountContainer.appendChild(row)
        initTooltips()

        row.querySelector('.btn-warning').onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();

            const tooltipElement = row.querySelector('[data-bs-toggle="tooltip"]');
            const tooltipInstance = bootstrap.Tooltip.getInstance(tooltipElement); // Lấy instance

            if (tooltipInstance) {
                tooltipInstance.dispose(); // Destroy tooltip
            }
            toggleAccountStatus(row, account.id, account.is_active)
        }

        row.onclick = () => { navigateToAccountDetail(account.id, account.username) }
    })

}
