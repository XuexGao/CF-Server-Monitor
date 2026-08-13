# [CF-Server-Monitor](https://github.com/huilang-me/CF-Server-Monitor)

一个基于 Cloudflare Workers + D1 + Durable Objects 的多服务器监控探针系统，支持实时监控、历史数据查看、延迟追踪、地图展示等功能。兼容 Linux、OpenWrt、Synology DSM、FreeBSD、macOS、Windows 系统。

**演示地址**：<https://demo.huilang.me/>

**当前Workers版本：V2.8.3 Beta2**

> [!IMPORTANT]
> V2.7.10 加入了 CSP 内容安全策略。Workers 环境通过 HTTP Response Header 下发 CSP，默认只允许同源资源和必要的 Cloudflare/Google Fonts 资源；
>
> 第三方背景图、外部 CSS/JS、字体、图片等资源会被浏览器拦截，需要在管理后台 → 外观 → CSP 设置中加入可信域名白名单后才能加载。
> 
> 这是基于安全考虑，用于降低 XSS、数据注入和未知第三方资源风险。

> [!NOTE]
> **对比其他探针的优势**
>
> - 免费托管在 Cloudflare，稳定性比自己服务器还高，超出免费额度也不扣费。目前支持 60+ 台监控，调整成 120 秒上报间隔后可以翻倍。
> - 安全：无 WebSSH、无命令下发、单向上报，没有所谓的“主控”；Workers 项目只是一个纯收集数据和展示的平台。
> - 其他探针该有的功能基本都有，后续将继续完善。

<details>
<summary>更新记录</summary>

## Workers 版本更新

- V2.8.3 新增磁盘IO统计，切换默认agent为Go版本。新增服务器延时与丢包率的实时窗口统计功能，窗口数据仅随 `/api/servers` 列表返回，`/api/server` 详情接口保留当前单点指标以减少 DO 窗口读取与响应开销。
- V2.8.2 新增 GO 版本支持。
- V2.8.1 优化长时间历史查询的 D1 读行，增加服务器负载通知，优化主题商店接口。主题新增服务器价值统计面板。主题新增Mikus模式。
- V2.8.0 新增主题商店功能，支持一键切换主题。
- V2.7 版本进行了全面重构与功能增强：数据库层面将每日清理改为每月表轮换，减少 D1 消耗，同时优化数据结构使写入减半并支持 60+ 服务器监控；新增国内四线路丢包率监控及历史图表、GPU 字段展示、服务器到期提醒、多分区磁盘统计、计费与自动续费、tags/note 字段、iOS Scriptable 小组件等功能；通知层面新增钉钉、OneBot(QQ)、飞书、Bark 支持，并重构告警模块；交互层面新增环形图显示模式、服务器导入导出、批量推送（5秒/批）、服务器参数下发，优化 Ping 统计改为中位数；安全与兼容方面加入 CSP、JWT 自动生成、跨域配置、多站点验证码登录、macOS 修复，并简化安装流程；探针与运维方面优化客户端脚本减少流量消耗，新增 Agent 自动更新（默认关闭）、GitHub 自动同步及 Workers/Agent 版本升级提示，增加 OS 图标显示，压缩定时任务从 4 个减为 2 个以规避免费额度限制，并修复月度任务导致索引丢失等严重 Bug。
- V2.6 版本重点优化了性能与流量统计体系：将 D1 写入消耗降低 50%，新增月流量统计功能（需后台手动升级数据库并设置重置日期）及月流量校正、首页流量展示；交互层面新增自定义 Ping 设置、上报间隔配置、详情页实时网速展示，并修复启动时间获取错误、TCP/UDP 上报格式问题、网卡流量误统计及 Alpine 环境 UDP 连接数统计错误；部署兼容性方面重构 OpenWrt 安装脚本并新增 OpenRC 服务支持，同时修复方式一部署同步后丢失 API_SECRET 的问题及地图显示异常。部分修复需重新安装脚本生效，2.6.4/2.6.0 升级后务必手动升级数据库结构。
- V2.5.0 增加客户端上报数据后，在不占用D1消耗的情况下，前端WebSocket实时刷新数据
- V2.4.0 版本主要优化了D1读写占用，使项目消耗大大降低，以及增加了防护避免被刷。


## Agent 版本更新

