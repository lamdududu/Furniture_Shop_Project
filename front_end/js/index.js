
// Khởi tạo tooltip
function initTooltips() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))

    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
}

// Tải vào DOM các components html
async function loadHTMLContent(htmlFile) {
    try {
        const response = await fetch(htmlFile)
        const html = await response.text()
        return html
    }

    catch (error) {
        console.error('Error loading content:', error)
    }
}


// ----------------------------------------------------------------
// Lấy access token xác thực
// ----------------------------------------------------------------

// Kiểm tra access token đã hết hạn
function isTokenExpired(token) {
    if (!token) return

    try {
        const payload = JSON.parse(atob(token.split('.')[1]))   // decode JWT payload
        
        return payload.exp < Math.floor(Date.now() / 1000)      // so sánh thời gian hiện tại
    }

    catch (error) {
        return true             // nếu có lỗi => token không hợp lệ hoặc hết hạn
    }
}


// Lấy acccess token mới
async function refreshAccessToken() {
    const refreshToken = sessionStorage.getItem('refresh_token')
    if (!refreshToken) return

    try {
        const response = await fetch('http://127.0.0.1:8000/api/users/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh: refreshToken,
            })
        })

        if (!response.ok)
            throw new Error("Failed to refresh token.")

        const data = await response.json()

        sessionStorage.setItem('access_token', data.access)

        if (data.refresh) {
            sessionStorage.setItem('refresh_token', data.refresh)
        }

        return data.access
    }
    
    catch (error) {
        console.error("Failed to refresh token:", error)
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('refresh_token')
        sessionStorage.removeItem('user')

        window.location.href = '../users/index.html' || './index.html'
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại')
    }
}


async function getValidAccessToken() {
    let accessToken = sessionStorage.getItem('access_token')
    if (!accessToken || await isTokenExpired(accessToken)) {
        console.log('Access token expired. Refreshing...')
        accessToken = await refreshAccessToken()
    }
    return accessToken
}


// ----------------------------------------------------------------
// Lấy dữ liệu có phân trang
// ----------------------------------------------------------------
async function fetchPaginatedData(baseAPI, pageNumber) {
    try {
        const response = await fetch(`${baseAPI}page=${pageNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        const data = await response.json()
        return data
    }

    catch (e) { console.log(e) }
}

async function fetchPaginatedDataWithToken(baseAPI, pageNumber, access_token) {
    try {
        const response = await fetch(`${baseAPI}page=${pageNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`,
            }
        })

        const data = await response.json()
        return data
    }

    catch (e) { console.log(e) }
}


// ----------------------------------------------------------------
// Format dữ liệu
// ----------------------------------------------------------------

// Xử lý giá trước khi hiển thị
function formatPrice(price) {
    const formattedPrice = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price)

    return formattedPrice
}

// Xử lý ISO datetime sang dạng datetime dễ đọc
function formatISODate(isoString) {
    const date = new Date(isoString);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
    const day = String(date.getDate()).padStart(2, "0");

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12; // Đổi về 12 giờ thay vì 24 giờ

    return `${year}-${month}-${day} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

// Xử lý ISO 8601 sang datetime-local (để hiển thị vào input datetime-local)
function parseDateTimeLocal(input) {

    // Chuyển từ iso 8601 sang datetime-local
    const date = new Date(input);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


// ----------------------------------------------------------------
// Xác thực dữ liệu đầu vào
// ----------------------------------------------------------------

// Xác thực dữ liệu của form
function validateForm(form, validateData, submitEvent) {
    form.addEventListener('submit', function(event) {
        
        event.preventDefault()
        validateData()

        if (!form.checkValidity() ) {
            event.preventDefault()
            event.stopPropagation()
        }

        else {
            event.preventDefault()

            submitEvent()  
            
            delete form.dataset.submitted
        }
        
        form.classList.add('was-validated')
    }, false)
}


// Xác thực dữ liệu của selector
function validateSelector(selector) {
    if (selector.val() === "") {
        if(selector.hasClass('is-valid')) {
            selector.removeClass('is-valid')
        }
        selector.addClass('is-invalid')
    }
    else {
        if(selector.hasClass('is-invalid')) {
            selector.removeClass('is-invalid')
        }
        selector.addClass('is-valid')
    }
}


// ----------------------------------------------------------------
// Lấy dữ liệu cho selector
// ----------------------------------------------------------------

function getOptionForSelector(selectorID, api) {
    
    fetch(api, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        var selector = document.getElementById(selectorID)
        
        if (data) {
            data.forEach(element => {
                const option = document.createElement('option');
                option.value = element.id;
                option.innerHTML = `${element.name}`;
                selector.appendChild(option);
            });
        }
    })
    .catch(error => console.error('Error fetch data:', error))
}


// ----------------------------------------------------------------
// Kiểm tra dữ liệu đã tồn tại
// ----------------------------------------------------------------

async function checkCouponCode(code) {
    try {
        const access_token = await getValidAccessToken()

        const response = await fetch(`http://127.0.0.1:8000/api/discounts/check_coupons/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            body: JSON.stringify({ code: code })
        })

        const result = await response.json()
        
        return result.exists
    }

    catch (e) {
        console.error(e)
        return false
    }
}



// ------------------------------------------------------------
// Tìm kiếm
// ------------------------------------------------------------


document.addEventListener('change', (event) => {

})