# EdgeOne Pages 部署说明

## 目标

不用 VPS、不买域名，把弹幕墙部署成 EdgeOne Pages 活动版：

```text
React 静态页面
+ Edge Functions API
+ EdgeOne KV
+ 大屏 1 秒轮询
```

## EdgeOne 配置

1. 进入 EdgeOne Pages，连接 GitHub 仓库：

```text
https://github.com/AICode-Nexus/barrage-wall
```

2. 构建命令：

```bash
npm ci && npm run build:edgeone
```

3. 输出目录：

```text
dist
```

4. 创建 KV 命名空间并绑定到 Pages 项目，变量名必须是：

```text
BARRAGE_KV
```

5. 部署完成后，在活动开始前生成/打开预览链接。

## 验收

1. 大屏打开 EdgeOne 预览链接。
2. 页面自动进入 `#/wall/:roomId` 并显示二维码。
3. 手机扫码进入 `#/send/:roomId`。
4. 发送一条弹幕。
5. 大屏 1 秒左右出现弹幕。
6. 分别用现场 Wi-Fi 和手机流量测试一次。

## 限制

- 无域名时，EdgeOne 的大陆预览链接是临时活动入口，不是长期固定链接。
- KV 是最终一致存储；如果现场网络或边缘节点同步慢，弹幕可能有数秒延迟。
- 第一版没有审核后台，公开活动要谨慎使用。