> Go 版本探针已独立为 [cfsm-agent](https://github.com/huilang-me/cfsm-agent) 项目，完整版本记录见 [releases](https://github.com/huilang-me/cfsm-agent/releases)。

Shell版本
- V1.3.8 修复 8/9 月账期计算中前导零导致的 Shell 八进制解析错误
- V1.3.7 添加双栈IP获取
- V1.3.6 添加指定网卡选项，支持指定一个或多个网卡统计网速和月流量，留空保持。优化硬盘统计逻辑。
- V1.3.5 各安装脚本新增采样数据中间变量，拆分完整指标和基础采样字段；新增服务器级 `interface` 参数，支持指定一个或多个网卡统计网速和月流量，留空保持自动汇总
- V1.3.4 添加缓存机制减少资源消耗,新增内核版本指标字段
</details>

## ✨ 功能特点

- 📊 **实时监控**：CPU、GPU、内存、磁盘、网络、进程数、连接数、负载均衡
- 📈 **历史图表**：支持 7 天历史数据查看
- 🌍 **全球地图**：可视化展示服务器分布
- 🔔 **离线告警**：支持 Telegram、企业微信 / 飞书 / Bark / 钉钉 / OneBot 通知
- 📱 **响应式**：支持桌面端和移动端
- 🔄 **自动部署**：GitHub Actions 一键部署
- 🗺️ **网络质量追踪**：国内电信/联通/移动/字节延迟与丢包率监测；`/api/servers` 返回固定 30 点的 1 小时窗口，`/api/server` 不返回窗口数组
- 🔒 **服务器隐藏**：可设置特定服务器对非登录用户隐藏
- ↕️ **拖拽排序**：后台拖拽调整服务器显示顺序
- 🌐 **双语支持**：支持中文和英文界面自由切换
- 🧩 **多站点支持**：可配置多个 API 站点聚合展示，详情页与后台按站点独立访问
- 🧪 **本地测试**：支持本地模拟数据生成，方便开发和测试
- 🔐 **Turnstile 验证**：集成 Cloudflare Turnstile 人机验证，增强 API 安全性
- 🔑 **JWT 认证**：登录系统采用 JWT token 认证，支持自定义密钥
- 🛡️ **CSP 安全策略**：默认限制第三方静态资源加载，可在后台按需添加可信白名单
- 🎨 **主题商店**：后台可选择第三方主题和版本，Workers 仅反代主题 `index.html` 与 `assets/`
- 📉 **额度查询**：后台可查询 Cloudflare D1 与 Workers 当日/昨天用量
- ⚡ **实时推送**：基于 Durable Objects + WebSocket，探针上报后页面立即刷新，无轮询延迟

## 🚀 快速开始

### 前置要求

- [Cloudflare 账户](https://dash.cloudflare.com/)
- [GitHub 账户](https://github.com/)

<details>
<summary>方式一：Cloudflare Workers 连接GitHub仓库（推荐使用，方便同步）图文教程 -> https://huilang.me/cf-server-monitor-setup/</summary>

### 第一步：Fork 项目

点击右上角 **Fork** 按钮，将项目 Fork 到你的 GitHub 账户。

### 第二步：新建 Cloudflare Workers

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
2. 进入 **[Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)**
3. 点击 **Create application**
4. 选择 Continue with GitHub（第一次使用需要连接 GitHub 账户），选择本项目
5. Project Name填写：`cf-server-monitor`
6. Build command 填写：`npm run build:frontend`
7. Deploy command 保留默认值：`npx wrangler deploy`
8. 点击 **Deploy**，成功会在底部显示`✨ Success! Build completed.`

### 第三步：配置环境变量

1. 在当前Workers & Pages页面，点击 **Settings**
2. 在Variables and secrets找到API\_SECRET，点右侧编辑，填写密码（建议使用随机数,不要包含特殊字符比如%），点Deploy保存部署，等待30秒左右部署完成

</details>

<details>
<summary>方式二：GitHub Action 自动部署</summary>

### 第一步：Fork 项目

点击右上角 **Fork** 按钮，将项目 Fork 到你的 GitHub 账户。

### 第二步：创建 D1 数据库

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
2. 进入 **[Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)**  → **[D1 SQL Database](https://dash.cloudflare.com/?to=/:account/workers/d1)**
3. 点击 **Create database**
4. 数据库名称填写：`server-monitor-db`
5. 点击 **Create**
6. 记录下生成的 **Database ID**，稍后会用到

### 第三步：获取 Cloudflare 配置

#### 获取 Account ID

**方式一：从右侧面板获取**

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
2. 在右侧面板找到 **Account ID**
3. 复制保存

**方式二：从 URL 中获取**

- 登录后访问任意 Cloudflare 页面，例如 [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
- URL 中 `dash.cloudflare.com/` 之后的那串字符就是 Account ID

#### 获取 API Token

1. 打开 [API Tokens 页面](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 **Create Token/创建令牌**
3. 选择（**Edit Cloudflare Workers/编辑 Cloudflare Workers**）模板
4. 在 **Account Resources/帐户资源** 选择你的账户
5. 点击 **Continue to summary/继续以显示摘要**→ **Create Token/创建令牌**
6. 复制生成的 Token（只显示一次！）

### 第四步：配置 GitHub Secrets

1. 打开你 Fork 的 GitHub 仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，依次添加以下 5 个密钥：

| Secret 名称        | 值                  | 说明                                     |
| ---------------- | ------------------ | -------------------------------------- |
| `CF_API_TOKEN`   | 第三步获取的 Token       | Cloudflare API 令牌                      |
| `CF_ACCOUNT_ID`  | 第三步获取的 ID          | Cloudflare 账户 ID                       |
| `API_USER_NAME`  | 自定义用户名（非必填）        | 管理后台用户名 新版已移除，默认用户名admin               |
| `API_SECRET`     | API 认证密钥（必填）       | 探针认证密钥 & 默认管理后台密码 建议使用随机密码,不要包含特殊字符比如% |
| `D1_DATABASE_ID` | 第二步获取的 Database ID | D1 数据库 ID                              |
| `API_BASE`       | API 域名（非必填）        | 多站点模式下的 API 地址，多个用逗号分隔                    |
| `CSP_STATIC`     | 静态文件域名（非必填）       | 额外的 CSP 静态资源白名单，多个用逗号分隔；用于第三方背景图、CSS、JS、字体、图片等 |
| `CSP_API`        | API 域名（非必填）        | 额外的 CSP API 白名单，多个用逗号分隔；用于允许前端连接第三方 API/WebSocket |

### 第五步：部署

#### 方式一：自动部署

推送代码到 `main` 分支，GitHub Actions 会自动部署。在仓库的 **Actions** 标签页可查看部署进度。

#### 方式二：手动部署

也可以通过 GitHub Actions 手动触发部署：

1. 进入你的 GitHub 仓库页面
2. 点击顶部的 **Actions** 标签
3. 在左侧工作流列表中选择 **Deploy to Cloudflare Workers**
4. 点击右侧的 **Run workflow** 按钮
5. 选择分支（默认选择 `main`）
6. 点击 **Run workflow** 开始部署

部署进度可在 **Actions** 标签页中查看。

</details>

<details>
<summary>方式三：一键部署（比较简单，但不推荐，不方便更新）</summary>

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/huilang-me/CF-Server-Monitor)

新用户点击一键部署

修改`API_SECRET`，建议使用随机密码,不要包含特殊字符比如%，登录密码在登录后修改，建议和API\_SECRET不同。

在build command中填入 `npm run build:frontend`，其他保持默认

点击部署即可

</details>

## 📊 使用说明

<details>
<summary>访问管理后台</summary>

部署成功后，访问管理后台：

```
https://你的项目名.你的子域.workers.dev/admin
```

- 用户名：默认admin，如果设置了环境变量 `API_USER_NAME`，则使用该值
- 密码：你设置的 `API_SECRET`

**登录后务必修改用户名和密码，以确保安全。** 强烈建议登录密码和探针认证密钥不同。

> **提示**：项目名和子域可以在 Cloudflare Workers & Pages 页面找到。建议绑定域名，避免国内无法访问

</details>

<details>
<summary>添加服务器监控</summary>

### 在管理后台添加服务器

1. 进入管理后台 `/admin`
2. 在"服务器名称"输入框填写名称
3. 点击 **+ 添加服务器**
4. 点击新服务器旁的 **📋** 按钮复制安装命令

### 参数说明

| 参数                  | 说明                           | 默认值    |
| ------------------- | ---------------------------- | ------ |
| `-id`               | 服务器唯一标识符（必填）                 | -      |
| `-secret`           | API 认证密钥（必填）                 | -      |
| `-url`              | Worker 上报地址（必填）              | -      |
| `-collect_interval` | 数据采集间隔（秒），`0` 表示不额外采集并使用单条上报 | `0`    |
| `-interval`         | 数据上报间隔（秒）                    | `60`   |
| `-ct`               | 自定义CT测试节点，支持 `host[:port]` | 默认节点   |
| `-cu`               | 自定义CU测试节点，支持 `host[:port]` | 默认节点   |
| `-cm`               | 自定义CM测试节点，支持 `host[:port]` | 默认节点   |
| `-bd`               | 自定义BD测试节点，支持 `host[:port]` | 默认节点   |
| `-reset_day`        | 流量重置日（1-31）                  | `1`    |
| `-rx_correction`    | 下行流量校正（GB，直接设置当月下行数据）        | -      |
| `-tx_correction`    | 上行流量校正（GB，直接设置当月上行数据）        | -      |

> **注意**：`-collect_interval` 控制本机额外采集频率，`-interval` 控制向 Worker 上报频率。默认 `0` 为兼容模式：不额外采集，只按上报间隔发送单条数据；设置为 `1` 时才会 1 秒采集、按上报间隔批量发送。上报间隔越短，API 调用和数据库写入越多。


### 非 root 安装
Linux 非 root 执行安装时会使用当前用户，不会新建用户；二进制、配置和流量文件会写入 `~/.cf-probe/`，自启动使用 `systemd --user`。部分系统从旧的 root Go 版切换到非 root 安装时，建议先在 root 下卸载旧版：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sh -s -- uninstall
```

如果已有非 root 用户，先在 root 下为该用户开启 linger，以支持退出登录后后台运行和自启动：

```bash
loginctl enable-linger 用户名
```

如果没有非 root 用户，可先新建用户并设置密码或 SSH 密钥：

```bash
useradd -m -s /bin/bash cfsm
loginctl enable-linger cfsm
passwd cfsm
```

随后退出 root/su 会话，使用账户密码或 SSH 密钥登录该非 root 用户，再复制后台安装命令执行。不要在 root shell 中直接 `su` 后安装，否则当前会话可能无法连接 `systemd --user` 用户服务（例如 `Failed to connect to bus: No medium found`）。如果当前环境不支持 `systemd --user`，请改用 root 安装；如果检测到 root/system 旧版本安装，当前版本会提示先清理旧版本，暂不自动迁移。

### Go 版本探针（默认）

V2.8.3 起默认使用 Go 版本探针 `cfsm-agent`，安装后以 `cf-probe` 服务运行。从后台复制安装命令时可选择目标系统（Linux / OpenWrt / Synology DSM / FreeBSD / macOS / Windows），并可选填 GitHub 代理加速（如 `https://ghfast.top/`）。

Linux / OpenWrt / Synology DSM / FreeBSD：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sh -s -- install -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sudo sh -s -- install -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

Windows（管理员 PowerShell）：

```powershell
$script = "$env:TEMP\install-cf-probe.ps1"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.ps1" -OutFile $script -UseBasicParsing
PowerShell -ExecutionPolicy Bypass -File $script install -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

GitHub 下载较慢时，可加上代理前缀（同时作用于脚本下载和 release 下载）：

```bash
curl -fsSL https://ghfast.top/https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sh -s -- install --install-ghproxy=https://ghfast.top/ -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

> **说明**：Go 版本与 Shell 版本参数完全兼容，已安装 Shell 版本的服务器可按上述命令直接覆盖安装切换为 Go 版本。完整参数、安装位置、状态查看与日志说明详见 [agent-go.md](agent-go.md)。

### Shell 版本探针（可选）

对于不支持 Go 或偏好纯 Shell 的环境，仍可使用 Shell 脚本版本，参数与 Go 版本一致。Shell 版本安装命令需从各系统对应的 `install-*.sh` 脚本获取，例如 Linux：

```bash
curl -sL https://你的项目.你的子域.workers.dev/install.sh | bash -s install -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

其他系统将 `install.sh` 替换为对应脚本（`install-alpine.sh` / `install-openwrt.sh` / `install-mac.sh` / `install-synology.sh`），macOS 需加 `sudo`。

</details>

<details>
<summary>升级 Cloudflare Workers</summary>

根据您使用的安装方式，选择对应的升级方法：

### 方式一/方式二：Fork 后通过 GitHub 同步（推荐）

无论你使用 Cloudflare Workers 连接 GitHub 仓库，还是使用 GitHub Action 自动部署，升级方式相同：同步上游仓库即可。

#### 自动同步（推荐）

建议启用自动同步功能，系统会每天自动同步上游仓库的最新代码：

1. 进入你 Fork 的 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 首次使用时，点击 **"I understand my workflows, go ahead and enable them"** 启用 Actions
4. 找到 **Upstream Sync** 工作流，点击进入
5. 点击 **Run workflow** 手动触发一次，确认同步正常工作

启用后，系统每天 UTC 0:00（北京时间 8:00）会自动检测上游仓库是否有新提交，有则自动合并到你的 `main` 分支。

> **注意**：如果同步失败，提示"由于上游仓库的 workflow 文件变更，导致 GitHub 自动暂停了本次自动更新"，请前往仓库页面点击 **Sync Fork** → **Update branch** 手动执行一次同步，然后再次启用 Actions。

#### 手动同步

如果需要立即同步，可以手动操作：

1. 进入你 Fork 的 GitHub 仓库页面
2. 点击 **Sync fork** → **Update branch** 同步上游更新

或者在 **Actions** 标签页中点击 **Upstream Sync** → **Run workflow** 手动触发。

**部署触发方式**：

- **Cloudflare Workers 连接 GitHub 仓库**：同步后 Cloudflare 会自动检测到代码变更并重新部署
- **GitHub Action 自动部署**：同步后 GitHub Actions 会自动触发部署，可在 **Actions** 标签页查看进度

### 方式三：一键部署

一键部署方式升级较为麻烦，建议重新部署：

1. 访问 [一键部署页面](https://deploy.workers.cloudflare.com/?url=https://github.com/huilang-me/CF-Server-Monitor)
2. 选择已存在的项目进行更新
3. 在 build command 中填入 `npm run build:frontend`
4. 点击部署

> **注意**：一键部署方式不方便同步更新，建议迁移到方式一。

</details>

<details>
<summary>升级探针</summary>

当有新版本部署成功后，可以通过以下命令升级探针，升级过程会自动保留原有配置：

Go版本（默认）

Linux / OpenWrt / Synology DSM / FreeBSD：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sh -s -- install
```

macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sudo sh -s -- install
```

Windows（管理员 PowerShell）：

```powershell
$script = "$env:TEMP\install-cf-probe.ps1"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.ps1" -OutFile $script -UseBasicParsing
PowerShell -ExecutionPolicy Bypass -File $script install
```

Shell版本

```bash
# Linux
curl -sL https://你的项目.你的子域.workers.dev/install.sh | bash -s install
# Alpine
curl -sL https://你的项目.你的子域.workers.dev/install-alpine.sh | sh -s install
# OpenWrt
curl -sL https://你的项目.你的子域.workers.dev/install-openwrt.sh | sh -s install
# macOS
curl -sL https://你的项目.你的子域.workers.dev/install-mac.sh | sudo bash -s install
# Windows
irm https://你的项目.你的子域.workers.dev/cf-server-monitor.ps1 -OutFile cf-server-monitor.ps1; powershell -ExecutionPolicy Bypass -File .\cf-server-monitor.ps1 install
```

> Agent带参数下发能力，在后台修改服务器参数会自动下发到探针，无需每次重新安装；受上报间隔和缓存影响，最长约 240 秒才能看到效果。修改探针上报地址/API_SECRET 后需要重新复制并执行该服务器的安装命令。

</details>

<details>
<summary>卸载探针</summary>

> **注意**：卸载命令必须与当前已安装的探针版本匹配，否则无法清理对应的服务和文件。Go 版本卸载脚本不会清理 Shell 版本的文件，反之亦然。若曾从 Shell 版本切换到 Go 版本（或反向切换），需分别执行两个版本的卸载命令才能彻底清理。后台删除服务器时可在卸载弹窗中切换 Shell / Go 版本复制对应卸载命令。

Go 版本（默认）：

Linux / OpenWrt / Synology DSM / FreeBSD：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sh -s -- uninstall
```

macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sudo sh -s -- uninstall
```

Windows（管理员 PowerShell）：

```powershell
$script = "$env:TEMP\install-cf-probe.ps1"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.ps1" -OutFile $script -UseBasicParsing
PowerShell -ExecutionPolicy Bypass -File $script uninstall
```

Shell 版本：

```bash
# Linux
curl -sL https://你的项目.你的子域.workers.dev/install.sh | bash -s uninstall
# Alpine
curl -sL https://你的项目.你的子域.workers.dev/install-alpine.sh | sh -s uninstall
# OpenWrt
curl -sL https://你的项目.你的子域.workers.dev/install-openwrt.sh | sh -s uninstall
# macOS
curl -sL https://你的项目.你的子域.workers.dev/install-mac.sh | sudo bash -s uninstall
# Windows
irm https://你的项目.你的子域.workers.dev/cf-server-monitor.ps1 -OutFile cf-server-monitor.ps1; powershell -ExecutionPolicy Bypass -File .\cf-server-monitor.ps1 uninstall
```

> **说明**：Go 版本卸载仅清理当前 Go 版默认安装创建的固定位置和自启动项，不处理旧 Shell 脚本或手动放置到其他路径的文件。如使用了 GitHub 代理，可在命令后追加 ` --install-ghproxy=https://ghfast.top/`。
</details>

<details>
<summary>安全增强</summary>

### Turnstile 配置（可选）

如需启用 Turnstile 人机验证，可用于基本拦截恶意攻击，避免额度超出，需在管理后台配置：

1. 登录 [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. 创建站点，获取 **Site Key** 和 **Secret Key**
3. 在管理后台 → 全局设置中启用 Turnstile 并填入密钥

### JWT 配置（可选）

如需自定义 JWT 密钥：

1. 生成一个至少 32 位的随机字符串作为 JWT Secret
2. 在管理后台 → 全局设置 → 安全设置中填入 JWT Secret
3. 保存后系统将使用自定义密钥进行 token 签名

### CORS 跨域配置（可选）

如需允许特定域名跨域访问 Workers API，可配置允许的来源：

1. 在 Workers & Pages 页面的 **Settings** → **Variables and secrets** 中添加 `CORS_ALLOWED_ORIGINS`
2. 值设置为允许跨域的域名，多个域名用逗号分隔，例如：`https://example.com,https://www.example.com`
3. 不设置此变量或留空时，默认仅允许同源请求

### CSP 内容安全策略配置（可选）

Content Security Policy (CSP) 是一种安全层，用于检测和缓解某些类型的攻击，包括跨站脚本 (XSS) 和数据注入攻击。

项目默认启用 CSP，并采用偏保守的默认策略：除了同源资源和内置必要域名外，第三方静态资源默认会被浏览器拦截。这包括：

- 第三方背景图，例如 `https://cdn.example.com/bg.webp`
- 外部 CSS，例如 `<link rel="stylesheet" href="https://cdn.example.com/theme.css">`
- CSS 里的 `@import`，例如 `@import url('https://cdn.example.com/theme.css')`
- 外部 JS，例如 `<script src="https://cdn.example.com/demo.js"></script>`
- 外部字体、图片、图标等静态文件

如果浏览器控制台出现 `Content Security Policy`、`Refused to load`、`Refused to execute` 等提示，通常不是资源地址失效，而是该第三方域名没有加入 CSP 白名单。

Workers 环境下 CSP 会放在 HTTP Response Header 中返回，并同时设置 `X-Frame-Options: DENY`，禁止页面被其他站点 iframe 嵌入。第三方主题自带的 `<meta http-equiv="Content-Security-Policy">` 会在 Workers 反代时被移除，最终以后台配置和内置白名单生成的 Header 为准。

**默认白名单**（已内置）：

- `https://challenges.cloudflare.com` - Cloudflare Turnstile
- `https://static.cloudflareinsights.com` - Cloudflare Analytics
- `https://fonts.googleapis.com` - Google Fonts CSS
- `https://fonts.gstatic.com` - Google Fonts 文件
- `https://raw.githubusercontent.com` - 主题图片资源

**默认 `connect-src` 白名单**（已内置）：

- `https://api.github.com`
- `https://api.iconify.design`
- `https://api.unisvg.com`
- `https://api.simplesvg.com`
- `https://api.frankfurter.app`
- `https://api.frankfurter.dev`
- `https://open.er-api.com`
- `https://api.ip.sb`
- `https://ipwho.is`
- `https://api.ipapi.is`
- `https://ipapi.co`
- `https://api.vore.top`

**后台配置**：

如果需要添加第三方背景图、CSS、JS、字体、图片等资源，可在管理后台 → 外观 设置中配置：

| 字段 | 说明 | 示例 |
|------|------|------|
| CSP 静态文件域名 | 允许加载的第三方静态资源域名 | `https://cdn.jsdelivr.net,https://cdnjs.cloudflare.com` |
| CSP API 域名 | 允许连接的 API 域名 | `https://api.example.com` |

填写规则：

- 只填写域名源（origin），不要填写完整文件路径。例如填写 `https://cdn.jsdelivr.net`，不要填写 `https://cdn.jsdelivr.net/gh/user/repo/style.css`
- 多个域名用英文逗号分隔
- 仅建议填写 `https://` 域名
- 使用同源资源或本地静态文件（例如 `./assets/bg.webp`）不需要额外添加白名单

> **安全提示**：添加第三方 CSS/JS 时，请确保来源安全可靠。CSP 默认拦截第三方资源是为了避免恶意脚本注入、页面被篡改、数据泄露和未知追踪代码。建议优先使用同源资源，或将资源托管在自己可信的仓库/CDN 中；不要把不信任的公共 CDN 域名随意加入白名单。

**GitHub Pages 环境变量配置**：

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `CSP_STATIC` | 额外的静态文件域名，用于第三方背景图、CSS、JS、字体、图片等 | `https://cdn.jsdelivr.net` |
| `CSP_API` | 额外的 API 域名 | `https://api.example.com` |

> **注意**：`API_BASE` 环境变量会自动添加到 CSP API 白名单中。
>
> GitHub Pages 纯静态构建无法设置 Workers 的 HTTP Header，因此仍会在构建后的 HTML 中写入 CSP meta。

### Cloudflare 额度查询（可选）

如需在后台查询 D1 读写额度和 Workers 请求量：

1. 在 [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/workers-and-pages)右下角复制当前账户的 **Account ID**
2. 在[API Tokens 页面](https://dash.cloudflare.com/profile/api-tokens)创建具备 **Account Analytics Read** 权限的 Cloudflare API Token
3. 在管理后台 → 全局设置 → Cloudflare 设置中填入 Account ID 和 API Token
4. 保存后点击 **查询 D1 额度** 查看 UTC 当日与昨天用量

</details>

<details>
<summary>通知设置</summary>

## 🔔 通知设置

在管理后台 → 全局设置 → 通知 中配置。支持以下通知方式，通过 Bot Token 字段自动识别平台类型：

### Telegram

1. 创建 Telegram Bot（通过 [@BotFather](https://t.me/BotFather)）
2. 获取 Bot Token，填入 **Bot Token** 字段
3. （通过 [@idbot](https://t.me/idbot)）获取 ID，填入 **Chat ID** 字段

### 飞书

1. 创建飞书群机器人，获取 Webhook URL
2. 将 Webhook URL 填入 **Bot Token** 字段
3. **Chat ID** 留空

### 钉钉

1. 在钉钉群中添加自定义机器人，获取 Webhook URL（包含 `access_token` 参数）
2. 将 Webhook URL 填入 **Bot Token** 字段
3. **Chat ID** 留空

### OneBot (QQ)

1. 部署 OneBot 协议实现（如 go-cqhttp、Lagrange 等），获取 HTTP API 地址
2. 将 API 地址填入 **Bot Token** 字段，格式为 `onebot:http://127.0.0.1:3000/send_private_msg?access_token=xxx`，或 `onebot:http://127.0.0.1:3000/send_group_msg?access_token=xxx`
3. **Chat ID** 填入目标用户 ID（如 `123456`）或群 ID（如 `789012`）

### 企业微信

1. [创建企业微信群机器人](https://open.work.weixin.qq.com/help2/pc/14931) 并配置，获取 Webhook URL
2. 将 Webhook URL 填入 **Bot Token** 字段
3. **Chat ID** 留空

### Bark

1. 获取 Bark 推送链接，比如 `https://api.day.app/xxxxxxx/自定义内容`，删掉中文，保留 `https://api.day.app/xxxxxxx/`
2. 将链接填入 **Bot Token** 字段
3. **Chat ID** 留空
4. 如果是自建 Bark 服务，格式为 `bark:https://example.com/xxxxxxx/`

### Server 酱

1. 注册 [Server 酱](https://sct.ftqq.com/) 获取 SendKey
2. 将 SendKey 填入 **Bot Token** 字段，格式为 `https://sctapi.ftqq.com/你的SendKey.send`
3. **Chat ID** 留空

### WxPusher

1. 注册 [WxPusher](https://wxpusher.zjiecode.com/) 获取 SPT Token
2. 将 SPT Token 填入 **Bot Token** 字段，格式为 `https://wxpusher.zjiecode.com/api/send/message/[SPT_你的Token]/Hello%20WxPusher`
3. **Chat ID** 留空

### Gotify

1. 部署或使用已有的 [Gotify](https://gotify.net/) 服务
2. 在 Gotify 中创建 Application，获取 Token
3. 将推送 URL 填入 **Bot Token** 字段，格式为 `https://你的Gotify地址/message?token=你的Token`
4. **Chat ID** 留空

### 告警类型

| 类型   | 说明                       |
| ---- | ------------------------ |
| 离线告警 | 节点离线达到设置的 2-30 分钟阈值后发送告警，恢复后发送恢复通知 |
| 到期提醒 | 可配置为禁用，或服务器到期前 1-7 天内每天发送提醒 |

### 测试通知

配置完成后，可点击 **发送测试通知** 按钮验证配置是否正确。测试成功后记得点击 **保存**。

</details>

<details>
<summary>其他设置</summary>

### 前台大盘

访问 `https://你的项目.你的子域.workers.dev/` 查看：

- **条形图视图**：服务器状态概览（含实时网速和本月流量）
- **环形图视图**：服务器资源占用环形展示
- **表格视图**：详细数据列表
- **地图视图**：全球服务器分布
- **过滤器**：按国家筛选服务器

### 服务器详情

点击任意服务器卡片进入详情页：

- 实时 CPU/GPU/内存/磁盘/网络/负载
- 7 天历史趋势图
- 鼠标悬停查看具体时间点的数值
- 国内四线路延迟与丢包率追踪

> **注意**：查看 1 小时以上的历史数据需要登录管理员账户。

### iOS Scriptable 小组件

项目提供了 iOS Scriptable 小组件脚本：[scripts/ios-scriptable-widget.js](scripts/ios-scriptable-widget.js)。

使用方式：

1. 在 iPhone 安装 [Scriptable](https://scriptable.app/)。
2. 将 [scripts/ios-scriptable-widget.js](https://github.com/huilang-me/CF-Server-Monitor/raw/refs/heads/main/scripts/ios-scriptable-widget.js) 内容复制到 Scriptable 新脚本中。
3. 修改脚本顶部的 `CONFIG.baseURL` 为你的站点地址，例如 `https://status.example.com`。
4. 添加 Scriptable 小组件，选择该脚本。
5. 在小组件的 **Parameter** 中填写服务器 ID，例如 `955bd53e-531f-4dc8-8705-dc204000fa98`，也可以写成 `id:955bd53e-531f-4dc8-8705-dc204000fa98`。

说明：

- 如需在桌面上下滑动切换服务器，需要添加多个同尺寸 Scriptable 小组件，每个小组件填写不同的服务器 ID，然后在 iOS 桌面将它们叠成小组件堆叠。
- 小组件会显示服务器在线状态、CPU/RAM/磁盘/流量、实时上下行速率和更新时间。
- 脚本设置了 60 秒后刷新，但 iOS 会根据系统策略决定实际刷新时间。

### 主题切换与自定义

管理后台支持以下自定义功能：

| 功能 | 说明 | 位置 |
|------|------|------|
| 自定义 CSS 主题 | 修改页面样式 | 后台 → 外观 → 自定义脚本 |
| 自定义 `<head>` | 添加外部 CSS/JS、Meta 标签等 | 后台 → 外观 → 自定义 `<head>` |
| 背景图片 | 自定义页面背景 | 后台 → 外观 → 背景图片 |
| Mikus 模式 | 勾选后自动写入 `theme_options.mikus`，开启内置 Mikus 前端配色、加载页、欢迎区与樱花动画 | 后台 → 外观 → 开启 Mikus 模式 |
| CSP 白名单 | 允许加载的第三方资源域名 | 后台 → 外观 → CSP 设置 |
| 主题商店 | 选择第三方主题与版本 | 后台 → 主题商店 |

Mikus 模式不会改动数据库结构，仍复用现有 `theme_options` JSON 配置；勾选开关时会写入 `{"mikus":1}`，取消勾选时会移除 `mikus` 参数。视觉来源：[mikus-loli/komari-mikus](https://github.com/mikus-loli/komari-mikus)。

**主题商店与 Workers 反代说明**：

- 后台切换主题会保存 `theme_url`，主题商店会基于主题仓库 commit 生成 GitHub tree 地址，也支持手动填写独立 GitHub 主题仓库 tree 地址，例如 `https://github.com/huilang-me/cf-server-monitor-theme-emerald/tree/f334bb5e25ffbe66749a8df9eb4b099fb148e0f7`
- 主题商店 `themes.json` 可为主题配置仓库 `url` 和构建分支 `branch`；后台会读取该分支最近 10 个 commit，并把所选 commit 组装为 `https://github.com/<owner>/<repo>/tree/<commit ID>` 写入 `theme_url`
- `theme_url` 留空时使用项目内置默认主题
- Workers 仅反代所选主题的 `index.html` 和 `/assets/*`，例如 `/assets/app.css` 会映射到主题仓库同版本 `assets/app.css`
- `install.sh`、`flags/`、`os-icons/`、favicon、API、管理端等其他路径不会走主题反代，仍返回项目原有文件或接口
- 远程主题 `index.html` 和 `assets/` 会在 Workers Cache 中缓存：commit id 固定版 1 天，分支名版本 1 小时；主题商店列表缓存 5 分钟
- 切换主题会先校验远程 `index.html` 是否可访问，失败会提示错误并拒绝保存，不会自动回退成默认主题
- 主题预览需要已登录管理员身份；未授权直接访问 `/?theme_url=...` 会返回 401，不会启用临时主题
- 管理后台固定使用内置默认主题；第三方主题的管理入口应链接到 `/admin#admin`
- 第三方主题详情页建议使用 `/#/server/:id`，避免和 `/admin` 的内置后台接管逻辑冲突

**自定义 `<head>` 使用示例**：

```html
<!-- 引入外部字体 -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">

<!-- 通过 CSS @import 引入第三方样式 -->
<style>
@import url('https://cdn.jsdelivr.net/gh/user/repo/theme.css');
</style>

<!-- 自定义 Meta 标签 -->
<meta name="description" content="My Server Monitor">

<!-- 内联样式 -->
<style>body { font-family: 'Inter', sans-serif; }</style>
```

**第三方资源导入说明**：

- 外部 CSS、CSS `@import`、外部 JS、第三方背景图、字体和图片都会受 CSP 限制
- 如果资源来自第三方域名，需要先在后台 → 外观 → CSP 设置 → CSP 静态文件域名中加入对应域名源
- 白名单填写域名源即可，例如资源地址是 `https://cdn.jsdelivr.net/gh/user/repo/theme.css`，只填写 `https://cdn.jsdelivr.net`
- 背景图 URL 如果使用第三方 CDN，也需要把 CDN 域名加入 CSP 静态文件域名
- API 请求或 WebSocket 连接使用第三方域名时，加入 CSP API 域名，而不是 CSP 静态文件域名

> **安全警告**：
> - 添加第三方 CSS/JS 时，请确保来源安全可靠，使用前建议将js源码发给AI完整分析安全后，确认无问题后使用
> - 建议将资源托管在自己的 GitHub 仓库中，通过 CDN 调用
> - 使用不当可能带来 XSS 攻击、数据泄露等严重安全风险
> - 外部资源需要添加到 CSP 白名单中才能正常加载，这是为了安全而默认拦截，不是程序错误

### 主题开发

如需开发自定义主题，请参考 [主题开发文档](theme-develop.md)。

### 拖拽排序

在管理后台的服务器列表中，可以通过拖拽调整服务器的显示顺序

### 服务器隐藏

可以将特定服务器设置为对非登录用户隐藏：

1. 进入管理后台 `/admin`
2. 点击服务器行右侧的 **✏️ 编辑** 按钮
3. 勾选 **公开隐藏** 选项
4. 点击 **保存**

### 数据库管理

管理后台提供数据库维护功能，可在 "Database Management" 标签页中找到：

1. **升级数据库**：将数据库结构升级到最新版本，适用于旧版本用户升级
   - 点击「Upgrade Database」按钮
   - 确认升级操作
   - 系统会自动执行数据库升级脚本
2. **清空历史数据**：清空所有历史数据（⚠️ 危险操作）
   - 点击「清空历史数据」按钮
   - 确认操作（此操作将删除所有历史数据）
   - 系统会清空并重新初始化数据库

> **注意**：
>
> - 清空历史数据是不可逆操作，请确保已备份重要数据
> - 升级数据库不会删除现有数据，仅会更新表结构
> - 从旧版本升级到包含 GPU/丢包率监控的新版本后，需要先执行升级数据库，再重新安装或升级探针以采集新字段

</details>

<details>
<summary>定时任务</summary>

系统包含以下定时任务（UTC 时区）：

| 任务   | 触发时间          | 说明                                              |
| ---- | ------------- | ----------------------------------------------- |
| 离线检测 | `*/1 * * * *` | 每分钟检测离线节点并发送告警                                  |
| 合并任务 | `0 * * * *`   | 每小时执行，根据日期判断执行：每月1号数据轮换、每月8号清理旧表、每天12:00服务器到期检测 |

</details>

## 📁 项目结构

<details>
<summary>项目结构</summary>

```
CF-Server-Monitor/
├── public/
│   ├── cf-server-monitor.ps1   # Windows 探针脚本（PowerShell 版，零依赖）
│   ├── install.sh              # 一键安装脚本 - systemd 系统 (Ubuntu/Debian/CentOS)
│   ├── install-alpine.sh       # 一键安装脚本 - OpenRC 系统 (Alpine Linux)
│   ├── install-openwrt.sh      # 一键安装脚本 - procd 系统 (OpenWrt/LEDE)
│   ├── install-mac.sh          # 一键安装脚本 - macOS (Intel / Apple Silicon)
│   ├── favicon.ico             # 站点图标
│   └── logo.svg                # Logo
├── src/
│   ├── index.js                # 后端主入口 - 路由分发 + Durable Object 导出
│   ├── database/
│   │   ├── schema.js             # 数据库初始化、表结构定义
│   │   ├── indexOptimization.js  # 数据库索引优化
│   │   └── updateDatabase.js     # 数据库升级处理
│   ├── durable/
│   │   └── MetricsBroadcaster.js # Durable Object：WebSocket 实时推送广播中心
│   ├── middleware/
│   │   └── auth.js             # 认证中间件
│   ├── handlers/
│   │   ├── admin.js            # 后台管理 API
│   │   ├── dashboard.js        # 前台大盘 API
│   │   ├── frontend.js         # 前端资源服务
│   │   ├── theme.js            # 主题商店列表拉取与缓存
│   │   └── update.js           # 数据上报处理 + 广播到 DO
│   ├── services/
│   │   └── notification.js     # 通知服务
│   ├── utils/
│   │   ├── agentConfig.js      # 探针配置下发
│   │   ├── cache.js            # 缓存工具
│   │   ├── common.js           # 通用工具函数
│   │   ├── cors.js             # CORS 处理
│   │   ├── csp.js              # CSP Header 生成与主题 HTML CSP meta 清理
│   │   ├── errors.js           # 错误类型与响应封装
│   │   ├── metrics.js          # 指标处理工具
│   │   ├── serverBilling.js    # 服务器计费字段规范化
│   │   ├── settings.js         # 设置管理
│   │   └── version.js          # 版本检查
│   └── frontend/               # Vue 3 前端应用
│       ├── App.vue             # 根组件
│       ├── main.js             # 前端入口
│       ├── components/         # Vue 组件
│       │   ├── Footer.vue
│       │   ├── ServerBarCard.vue
│       │   ├── ServerRingCard.vue
│       │   └── TerminalHeader.vue
│       ├── composables/        # 通用组合式函数
│       │   ├── useServerCardData.js
│       │   ├── usePasswordVisibility.js
│       │   └── useTheme.js
│       ├── router/
│       │   └── index.js        # Vue Router 配置
│       ├── styles/             # 样式文件
│       │   ├── light.css
│       │   └── main.css
│       ├── utils/
│       │   ├── api.js          # API 请求封装 + WebSocket 客户端
│       │   ├── config.js       # 前端运行时配置
│       │   ├── constants.js    # 前端常量
│       │   ├── displayMode.js  # 前端显示模式规范化
│       │   ├── http.js         # HTTP 请求封装
│       │   ├── i18n.js         # 国际化配置
│       │   ├── osIcon.js       # 系统图标匹配
│       │   ├── pingNode.js     # Ping 节点校验
│       │   ├── playback.js     # WebSocket 回放节流
│       │   ├── server.js       # 前端服务器指标与计费显示工具
│       │   ├── time.js         # 时间格式化工具
│       │   └── turnstile.js    # Turnstile 共享工具
│       └── views/              # 页面视图
│           ├── admin/          # 管理后台（拆分为独立模块）
│           │   ├── index.vue   # 管理后台主入口
│           │   ├── components/ # 后台子组件
│           │   │   ├── AdminLogin.vue
│           │   │   ├── CopyCommandModal.vue
│           │   │   ├── DatabasePanel.vue
│           │   │   ├── DeleteServerModal.vue
│           │   │   ├── EditServerModal.vue
│           │   │   ├── ServerTable.vue
│           │   │   └── SettingsPanel.vue
│           │   └── composables/
│           │       └── useTurnstile.js
│           ├── Dashboard.vue    # 首页（接入 WebSocket 实时推送）
│           └── ServerDetail.vue # 服务器详情页（历史图表 + 实时推送）
├── scripts/
│   ├── build.js                 # 前端构建脚本
│   ├── build-github-page.js     # GitHub Pages 构建脚本
│   └── ios-scriptable-widget.js # iOS Scriptable 小组件
├── test/
│   ├── README.md               # 测试工具说明
│   ├── agent-config.js         # 探针配置下发测试
│   ├── api-check.js            # 本地 API 检查工具
│   ├── generate-sql.js         # 测试数据生成工具
│   ├── mock-data.sql           # 模拟数据 SQL
│   └── mock-sender.sh          # 模拟数据发送脚本（macOS）
├── index.html
├── jsconfig.json               # JS 配置
├── package.json                # 项目依赖与 npm scripts
├── package-lock.json           # npm 依赖锁定文件
├── vite.config.js              # Vite 配置
├── wrangler.toml               # Wrangler 本地开发配置
├── API.md                      # 全局 API 文档
├── theme-develop.md            # 第三方主题开发 API 文档
├── todo.md                     # 待办事项列表
└── .github/
    └── workflows/
        ├── deploy.yml             # GitHub Actions 自动部署到 Workers
        ├── deploy-github-page.yml # GitHub Pages 自动部署
        └── sync.yml               # 上游仓库自动同步
```

</details>

## ❓ 常见问题

<details>
<summary>常见问题</summary>

**Q: 部署后返回API_SECRET is required**

如果是部署后丢失`API_SECRET`，请在Workers & Pages页面，点击 **Settings**，删除原有`API_SECRET`（如有），重新添加`API_SECRET`保存触发重新部署，等待部署完成即可。

**Q: 探针安装后不显示数据？**

检查服务器是否能访问 Worker URL，在安装命令参数后面加入 ` -debug=1`（目前仅支持linux系统），再查看探针日志：`journalctl -u cf-probe -f`，将错误信息发到Issue或者TG群，调试结束后删掉debug=1参数重新安装，避免日志过大。

**Q: 如何更换 API_SECRET？**

更新 Cloudflare Workers & Pages 中的 `API_SECRET`，重新部署，并在所有服务器上重新安装探针。如果是GitHub Action 自动部署，需要在 GitHub Secrets 中更新 `API_SECRET`。

**Q: D1 数据库免费额度够用吗？**

Cloudflare D1 免费版提供 5GB 存储和 5M 读取行/日、100K 写入行/日，足以支持服务器监控。

写入行：1台服务器一天占用写入行是1.44k，免费写入额度是100k/天，理论上可用支持60+服务器的监控，如果修改上报频率为120秒可用翻倍。

读取行：1台服务器一天占用读行是8k左右，如果开启站点兼容，大概是1.6k，免费读行是5M/天，非常充裕
主要是前端访问消耗的次数，限制了非登录用户 1 小时以上的查看，只要不被暴力刷额度，绝对够用。如果不放心，可以在后台开启 Turnstile 人机验证，也可以选择仅登录查看。

**Q: D1 数据库免费额度超出扣费吗？**

超出不扣费，只会限制访问，第二天北京时间08:00重置

**Q: 遇到其他异常问题怎么办？**

可以尝试在后台数据库管理中：

- 升级数据库：尝试修复数据库结构问题
- 清空历史数据：清空数据库中的历史数据（⚠️ 注意：此操作将清除所有历史数据，请确保已备份重要信息）

**Q: 忘记密码？**

进入Cloudflare后台，进入D1数据库（server-monitor-db），点击右上角explore data，进入后点击左侧的`setting`表，双击`site_options`右侧的value，可以看到`用户名`和md5加密的`密码`，password修改成`e10adc3949ba59abbe56e057f20f883e`，即默认密码`123456`，右上角点Commit 1 change，弹出的确认框点确认即可。然后访问后台用默认密码登录即可。

**Q: 地区并列显示港澳台和国家**

为了方便用户查看，前端并列显示港澳台和国家，但是旗帜都统一显示五星红旗，后端返回的是region字段，这里是输出国家和地区，而不是国家，地图符合中华人民共和国自然资源部标准地图制作（审图号：GS(2023)2767 号）。

**Q: 国内服务器无法上报**

1. CF有托管域名的话，绑定一个域名可用解决绝大多数上报问题
2. 如果没有域名可以绑定，或者绑定域名还是无法访问，可以改本地host解决，本地ping一个cf的cdn ip，改host解析. `echo [ip] [你的项目名.你的子域.workers.dev] | sudo tee -a /etc/hosts`

**Q: Ping结果都是1?**

1. 检查服务器是否开了代理，可以关闭后测试。
2. 软路由使用openclash会导致延迟测试问题，推荐使用passwall（感谢@chenisme 美馨 提供的解决方案）

</details>

## 📸 界面预览

<details>
<summary>界面预览</summary>

### 深色风格
![image](https://github.com/user-attachments/assets/4e6a5db4-65d3-4d40-91b9-9e46ee140d0d)
![image](https://github.com/user-attachments/assets/c10a1376-3d4c-4a58-8d3b-dc904b30f174)
![image](https://github.com/user-attachments/assets/a9c1aefd-42f7-4805-aa42-bbe9e58aed59)
![image](https://github.com/user-attachments/assets/527bcf04-3124-4f1c-b052-451bccae961d)
![image](https://github.com/user-attachments/assets/ac6f6fbb-b9fb-45cd-93e5-ca08bbad9ecb)
![image](https://github.com/user-attachments/assets/b5436816-54bd-4512-a65c-bf963fd4874c)
![image](https://github.com/user-attachments/assets/ba0d3605-ef64-4be1-884b-9506f20277a8)
![image](https://github.com/user-attachments/assets/197767cc-028b-4ec1-b41f-5cadc2b25629)

### 浅色风格
![image](https://github.com/user-attachments/assets/8d310095-2b93-40f3-b762-323fbe6595f6)
![image](https://github.com/user-attachments/assets/bfa48a70-5379-495f-8599-fc9bf49c4801)
![image](https://github.com/user-attachments/assets/e100d984-3165-4f38-948a-625249b4600a)
![image](https://github.com/user-attachments/assets/7d266ff3-0db7-477b-8029-c76e42298002)

</details>

## 🛠️ 本地开发

<details>
<summary>本地开发步骤</summary>

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 开发步骤

根目录新建 `.env` 文件，添加默认 `API_SECRET`：

```bash
API_SECRET=123456
```

然后执行以下命令进行本地开发：

```bash
# 安装依赖
npm install

# 创建 D1 数据库（首次）
npx wrangler d1 create server-monitor-db

# 启动本地 Worker（默认 https://localhost:8787）
npm run dev

# 单独启动前端 Vite 开发模式（默认 http://localhost:5173）
npm run dev:frontend

# 构建前端生产版本
npm run build:frontend

# 部署到 Cloudflare Workers
npm run deploy
```

定时任务

```
https://localhost:8787/cdn-cgi/handler/scheduled?cron=*/1+*+*+*+* // 每分钟执行一次（离线检测）
https://localhost:8787/cdn-cgi/handler/scheduled?cron=0+*+*+*+* // 每小时执行一次（合并任务）
https://localhost:8787/cdn-cgi/handler/scheduled?cron=0+0+*+*+0 // 每周执行一次（测试使用）
https://localhost:8787/cdn-cgi/handler/scheduled?cron=0+12+*+*+* // 每天12点执行一次（测试使用）
```

### 本地测试数据

支持生成本地测试数据，方便在部署前进行功能测试：

1. 进入 `test` 目录查看详细说明
2. 运行测试数据生成脚本
3. 导入生成的 SQL 数据到本地 D1 数据库
4. 启动本地开发服务器进行测试

```
node test/generate-sql.js
wrangler d1 execute server-monitor-db --file=test/mock-data.sql
```

详细步骤见 [test/README.md](test/README.md)

### API 接口测试

项目提供了 `api-check.js` 接口测试工具，用于验证本地开发环境的 API 接口是否正常工作：

```bash
# 默认配置测试
node test/api-check.js

# 指定参数测试
node test/api-check.js --base-url=http://localhost:8787 --api-secret=123456

# 查看帮助
node test/api-check.js --help
```

**测试覆盖范围：**

- 未登录接口：`/api/config`、`/api/servers`、`/api/server`、`/update` 等
- 登录流程：登录接口验证
- 已登录接口：隐藏服务器访问、历史数据查询等
- 后台管理：服务器增删改查、设置管理等

**选项参数：**

| 参数                 | 说明          | 默认值                     |
| ------------------ | ----------- | ----------------------- |
| `--base-url`       | 本地服务地址      | `http://localhost:8787` |
| `--api-secret`     | API\_SECRET | `123456`                |
| `--admin-user`     | 管理员用户名      | `admin`                 |
| `--admin-password` | 管理员密码       | 使用 API\_SECRET          |
| `--timeout`        | 请求超时时间(ms)  | `10000`                 |

</details>

## 📄 许可证

MIT License

## 🌐 社区

- [Telegram 群组](https://t.me/cfServerMonitor)

## 🙏 致谢

- [CF-Server-Monitor-Pro](https://github.com/a63414262/CF-Server-Monitor-Pro)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Vue 3](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Chart.js](https://www.chartjs.org/)
- [Leaflet](https://leafletjs.com/)
- 感谢 [NodeSeek](https://www.nodeseek.com/post-763025-1)  [LINUX DO](https://linux.do/) 社区的支持与推广
