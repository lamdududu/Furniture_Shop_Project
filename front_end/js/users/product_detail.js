document.addEventListener("DOMContentLoaded", () => {
    
    // Hiển thị thông tin sản phẩm
    renderProductInfo()

})


// Fetch dữ liệu product
async function fetchProductInfo() {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/products/product_info/${sessionStorage.getItem("product_id")}/`, {
            'method': 'GET',
            'headers': { 'Content-Type': 'application/json'}
        })

        const data = await response.json()
        
        if (!response.ok) {
            window.location.href = './not_found.html'
        }

        console.log(data)

        return data
    }

    catch (err) { 
        console.log(err)
    }
}


// Hiển thị dữ liệu product
async function renderProductInfo() {

    const data = await fetchProductInfo()

    const product = data.product
    const variants = data.variants
    const images = data.images
    const discount_percentage = data.discount_percentage ? parseFloat(data.discount_percentage) : null

    document.getElementById('productName').textContent = product.name
    document.getElementById('category').innerText = product.category.name
    document.getElementById('description').innerText = product.description
    document.getElementById('materials').innerText = product.materials
                                                        .map(material => material.name)
                                                        .join(', ')  

    const variantContainer = document.getElementById('variantContainer')
    variants.forEach((variant, index) => {
        const variantButton = document.createElement('button');
        variantButton.setAttribute('data-variant-id', variant.id)
        variantButton.textContent = variant.name;
        variantButton.classList.add('btn');
        variantButton.addEventListener('click', (event) => {
            event.preventDefault();
            selectVariant(variantButton, variant, discount_percentage)
        });
        variantContainer.appendChild(variantButton);


        const specificationContainer = document.getElementById('specificationContainer')

        const row = document.createElement('tr')
        row.innerHTML = `
            <th colspan="3">${variant.name}</th>
        `;

        specificationContainer.appendChild(row);

        variant.dimensions.forEach(dim => {
            const itemDetails = document.createElement('tr')

            itemDetails.classList.add('align-middle');

            itemDetails.innerHTML = `

                <td>${dim.name}</td>
                <td>
                    <div>Kích thước: ${dim.length}cm x ${dim.height}cm x ${dim.width}cm</div>
                    <div>Trọng lượng: ${dim.weights}gr</div>
                    <div>Số lượng: ${dim.quantity}</div>
                </td>
         
            `
            specificationContainer.appendChild(itemDetails)

        })


        if (index === 0) {
            selectVariant(variantButton, variant, discount_percentage)
        }
    })

    showImageInSlider(images)


    // Hiển thị mã giảm giá
    renderCoupons()

    // Tải các sản phẩm tương tự
    getRelatedProducts(product)
}





function changeImage(src) {
    document.getElementById('mainImage').src = src;
}

function selectVariant(button, variant, discount_percentage) {

    if (discount_percentage) {
        document.getElementById('originalPrice').innerText = formatPrice(parseFloat(variant.price))
        document.getElementById('price').innerText = formatPrice(parseFloat(variant.price) - parseFloat(variant.price) * discount_percentage)
        document.getElementById('discountPercentage').innerText = '-' + Math.floor((discount_percentage*100)) + '%'
    }
    else {
        document.getElementById('price').innerText = formatPrice(parseFloat(variant.price))
    }

    document.querySelectorAll('.variant-buttons .btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    document.getElementById('stockInfo').setAttribute('data-stock', variant.stock)
    document.getElementById('stockInfo').innerText = `(Còn lại: ${variant.stock})`;
    document.getElementById('stockInfo').style.display = 'inline';

    document.getElementById('quantity').max = variant.stock
}


//----------------------------------------------------------------
// Tạo slider hiển thị hình ảnh của products (có thumbnails)
//----------------------------------------------------------------

let sliderIndex = 0

function plusSlides(n) {
    sliderIndex += n

    showSlides(sliderIndex)
}

function currentSlide(n) {
    sliderIndex = n
    showSlides(sliderIndex)
}

function moveThumbnails(n) {
    const thumbnail_container = document.getElementById('thumbnails')
    thumbnail_container.scrollLeft += n * 100;
}

function scrollThumbnailsToActive() {
    const thumbnails = document.getElementsByClassName("demo")
    const activeThumbnail = document.querySelector(".demo.active")

    if(activeThumbnail) {
        const thumbnail_container = document.getElementById('thumbnails')
        thumbnail_container.scrollLeft = activeThumbnail.offsetLeft - (thumbnail_container.clientWidth / 2) + (activeThumbnail.clientWidth / 2)
    }
}

function showSlides(n) {
    let i
    let slides = document.getElementsByClassName("slider-img")
    let thumbnails = document.getElementsByClassName("demo")
    
    if (n >= slides.length) { sliderIndex = 0 }
    else if (n < 0) { sliderIndex = slides.length - 1 }
    else { sliderIndex = n }

    for (let slide of slides) {
        slide.style.display = "none"
    }

    for (let thumbnail of thumbnails) {
        thumbnail.classList.remove("active")
    }

    slides[sliderIndex].style.display = "block"
    thumbnails[sliderIndex].classList.add("active")

    scrollThumbnailsToActive()
}


function showImageInSlider(imageFiles) {
    const slider = document.getElementById('slider-product-container')
    const thumbnails = document.getElementById('thumbnails')

    document.querySelectorAll('.slider-img').forEach(element => element.remove())

    thumbnails.innerHTML = ''

    const imagesPromise = imageFiles.map(image => {
        return new Promise((resolve) => {
            resolve({src: `http://127.0.0.1:8000${image.image_file}`}) 
        })
    })

    Promise.all(imagesPromise).then(images => {
        images.forEach((src, index) => {
            const img_container = document.createElement('div')
            img_container.classList.add('slider-img')
            slider.insertBefore(img_container, document.getElementById('thumbnail-container'))

            const img_number = document.createElement('div')
            img_number.innerHTML = (index + 1) + '/' + (images.length)
            img_number.classList.add('numberText')
            img_container.appendChild(img_number)

            const img_d = document.createElement('div')
            img_d.classList.add('d-flex', 'justify-content-center', 'align-items-center')
            img_d.style.backgroundColor = 'white;'
            img_container.appendChild(img_d)

            const img = document.createElement('img')
            img.classList.add('product-img')
            img.src = src.src
            img_d.appendChild(img)


            const thumbnail_container = document.createElement('div')
            thumbnail_container.classList.add('column')
            thumbnails.appendChild(thumbnail_container)

            const thumbnail_img = document.createElement('img')
            thumbnail_img.src = src.src
            thumbnail_img.classList.add('demo', 'cursor')
            thumbnail_img.onclick = () => {
                currentSlide(index)
            }
            thumbnail_container.appendChild(thumbnail_img)

            if(index === 0) {
                showSlides(sliderIndex)
            }
        })     
    })
}

