# 实时弹幕上墙

一个适合活动现场的实时弹幕上墙工具。第一推荐部署方式是 **EdgeOne Pages 活动版**：不用 VPS、不用域名，前端静态页面配合 Edge Functions + KV 存储，大屏每秒同步新弹幕。

## 功能

- `#/wall/:roomId`：大屏弹幕墙，显示二维码、同步状态、最近弹幕和新建房间按钮。
- `#/send/:roomId`：手机投稿页，支持可选昵称、80 字内容限制和 2 秒冷却。
- Edge Functions 提供 HTTP API，KV 按房间保存弹幕。
- 大屏每 1 秒拉取最近 100 条弹幕并合并显示。

## 本地开发

```bash
npm install
npm run dev
```

本地默认仍会启动 Node 兼容服务，方便开发时模拟 API：

```text
http://localhost:5173
```

## EdgeOne Pages 部署

1. 把仓库导入 EdgeOne Pages。
2. 构建命令填写：

```bash
npm ci && npm run build:edgeone
```

3. 输出目录填写：

```text
dist
```

4. 在 EdgeOne Pages 中创建 KV 命名空间，并绑定变量名：

```text
BARRAGE_KV
```

5. 部署后打开预览链接。无域名时，活动开始前生成预览链接并用大屏打开，页面会自动创建房间二维码。

## API

```text
GET  /api/rooms/:roomId/messages
POST /api/rooms/:roomId/messages
```

POST body：

```json
{
  "nickname": "可选昵称",
  "body": "弹幕内容"
}
```

## 测试

```bash
npm run lint
npm test
npm run build
```

## 备用：公网 IP/VPS 版

仓库仍保留 Node/Express/WebSocket 服务端，适合未来有免费 VPS 或公网 IP 时使用：

```bash
npm ci
npm run build
PORT=8080 DATA_DIR=/opt/barrage-wall/data npm start
```

访问：

```text
http://公网IP:8080
```

## 现场注意

- EdgeOne Pages 无自定义域名时，国内可访问的预览链接适合临时活动使用，活动前务必用现场 Wi-Fi 和手机流量各测一次。
- EdgeOne KV 是最终一致存储；本工具用 1 秒轮询，50 人以内现场互动通常够用，但正式活动前要做实测。
- 第一版没有后台审核/删除功能，适合可信现场；公开大活动建议后续加主持人控制台。
