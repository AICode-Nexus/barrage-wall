# 实时弹幕上墙

一个可以直接部署到免费公网 VPS 的实时弹幕工具。大屏打开后自动创建房间并显示二维码，观众扫码进入手机投稿页，发送后通过 WebSocket 直接上墙。

## 功能

- `#/wall/:roomId`：大屏弹幕墙，显示二维码、连接状态、最近弹幕和新建房间按钮。
- `#/send/:roomId`：手机投稿页，支持可选昵称、80 字内容限制和 2 秒冷却。
- Node/Express 提供静态页面、HTTP API 和 WebSocket 实时广播。
- 弹幕保存到本地 JSON 文件，按房间隔离，最近 100 条历史会在大屏打开时加载。

## 本地开发

```bash
npm install
npm run dev
```

默认前端由 Vite 启动，服务端监听 `8080`。开发时可以打开：

```text
http://localhost:5173
```

## 生产运行

```bash
npm ci
npm run build
PORT=8080 DATA_DIR=/opt/barrage-wall/data npm start
```

打开公网入口：

```text
http://你的公网IP:8080
```

页面会自动跳到新房间，例如：

```text
http://你的公网IP:8080/#/wall/room-a1b2c3d4
```

大屏页上的二维码会指向：

```text
http://你的公网IP:8080/#/send/room-a1b2c3d4
```

## Oracle Always Free VPS 部署参考

1. 创建 Oracle Cloud Always Free VM，选择 Ubuntu。
2. 在云控制台安全列表/网络安全组里放行 TCP `8080`。
3. 登录服务器安装 Node.js 20+。
4. 克隆 GitHub 仓库并进入目录。
5. 执行生产运行命令。
6. 活动前用手机流量访问 `http://公网IP:8080`，确认二维码和发送页可打开。

可选 systemd 服务：

```ini
[Unit]
Description=Barrage Wall
After=network.target

[Service]
WorkingDirectory=/opt/barrage-wall
Environment=NODE_ENV=production
Environment=PORT=8080
Environment=DATA_DIR=/opt/barrage-wall/data
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

保存为 `/etc/systemd/system/barrage-wall.service` 后执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now barrage-wall
sudo systemctl status barrage-wall
```

## 测试

```bash
npm test
npm run build
```

## 现场注意

- 没有域名时建议使用 HTTP：`http://公网IP:端口`。
- 如果服务器在中国大陆，公开网站通常涉及备案要求；境外免费 VPS 更符合“无域名、全免费、公网 IP 可访问”的目标。
- 第一版没有后台审核/删除功能，适合可信现场；公开大活动建议后续加主持人控制台。
