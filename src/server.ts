import { Server } from "socket.io"
import express from "express"
import http from "http"
import cors from "cors"
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as dotenv from 'dotenv'
import { saveBanHistory, loadBanHistory } from './utils/storage'
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface BanData {
  timestamp: number;
  watchdog_total: number;
  staff_total: number;
  watchdog_increment: number;
  staff_increment: number;
}

let banHistory: BanData[] = []
loadBanHistory().then(history => {
  banHistory = history
  log('已加载历史数据:', banHistory.length)
})

let lastData = null;
let isFirstFetch = true;
let onlineUsers = 0;

// 添加日志函数
function log(message: string, data: any = null) {
    const timestamp = new Date().toLocaleTimeString();
    if (data) {
        console.log(`[${timestamp}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

// 获取IP的函数
async function getPublicIP() {
    try {
        const response = await fetch('https://api.ip.sb/ip');
        const ip = await response.text();
        log('当前公网 IP:', ip.trim());
    } catch (error) {
        log('获取公网 IP 失败:', error);
    }
}

// 在启动服务器前先获取 IP
await getPublicIP()

if (!process.env.HYPIXEL_API_KEY) {
    log('错误: 未找到 HYPIXEL_API_KEY 环境变量');
    process.exit(1)
}

const app = express()
app.use(cors())
app.use(express.static(join(__dirname, 'public')))

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*"
  }
})

let lastRequestTime = 0
async function fetchHypixelData() {
  const now = Date.now()
  if (now - lastRequestTime < 1000) {
    log('使用缓存数据（API 限制）')
    return null
  }

  lastRequestTime = now
  try {
    log('请求 Hypixel API...')
    const response = await fetch("https://api.hypixel.net/v2/punishmentstats", {
      headers: {
        "API-Key": process.env.HYPIXEL_API_KEY
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      log('Hypixel API 错误:', errorData)
      return null
    }
    
    const data = await response.json()

    if (isFirstFetch) {
      log('首次获取数据，设置基准值')
      lastData = {
        watchdog_total: data.watchdog_total,
        staff_total: data.staff_total
      }
      isFirstFetch = false
      return null
    }

    if (!lastData) {
      log('错误: lastData 未初始化')
      return null
    }
    
    const banData: BanData = {
      timestamp: now,
      watchdog_total: data.watchdog_total,
      staff_total: data.staff_total,
      watchdog_increment: data.watchdog_total - lastData.watchdog_total,
      staff_increment: data.staff_total - lastData.staff_total
    }

    lastData = {
      watchdog_total: data.watchdog_total,
      staff_total: data.staff_total
    }

    banHistory.push(banData)
    
    // 只保留最近24小时的数据
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    banHistory = banHistory.filter(data => data.timestamp > oneDayAgo)
    
    log('新数据:', banData)
    await saveBanHistory(banHistory)
    return banData
  } catch (error) {
    log('请求数据时出错:', error)
    return null
  }
}

io.on("connection", (socket) => {
  log('客户端连接');
  onlineUsers++;
  io.emit('onlineUsers', onlineUsers);
  
  socket.emit('historyData', banHistory);
  
  socket.on("disconnect", () => {
    log('客户端断开连接');
    onlineUsers--;
    io.emit('onlineUsers', onlineUsers);
  });
})

// 等待首次获取数据完成后再开始定时更新
setTimeout(async () => {
  await fetchHypixelData() // 获取基准值
  
  setInterval(async () => {
    const data = await fetchHypixelData()
    if (data) {
      io.emit("banUpdate", data)
    }
  }, 1000)
}, 0)

server.listen(3000, () => {
  log('服务器运行在端口 3000')
})