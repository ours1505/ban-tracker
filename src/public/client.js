const socket = io();
let chart;
let currentTimeRange = '1min';
let banHistory = [];

function log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    if (data) {
        console.log(`[${timestamp}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

// Socket.io 连接事件监听
socket.on('connect', () => {
    log('WebSocket 已连接');
});

socket.on('connect_error', (error) => {
    log('WebSocket 连接错误:', error);
});

socket.on('disconnect', () => {
    log('WebSocket 已断开');
});

function createChart(ctx) {
    log('创建图表...');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Watchdog Bans',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    hitRadius: 10,
                    cubicInterpolationMode: 'monotone',
                    borderWidth: 2
                },
                {
                    label: 'Staff Bans',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    hitRadius: 10,
                    cubicInterpolationMode: 'monotone',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 10,
                    left: 10,
                    top: 20,
                    bottom: 25
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        boxWidth: 6,
                        font: {
                            size: 14
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Ban Rate',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        padding: 10
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        maxRotation: 45,
                        minRotation: 45,
                        padding: 15
                    }
                }
            }
        }
    });
}

function aggregateData(data, timeRange) {
    const aggregated = [];
    if (!data.length) return aggregated;
    const now = Date.now();
    
    // 根据时间范围过滤数据
    let filterTime;
    switch(timeRange) {
        case '24h':
            filterTime = now - 24 * 60 * 60 * 1000;
            break;
        case '1h':
            filterTime = now - 60 * 60 * 1000;
            break;
        case '10min':
            filterTime = now - 10 * 60 * 1000;
            break;
        case '1min':
            filterTime = now - 60 * 1000;
            break;
    }
    
    const filteredData = data.filter(d => d.timestamp > filterTime);

    if (timeRange === '24h') {
        // 按小时聚合
        const hourlyData = {};
        filteredData.forEach(d => {
            const hourKey = Math.floor(d.timestamp / (60 * 60 * 1000));
            if (!hourlyData[hourKey]) {
                hourlyData[hourKey] = {
                    timestamp: d.timestamp,
                    watchdog_increment: 0,
                    staff_increment: 0
                };
            }
            hourlyData[hourKey].watchdog_increment += d.watchdog_increment;
            hourlyData[hourKey].staff_increment += d.staff_increment;
        });
        return Object.values(hourlyData);
    } else if (timeRange === '1h') {
        // 按分钟聚合
        const minuteData = {};
        filteredData.forEach(d => {
            const minute = Math.floor(d.timestamp / (60 * 1000));
            if (!minuteData[minute]) {
                minuteData[minute] = {
                    timestamp: d.timestamp,
                    watchdog_increment: 0,
                    staff_increment: 0
                };
            }
            minuteData[minute].watchdog_increment += d.watchdog_increment;
            minuteData[minute].staff_increment += d.staff_increment;
        });
        return Object.values(minuteData);
    } else if (timeRange === '10min') {
        // 按分钟聚合
        const minuteData = {};
        filteredData.forEach(d => {
            const minute = Math.floor(d.timestamp / (60 * 1000));
            if (!minuteData[minute]) {
                minuteData[minute] = {
                    timestamp: d.timestamp,
                    watchdog_increment: 0,
                    staff_increment: 0
                };
            }
            minuteData[minute].watchdog_increment += d.watchdog_increment;
            minuteData[minute].staff_increment += d.staff_increment;
        });
        return Object.values(minuteData);
    } else if (timeRange === '1min') {
        // 1分钟视图,按秒显示
        const secondData = {};
        filteredData.forEach(d => {
            const second = Math.floor(d.timestamp / 1000);
            if (!secondData[second]) {
                secondData[second] = {
                    timestamp: d.timestamp,
                    watchdog_increment: 0,
                    staff_increment: 0
                };
            }
            secondData[second].watchdog_increment += d.watchdog_increment;
            secondData[second].staff_increment += d.staff_increment;
        });
        return Object.values(secondData);
    }

    return filteredData;
}

function updateChartWithHistory() {
    log('使用历史数据更新图表');
    const now = Date.now();
    let filterTime;
    
    switch(currentTimeRange) {
        case '1min':
            filterTime = now - 60 * 1000;
            chart.options.plugins.title.text = 'Ban Rate (per second)';
            break;
        case '10min':
            filterTime = now - 10 * 60 * 1000;
            chart.options.plugins.title.text = 'Ban Rate (per minute)';
            break;
        case '1h':
            filterTime = now - 60 * 60 * 1000;
            chart.options.plugins.title.text = 'Ban Rate (per minute)';
            break;
        case '24h':
            filterTime = now - 24 * 60 * 60 * 1000;
            chart.options.plugins.title.text = 'Ban Rate (per hour)';
            break;
    }
    
    const filteredData = banHistory.filter(d => d.timestamp > filterTime);
    const aggregatedData = aggregateData(filteredData, currentTimeRange);
    
    // 计算最大值并设置合适的Y轴范围
    const maxValue = Math.max(
        ...aggregatedData.map(d => d.watchdog_increment),
        ...aggregatedData.map(d => d.staff_increment)
    );
    
    // 根据数据动态调整Y轴范围
    let yAxisMax;
    if (currentTimeRange === '1min') {
        if (maxValue <= 5) {
            yAxisMax = 5;
        } else if (maxValue <= 10) {
            yAxisMax = 10;
        } else {
            yAxisMax = Math.ceil(maxValue / 5) * 5;
        }
    } else if (currentTimeRange === '10min') {
        if (maxValue <= 10) {
            yAxisMax = 10;
        } else if (maxValue <= 20) {
            yAxisMax = 20;
        } else {
            yAxisMax = Math.ceil(maxValue / 10) * 10;
        }
    } else if (currentTimeRange === '1h') {
        if (maxValue <= 20) {
            yAxisMax = 20;
        } else {
            yAxisMax = Math.ceil(maxValue / 10) * 10;
        }
    } else { // 24h
        if (maxValue <= 300) {
            yAxisMax = 300;
        } else {
            yAxisMax = Math.ceil(maxValue / 100) * 100;
        }
    }
    
    // 设置Y轴范围和刻度
    chart.options.scales.y = {
        beginAtZero: true,
        max: yAxisMax,
        grid: {
            display: false
        },
        ticks: {
            font: {
                size: 12
            },
            padding: 10,
            stepSize: calculateStepSize(yAxisMax)
        }
    };
    
    chart.data.labels = aggregatedData.map(d => {
        const date = new Date(d.timestamp);
        if (currentTimeRange === '24h') {
            return `${date.getHours()}:00`;
        } else if (currentTimeRange === '10min' && d.timestamp > now - 30 * 1000) {
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
        } else {
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit'
            });
        }
    });
    
    chart.data.datasets[0].data = aggregatedData.map(d => d.watchdog_increment);
    chart.data.datasets[1].data = aggregatedData.map(d => d.staff_increment);
    
    chart.update();
}

// 计算合适的刻度步长
function calculateStepSize(max) {
    if (max <= 10) return 1;
    if (max <= 20) return 2;
    if (max <= 50) return 5;
    if (max <= 100) return 10;
    if (max <= 500) return 50;
    if (max <= 1000) return 100;
    return Math.ceil(max / 10);
}

document.addEventListener('DOMContentLoaded', () => {
    log('页面加载完成');
    const ctx = document.getElementById('banChart');
    if (!ctx) {
        log('错误: 找不到 canvas 元素');
        return;
    }
    
    try {
        chart = createChart(ctx);
        log('图表创建成功');
    } catch (error) {
        log('创建图表时出错:', error);
        return;
    }
    
    // 添加时间范围选择按钮
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'time-range-buttons';
    buttonContainer.innerHTML = `
        <button class="active" data-range="1min">1 Minute</button>
        <button data-range="10min">10 Minutes</button>
        <button data-range="1h">1 Hour</button>
        <button data-range="24h">24 Hours</button>
    `;
    ctx.parentElement.insertBefore(buttonContainer, ctx);
    
    // 时间范围切换事件
    buttonContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            log('切换时间范围:', e.target.dataset.range);
            currentTimeRange = e.target.dataset.range;
            buttonContainer.querySelectorAll('button').forEach(btn => 
                btn.classList.toggle('active', btn === e.target)
            );
            updateChartWithHistory();
        }
    });
    
    socket.on('historyData', (history) => {
        log('收到历史数据:', history);
        if (Array.isArray(history)) {
            banHistory = history;
            updateChartWithHistory();
        } else {
            log('错误: 收到的历史数据格式不正确');
        }
    });
    
    socket.on('banUpdate', (data) => {
        log('收到实时更新:', data);
        
        // 添加新数据到历史记录
        banHistory.push(data);
        
        // 移除超过24小时的数据
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        banHistory = banHistory.filter(d => d.timestamp > oneDayAgo);
        
        // 更新图表
        updateChartWithHistory();
        
        if (data.watchdog_increment > 0) {
            log(`Watchdog 封禁了 ${data.watchdog_increment} 个玩家`);
            Toastify({
                text: `Watchdog banned ${data.watchdog_increment} player(s)`,
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {
                    background: "linear-gradient(to right, #ff6b6b, #ff8787)"
                }
            }).showToast();
        }
        
        if (data.staff_increment > 0) {
            log(`Staff 封禁了 ${data.staff_increment} 个玩家`);
            Toastify({
                text: `Staff banned ${data.staff_increment} player(s)`,
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {
                    background: "linear-gradient(to right, #4facfe, #00f2fe)"
                }
            }).showToast();
        }
    });

    // 添加在线人数更新监听
    socket.on('onlineUsers', (count) => {
        const onlineUsersElement = document.getElementById('online-users');
        if (onlineUsersElement) {
            onlineUsersElement.textContent = `在线: ${count}`;
        }
    });
});

// 添加错误处理
window.onerror = function(msg, url, line, col, error) {
    log('全局错误:', { msg, url, line, col, error });
    return false;
};

window.addEventListener('unhandledrejection', function(event) {
    log('未处理的 Promise 错误:', event.reason);
}); 