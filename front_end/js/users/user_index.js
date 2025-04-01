// ----------------------------------------------------------------
// Tải header, footer, nav (tài khoản)
// ----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    // Tải header
    loadHeader()

    // Tải footer
    const footerHTML = await loadHTMLContent('./components/footer.txt')
    document.getElementById('footer').innerHTML = footerHTML
})

async function loadHeader() {
    
    const headerHTML = await loadHTMLContent('./components/header.txt')
    document.getElementById('header').innerHTML = headerHTML

    const token = sessionStorage.getItem('access_token')
    const navbar = document.getElementById('navbar')

    console.log(navbar)


    // Thêm button đăng nhập/đăng ký nếu chưa đăng nhập
    if (!token) {
        const navForAccount = `
            <li id="login" class="ps-lg-5 nav-item"><a class="nav-link" href="#">Đăng nhập</a></li>
            <li id="register" class="nav-item"><a class="nav-link" href="#">Đăng ký</a></li>
        `

        navbar.insertAdjacentHTML('beforeend', navForAccount)

        document.getElementById('login').onclick = () => {
            showLoginModal()
        }

        document.getElementById('register').onclick = () => {
            showRegisterModal()
        }
    }

    // Thêm button giỏ hàng/tài khoản nếu đã đăng nhập
    else {
        const navForAccount = `
            <li class="ps-lg-5 nav-item"><a class="nav-link" href="./cart.html">Giỏ hàng</a></li>
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownAccount" role="button" data-bs-target="#navbarDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    Tài khoản
                </a>
                <ul id="navbarDropdown" class="dropdown-menu" aria-labelledby="navbarDropdownAccount">
                    <a class="dropdown-item" href="#">Thông tin tài khoản</a>
                    <a class="dropdown-item" href="#">Đổi mật khẩu</a>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="#" onclick="logout()">Đăng xuất</a>
                </ul>
            </li>
        `

        navbar.insertAdjacentHTML('beforeend', navForAccount)
    }
}


// Mở modal login
async function showLoginModal() {

    if (!document.getElementById('loginModal')) {
        const loginModalHTML = await loadHTMLContent('./components/login_modal.txt')
        document.body.insertAdjacentHTML('beforeend', loginModalHTML)
    }

    document.getElementById('loginModal').addEventListener('shown.bs.modal', () => {
        document.getElementById('noAccount').addEventListener('click', () => {
            const loginModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModal'))
            loginModal.hide()

            showRegisterModal()
        })

        checkUsername()

        validateForm(document.getElementById('loginForm'), () => {}, login)
        
    })

    const loginModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModal'))
    loginModal.show()
}


// Mở modal register
async function showRegisterModal() {
    if (!document.getElementById('registerModal')) {
        const registerModalHTML = await loadHTMLContent('./components/register_modal.txt')
        // document.body.insertAdjacentHTML('beforeend', registerModalHTML)

        const element = document.createElement('div')
        element.innerHTML = registerModalHTML

        document.body.appendChild(element)

        document.getElementById('alreadyAccount').onclick = () => {
            const registerModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('registerModal'))
            registerModal.hide()

            showLoginModal()
        }
    }

    console.log($('#provinceSignup'), $('#districtSignup'), $('#wardSignup'), $('#registerModal .modal-body'))

    $('#registerModal').on('shown.bs.modal', () => {
        
        initAddressSelector(
            $('#provinceSignup'), $('#districtSignup'), $('#wardSignup'),
            document.getElementById('provinceSignup'), document.getElementById('districtSignup'),
            document.getElementById('wardSignup'), $('#registerModal')
        )
    })

    document.getElementById('registerModal').addEventListener('shown.bs.modal', () => {
        validateForm(document.getElementById('registerForm'), validateRegisterForm, register)
    })

    const registerModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('registerModal'))
    registerModal.show()
}
  
// ----------------------------------------------------------------
// Hiển thị danh sách sản phẩm (product card)
// ----------------------------------------------------------------

function renderProductList(products, productListContainer) {
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.onclick = (event) => {
            event.preventDefault();
            sessionStorage.setItem("product_id", product.id)
            window.location.href = `./product_detail.html?name=${product.name}`;
        }

        const salePrice = product.sale_price ? parseFloat(product.sale_price) : ''
        const discountPercentage = product.discount_percentage ? Math.floor(parseFloat(product.discount_percentage) * 100) : ''

        productCard.innerHTML = `
            <div class="img-card">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <h3>${product.name}</h3>
            <p class="original-price">${salePrice ? formatPrice(parseFloat(product.price)) : ''}</p>
            <p class="price d-flex justify-content-center align-items-center gap-3">
                <span>${salePrice ? formatPrice(parseFloat(salePrice)) : formatPrice(parseFloat(product.price))}</span>
                <span class="discount" style="display: ${discountPercentage ? 'block' : 'none'};">${discountPercentage ? '- ' + discountPercentage + '%' : ''}</span>
            </p>
        `
        productListContainer.appendChild(productCard);
    })
}