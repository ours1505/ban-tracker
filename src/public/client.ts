declare const io: any;
declare const Chart: any;
declare const Toastify: any;

const socket = io();
let lastData = { watchdog_total: 0, staff_total: 0 };

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('banChart') as HTMLCanvasElement;
    if (!ctx) {
        console.error('Cannot find canvas element');
        return;
    }

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Watchdog Bans',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Staff Bans',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Ban Count Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Total Bans'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            }
        }
    });

    socket.on('banUpdate', (data: any) => {
        console.log('Received data:', data);  // 添加调试日志
        
        if (data.watchdog_total > lastData.watchdog_total) {
            Toastify({
                text: `Watchdog banned ${data.watchdog_total - lastData.watchdog_total} player(s)`,
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {
                    background: "linear-gradient(to right, #ff6b6b, #ff8787)"
                }
            }).showToast();
        }
        
        if (data.staff_total > lastData.staff_total) {
            Toastify({
                text: `Staff banned ${data.staff_total - lastData.staff_total} player(s)`,
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {
                    background: "linear-gradient(to right, #4facfe, #00f2fe)"
                }
            }).showToast();
        }

        lastData = data;
        updateChart(chart, data);
    });
});

function updateChart(chart: any, data: any) {
    const now = new Date().toLocaleTimeString();
    
    if (chart.data.labels.length > 60) {
        chart.data.labels.shift();
        chart.data.datasets.forEach((dataset: any) => dataset.data.shift());
    }
    
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(data.watchdog_total);
    chart.data.datasets[1].data.push(data.staff_total);
    
    chart.update('none'); // 使用 'none' 模式来优化性能
} 