document.getElementById('addCartItemBtn').addEventListener('click', (event) => {
    event.preventDefault();
    addCartItem(event)
})

// -----------------------------------------------------
// Thêm sản phẩm vào giỏ hàng
// -----------------------------------------------------

async function addCartItem(event, item) {
    event.stopPropagation();

    console.log('cart item id:', item)

    const user = JSON.parse(sessionStorage.getItem('user'))
    if (!user) {
        loadLoginModal(button)
    }

    else {
        const accessToken = await getValidAccessToken()

        const quantity = document.getElementById('quantity').value
        const variant = document.querySelector('#variantContainer > .active').getAttribute('data-variant-id')

        fetch(`http://127.0.0.1:8000/api/orders/cart-items/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                // cart: parseInt(user.cart),
                variant_id: parseInt(variant),
                quantity: parseInt(quantity) || 1,
            })
        })
        .then(response => response.json())
        .then(data => {
            alert('Thêm sản phẩm vào giỏ hàng thành công!')
            console.log('cart:', data)
        })
        .catch(error => console.error('Error adding cart item:', error))
    }
}



// ----------------------------------------------------------------
// Tải sản phẩm tương tự
// ----------------------------------------------------------------

async function getRelatedProducts(product) {

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/products/product_info/?category__name__icontains=${product.category.name}&&page_size=8`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (!response.ok) {
            window.location.href = './not_found.html';
            console.log('Lỗi khi tải sản phẩm tương tự')
        }

        const data = await response.json()

        console.log(data)
    
        if (data.results.length > 0) {
            renderProductList(data.results, document.getElementById('relatedProductContainer'))
        }
        
        else {
            document.getElementById('relatedProductContainer').innerHTML = '<p class="text-note">Không tìm thấy sản phẩm tương tự</p>'
            console.log('Không tìm thấy sản phẩm tương tự')
        }
    }

    catch (error) {
        console.log('Error fetching related products:', error)
    }
}


// ----------------------------------------------------------------
// Tải mã giảm giá
// ----------------------------------------------------------------

async function fetchCoupons() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/discounts/coupons/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        
        if (!response.ok) {
            window.location.href = './not_found.html';
            console.log('Lỗi khi tải mã giảm giá')
        }

        const data = await response.json()

        console.log(data)

        return data
    }   

    catch (error) {
        console.log('Error fetching coupons:', error)
    }
}

async function renderCoupons() {
    const data = await fetchCoupons()
    console.log(data)
    if (data.length != 0) {
        const couponContainer = document.getElementById('couponContainer')
        couponContainer.classList.add('d-flex', 'flex-column')
        couponContainer.style.display = 'block'

        const ul = couponContainer.querySelector('.ul')
        data.forEach((coupon, index) => {
            if (index < 3) {
                const couponItem = document.createElement('li')
                couponItem.innerHTML = coupon.description
                
                ul.appendChild(couponItem)
            }
        })
    }
}



// ----------------------------------------------------------------
// Thêm sản phẩm vào giỏ hàng
// ----------------------------------------------------------------

async function addCartItem(event, item) {
    event.stopPropagation();

    console.log('cart item id:', item)

    const user = JSON.parse(sessionStorage.getItem('user'))
    if (!user) {
        showLoginModal()
    }

    else {
        const accessToken = await getValidAccessToken()

        const quantity = document.getElementById('quantity').value
        const variant = document.querySelector('#variantContainer > .active').getAttribute('data-variant-id')

        fetch(`http://127.0.0.1:8000/api/carts/cart_items/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                // cart: parseInt(user.cart),
                variant_id: parseInt(variant),
                quantity: parseInt(quantity) || 1,
            })
        })
        .then(response => response.json())
        .then(data => {
            alert('Thêm sản phẩm vào giỏ hàng thành công!')
            console.log('cart:', data)
        })
        .catch(error => console.error('Error adding cart item:', error))
    }
}


document.getElementById('quantity').addEventListener('blur', () => {
    const quantity = document.getElementById('quantity')

    if (quantity.value < 1) {
        quantity.value = 1
    }

    const stock = parseInt(document.getElementById('stockInfo').getAttribute('data-stock'))
    if (quantity.value > stock) {
        quantity.value = stock
    }
})