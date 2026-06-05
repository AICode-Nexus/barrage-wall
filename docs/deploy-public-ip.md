# 公网 IP/VPS 备用部署说明

> 当前首选部署方式是 EdgeOne Pages，见 `docs/deploy-edgeone.md`。本文件仅用于未来有 VPS 或公网 IP 时的备用部署。

## 适用场景

- 没有域名。
- 接受用 `http://公网IP:端口` 做二维码入口。
- 可以使用 Oracle Cloud Always Free 等境外免费 VPS。

## 服务器端口

应用默认监听 `8080`，需要在云平台防火墙和系统防火墙同时放行：

```bash
sudo ufw allow 8080/tcp
```

Oracle Cloud 还需要在 VCN 的 Security List 或 Network Security Group 中添加 ingress rule：

```text
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 8080
```

## 部署命令

```bash
git clone <你的仓库地址> /opt/barrage-wall
cd /opt/barrage-wall
npm ci
npm run build
PORT=8080 DATA_DIR=/opt/barrage-wall/data npm start
```

## 验收

1. 大屏电脑访问 `http://公网IP:8080`。
2. 页面自动进入 `#/wall/:roomId` 并显示二维码。
3. 手机扫码进入 `#/send/:roomId`。
4. 发送一条弹幕，大屏 1 秒内出现。
5. 分别用现场 Wi-Fi 和手机流量测试一次。
