document.addEventListener('DOMContentLoaded', async () => {

    showWeekRevenue()
    showDayRevenue()
    showMonthRevenue()
    showYearRevenue()
})

async function showWeekRevenue() {
    const revenue = await getRevenue('week')
    
    console.log(revenue)

    const ctx = document.getElementById('weekChart').getContext('2d');
    const revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(revenue),
            datasets: [{
                label: 'Doanh thu (triệu VNĐ)',
                data: Object.values(revenue),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true       // trục y bắt đầu từ số 0
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Doanh thu 7 ngày gần đây', // Tiêu đề của biểu đồ
                    font: {
                        size: 18 // Kích thước của tiêu đề
                    },
                    position: 'bottom', // vị trí tiêu đề
                }
            }
        }
    });
}


async function showDayRevenue() {
    const revenue = await getRevenue('date')

    const today = new Date()
    const nextMonth = today.getMonth() + 1
    const year = today.getFullYear();

    // Tạo một đối tượng Date cho ngày đầu tiên của tháng sau
    const firstDayOfNextMonth = new Date(year, nextMonth, 1);
    
    // Trừ đi một ngày để có ngày cuối cùng của tháng hiện tại
    const lastDayOfCurrentMonth = new Date(firstDayOfNextMonth - 1);

    if (Object.keys(revenue).length < lastDayOfCurrentMonth.getDate()) {
        for (let i = Object.keys(revenue).length + 1; i <= lastDayOfCurrentMonth.getDate(); i++) {
            revenue[i] = 0
        }
    }
    
    console.log(revenue)

    const ctx = document.getElementById('dayChart').getContext('2d');
    const revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(revenue),
            datasets: [{
                label: 'Doanh thu (triệu VNĐ)',
                data: Object.values(revenue),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Doanh thu các ngày trong tháng', // Tiêu đề của biểu đồ
                    font: {
                        size: 18 // Kích thước của tiêu đề
                    },
                    position: 'bottom',
                }
            }
        }
    });
}


async function showMonthRevenue() {
    const revenue = await getRevenue('month')

    if (Object.keys(revenue).length < 12) {
        for (let i = Object.keys(revenue).length + 1; i <= 12; i++) {
            revenue[i] = 0
        }
    }
    
    console.log(revenue)

    const ctx = document.getElementById('monthChart').getContext('2d');
    const revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(revenue),
            datasets: [{
                label: 'Doanh thu (triệu VNĐ)',
                data: Object.values(revenue),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Doanh thu các tháng trong năm', // Tiêu đề của biểu đồ
                    font: {
                        size: 18 // Kích thước của tiêu đề
                    },
                    position: 'bottom',
                }
            }
        }
    });
}

async function showYearRevenue() {
    const revenue = await getRevenue('year')
    
    console.log(revenue)

    const ctx = document.getElementById('yearChart').getContext('2d');
    const revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(revenue),
            datasets: [{
                label: 'Doanh thu (triệu VNĐ)',
                data: Object.values(revenue),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Doanh thu theo từng năm', // Tiêu đề của biểu đồ
                    font: {
                        size: 18 // Kích thước của tiêu đề
                    },
                    position: 'bottom',
                }
            }
        }
    });
}


async function getRevenue(query) {
    try {

        const access_token = await getValidAccessToken()
        const response = await fetch(`http://127.0.0.1:8000/api/orders/revenue/?query=${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            }
        })

        if (!response.ok) {
            throw new Error('Failed to fetch revenue data')
        }

        const data = await response.json()

        return data
    }

    catch (error) {
        console.log('Error:', error)
    }
}