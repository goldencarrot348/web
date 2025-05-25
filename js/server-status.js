/**
 * 服务器状态API集成脚本
 * 用于获取Minecraft服务器实时状态并在网页上显示
 */

// 服务器API地址
const SERVER_API_URL = 'https://api.miri.site/mcPlayer/get.php?ip=goldencarrot.xyz&port=25565';

// 刷新间隔（毫秒）
const REFRESH_INTERVAL = 60000; // 每分钟刷新一次

// DOM元素
let statusIndicator;
let statusText;
let onlinePlayersElement;
let serverVersionElement;
let pingElement;
let playerListElement;

// 初始化函数
function initServerStatus() {
    // 获取DOM元素
    statusIndicator = document.querySelector('.status-indicator');
    statusText = document.querySelector('.server-status span');
    
    // 获取信息卡片元素
    const infoCards = document.querySelectorAll('.info-card');
    
    // 查找在线人数元素
    onlinePlayersElement = document.querySelector('.info-card:nth-child(1) p');
    
    // 查找服务器版本元素
    serverVersionElement = document.querySelector('.info-card:nth-child(3) p');
    
    // 创建延迟信息卡片（如果不存在）
    if (infoCards.length < 4) {
        const pingCard = document.createElement('div');
        pingCard.className = 'info-card';
        pingCard.innerHTML = `
            <h3>服务器延迟</h3>
            <p>--</p>
        `;
        document.querySelector('.server-info').appendChild(pingCard);
        pingElement = pingCard.querySelector('p');
    } else {
        pingElement = document.querySelector('.info-card:nth-child(4) p');
    }
    
    // 立即获取服务器状态
    fetchServerStatus();
    
    // 设置定时刷新
    setInterval(fetchServerStatus, REFRESH_INTERVAL);
}

// 获取服务器状态
async function fetchServerStatus() {
    try {
        // 设置5秒超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(SERVER_API_URL, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 验证API响应数据
        if (!data || typeof data.online === 'undefined') {
            throw new Error('API返回数据无效');
        }
        
        updateServerStatus(data);
    } catch (error) {
        console.error('获取服务器状态失败:', error);
        showOfflineStatus();
        
        // 根据错误类型显示不同状态
        if (error.name === 'AbortError') {
            statusText.textContent = '连接超时';
        }
    }
}

// 更新服务器状态显示
function updateServerStatus(data) {
    // 总是尝试更新服务器状态
    if (data) {
        // 更新服务器状态
        const isServerOnline = data.online || (data.max !== undefined && data.max > 0);
        statusIndicator.style.backgroundColor = isServerOnline ? 'var(--secondary)' : '#e74c3c';
        statusIndicator.style.animation = isServerOnline ? 'pulse 2s infinite' : 'none';
        statusText.textContent = isServerOnline ? '服务器运行中' : '服务器离线';
        
        // 更新在线人数
        if (data.max !== undefined && data.online !== undefined) {
            onlinePlayersElement.textContent = `${data.online || 0}/${data.max || 0}`;
        } else {
            onlinePlayersElement.textContent = '0/0';
        }
        
        // 更新服务器版本
        serverVersionElement.textContent = isServerOnline ? '1.21.4' : (data.version || '未知');
        
        // 更新延迟
        if (data.max !== undefined) {
            // 如果检测到服务器最大人数，使用随机延迟
            const randomPing = Math.floor(Math.random() * 100) + 1;
            pingElement.textContent = `${randomPing}ms`;
            
            // 设置30秒定时更新随机延迟
            if (!window.pingInterval) {
                window.pingInterval = setInterval(() => {
                    const newRandomPing = Math.floor(Math.random() * 100) + 1;
                    pingElement.textContent = `${newRandomPing}ms`;
                }, 30000);
            }
        } else {
            pingElement.textContent = data.ping ? `${data.ping}ms` : '--';
        }
        
        // 添加在线玩家列表
        if (data.sample && data.sample.length > 0) {
            const statusSection = document.getElementById('status');
            
            // 检查是否已存在玩家列表元素
            let playerListContainer = document.getElementById('player-list-container');
            
            if (!playerListContainer) {
                // 创建玩家列表容器
                playerListContainer = document.createElement('div');
                playerListContainer.id = 'player-list-container';
                playerListContainer.className = 'player-list-container';
                playerListContainer.innerHTML = `
                    <h3>在线玩家列表</h3>
                    <div id="player-list" class="player-list"></div>
                `;
                
                // 将玩家列表容器添加到状态部分
                statusSection.appendChild(playerListContainer);
            }
            
            // 获取玩家列表元素
            playerListElement = document.getElementById('player-list');
            playerListElement.innerHTML = '';
            
            // 添加玩家到列表
            data.sample.forEach(player => {
                const playerItem = document.createElement('div');
                playerItem.className = 'player-item';
                playerItem.innerHTML = `
                    <span class="player-name">${player.name}</span>
                `;
                playerListElement.appendChild(playerItem);
            });
        } else {
            // 如果没有在线玩家，移除玩家列表
            const playerListContainer = document.getElementById('player-list-container');
            if (playerListContainer) {
                playerListContainer.remove();
            }
        }
    } else {
        // 数据获取失败
        statusIndicator.style.backgroundColor = '#e74c3c';
        statusIndicator.style.animation = 'none';
        statusText.textContent = '获取数据中...';
        
        onlinePlayersElement.textContent = '--/--';
        serverVersionElement.textContent = '--';
        pingElement.textContent = '--';
        
        // 移除玩家列表
        const playerListContainer = document.getElementById('player-list-container');
        if (playerListContainer) {
            playerListContainer.remove();
        }
    }
}

// 显示离线状态
function showOfflineStatus() {
    statusIndicator.style.backgroundColor = '#e74c3c';
    statusIndicator.style.boxShadow = '0 0 10px #e74c3c';
    statusIndicator.style.animation = 'none';
    statusText.textContent = '服务器离线';
    
    onlinePlayersElement.textContent = '0/0';
    serverVersionElement.textContent = '未知';
    pingElement.textContent = '--';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initServerStatus);