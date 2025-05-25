// 服务器状态检查脚本
async function checkServerStatus() {
    const serverStatusElement = document.querySelector('.server-status');
    const statusIndicator = serverStatusElement.querySelector('.status-indicator');
    const statusText = serverStatusElement.querySelector('span');
    const onlineCountElement = document.querySelector('.info-card:nth-child(1) p');
    const versionElement = document.querySelector('.info-card:nth-child(3) p');

    try {
        // 设置超时时间为5秒
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://api.miri.site/mcPlayer/get.php?ip=goldencarrot.xyz&port=25565', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();
        console.log('服务器API响应数据:', data);  // 添加调试日志

        // 检查响应数据的完整性
        if (!data) {
            throw new Error('API返回数据为空');
        }

        // 更详细的在线状态判断
        if (data.online === true && typeof data.online !== 'undefined') {
            // 服务器在线
            statusIndicator.style.backgroundColor = 'var(--secondary)';
            statusText.textContent = '服务器在线';
            onlineCountElement.textContent = `${data.online || 0}/${data.max || 0}`;
            versionElement.textContent = data.version || '--';

            // 显示在线玩家列表
            if (data.sample && Array.isArray(data.sample) && data.sample.length > 0) {
                const playerList = document.createElement('div');
                playerList.className = 'player-list';
                playerList.innerHTML = `
                    <h4>在线玩家</h4>
                    <ul>
                        ${data.sample.map(player => `<li>${player.name}</li>`).join('')}
                    </ul>
                `;
                
                // 检查并移除旧的玩家列表
                const oldPlayerList = serverStatusElement.querySelector('.player-list');
                if (oldPlayerList) {
                    oldPlayerList.remove();
                }
                
                serverStatusElement.appendChild(playerList);
            }
        } else {
            throw new Error('服务器状态显示为离线');
        }
    } catch (error) {
        // 详细的错误处理
        console.error('服务器状态检查失败:', error.message);
        
        // 服务器离线或发生错误
        statusIndicator.style.backgroundColor = '#e74c3c';
        statusText.textContent = error.name === 'AbortError' ? '连接超时' : '服务器离线';
        onlineCountElement.textContent = '--/--';
        versionElement.textContent = '--';

        // 移除玩家列表（如果存在）
        const playerList = serverStatusElement.querySelector('.player-list');
        if (playerList) {
            playerList.remove();
        }
    }
}

// 页面加载完成后立即检查服务器状态
document.addEventListener('DOMContentLoaded', () => {
    checkServerStatus();
    // 每60秒更新一次服务器状态
    setInterval(checkServerStatus, 60000);
});