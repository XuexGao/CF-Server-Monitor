# cfsm-agent

`cfsm-agent` 是 CF-Server-Monitor 的 Go Probe Agent，安装后会以 `cf-probe` 服务运行，定时采集服务器资源、网络流量和探测数据，并上报到指定的 Worker 地址。

## 快速安装

从面板或后台获取以下 3 个参数：

- `SERVER_ID`：服务器 ID
- `SECRET`：服务器密钥
- `WORKER_URL`：Worker 上报地址，例如 `https://example.com`

Linux、OpenWrt、Synology DSM、FreeBSD、macOS 可使用安装脚本自动下载当前系统对应的最新 release：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sh -s -- install -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

如果系统没有 `curl`，可使用 `wget`：

```bash
wget -O- https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sh -s -- install -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

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

## Windows 安装

请使用管理员权限打开 PowerShell，然后执行：

```powershell
$script = "$env:TEMP\install-cf-probe.ps1"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.ps1" -OutFile $script -UseBasicParsing
PowerShell -ExecutionPolicy Bypass -File $script install -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

## 指定版本或 GitHub 代理

默认安装最新 release。需要指定版本时：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sh -s -- install --install-version=v1.0.0 -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

GitHub 下载较慢时，可以配置代理前缀：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sh -s -- install --install-ghproxy=https://gh-proxy.example.com -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

## 常用安装参数

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `-id=SERVER_ID` | 服务器 ID，首次安装必填 | 无 |
| `-secret=SECRET` | 服务器密钥，首次安装必填 | 无 |
| `-url=WORKER_URL` | Worker 上报地址，首次安装必填 | 无 |
| `-interval=N` | 上报间隔，单位秒 | `60` |
| `-collect_interval=N` | 采样间隔，单位秒；为 `0` 时按上报间隔采样 | `0` |
| `-ct=HOST` | 电信测试节点，可写 `host` 或 `host:port` | 空 |
| `-cu=HOST` | 联通测试节点，可写 `host` 或 `host:port` | 空 |
| `-cm=HOST` | 移动测试节点，可写 `host` 或 `host:port` | 空 |
| `-bd=HOST` | 百度测试节点，可写 `host` 或 `host:port` | 空 |
| `-interface=IFACES` | 指定统计网卡，多个用英文逗号分隔 | 自动汇总 |
| `-reset_day=N` | 每月流量重置日，`1-31`；`0` 表示不重置 | `1` |
| `-auto_update=0\|1` | 是否开启自动检查更新 | `0` |
| `-rx_correction=N` | 下行流量校正，单位 GB | 空 |
| `-tx_correction=N` | 上行流量校正，单位 GB | 空 |
| `-debug=0\|1` | 是否开启调试日志 | `0` |
| `-no_start` | 安装后不立即启动服务 | 不启用 |

再次执行 `install` 时，如果本机已有配置文件，程序会以已有配置为基础，只覆盖本次显式传入的参数，未传入的参数保留旧值（例如只传 `-auto_update=1` 就只修改自动更新开关）。首次安装（本机无已有配置）时 `-id`、`-secret`、`-url` 仍为必填。

自动更新默认关闭。安装时传入 `-auto_update=1` 后，Agent 启动时会检查 GitHub release，之后每 6 小时检查一次；稳定版按版本号更新，`Snapshot-` 版本会跟随最新可用 Snapshot prerelease。自动更新只由本地 `AUTO_UPDATE` 配置控制，不依赖面板返回 `update=1`。如果安装时配置了 `--install-ghproxy`，代理会写入本地配置并用于后续自动更新；该本地字段不参与远端配置 MD5 对比。自动更新的检查结果、调度结果和失败原因始终以 info 级日志输出，无需开启 debug；nohup 环境下安装过程的输出会追加到 `/var/log/cf-probe.log`，systemd 环境可通过 `journalctl -u 'cf-probe-auto-update-*'` 查看。

普通用户安装时，自动更新会在 `~/.cf-probe/` 内下载并替换当前用户的二进制，随后退出当前进程，由 `systemd --user` 按服务重启策略拉起新版本；不会触碰 root 路径或系统级 systemd 服务。

更新检查（`api.github.com`）、新二进制下载（`github.com`）、指标上报以及公网 IP 查询的 DNS 解析默认使用系统原生 DNS；仅在配置了 `--install-ghproxy`（通常为系统 DNS 被污染的国内服务器）或通过环境变量 `CF_PROBE_UPDATE_DNS` 显式指定 DNS 服务器时，才启用 Agent 内置的公共 DNS 轮询解析（阿里、DNSPod、114、Cloudflare、Google，UDP 53），此时不依赖系统 DNS，内置 DNS 全部不可用时回退系统 DNS。`CF_PROBE_UPDATE_DNS` 会自动补全 `:53` 端口（如 `CF_PROBE_UPDATE_DNS=223.5.5.5`）。root/system 模式更新时 Agent 会把新二进制下载到配置目录，再调度新二进制执行自身的 `install` 完成替换并重启服务；普通用户模式按上一段直接自替换。两种模式都不经过 install.sh 和 curl；下载或调度失败时旧版本不受影响，下次检查自动重试。如 `github.com` 完全不可达，可配置 `--install-ghproxy` 代理（仅用于二进制文件下载；`api.github.com` 的版本检查始终直连，gh-proxy 类服务不支持 API 转发）。

## 安装位置

| 系统 | 二进制默认位置 | 配置文件 | 日志 |
| --- | --- | --- | --- |
| Linux non-root (`systemd --user`) | `~/.cf-probe/bin/cf-probe` | `~/.cf-probe/config.conf` | `journalctl --user -u cf-probe -f` |
| Linux / Synology DSM | `/usr/local/bin/cf-probe` | `/etc/config/cf-probe/config.conf` | `/var/log/cf-probe.log` |
| OpenWrt | `/usr/bin/cf-probe` | `/etc/config/cf-probe/config.conf` | `/var/log/cf-probe.log` |
| FreeBSD | `/usr/local/bin/cf-probe` | `/etc/config/cf-probe/config.conf` | `/var/log/cf-probe.log` |
| macOS | `/usr/local/bin/cf-probe` | `/usr/local/etc/cf-probe/config.conf` | `/var/log/cf-probe.log` |
| Windows | `C:\Program Files\cf-probe\cf-probe.exe` | `C:\ProgramData\cf-probe\config.conf` | `C:\ProgramData\cf-probe\cf-probe.log` |

服务名固定为 `cf-probe`。服务会根据系统自动注册为 `systemd`、`OpenRC`、`procd`、`launchd`、Synology rc、Windows 计划任务，或在不支持服务管理器的环境中后台运行。

Linux 普通用户安装固定使用 `systemd --user`；root 安装仍使用系统级服务。普通用户安装会阻止与其他用户或 root 版实例重复运行，但允许覆盖安装当前用户自己的运行实例。

## 查看状态和日志

Linux non-root (`systemd --user`)：

```bash
systemctl --user status cf-probe
journalctl --user -u cf-probe -f
```

systemd 系统：

```bash
sudo systemctl status cf-probe
sudo journalctl -u cf-probe -f
```

OpenRC（Alpine 等）：

```bash
rc-service cf-probe status
tail -f /var/log/cf-probe.log
```

OpenWrt：

```bash
/etc/init.d/cf-probe status
logread -f
```

FreeBSD：

```bash
ps aux | grep cf-probe
tail -f /var/log/cf-probe.log
```

macOS：

```bash
sudo launchctl print system/com.cfsm.cf-probe
sudo tail -f /var/log/cf-probe.log
```

Windows：

```powershell
Get-ScheduledTask -TaskName cf-probe
Get-Content "C:\ProgramData\cf-probe\cf-probe.log" -Wait
```

## 卸载

推荐使用安装脚本触发卸载。脚本会下载临时 `cf-probe` 执行卸载，避免 Windows 下运行中的已安装程序无法删除自身。

Linux、OpenWrt、Synology DSM、FreeBSD、macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sh -s -- uninstall
```

普通用户执行卸载只清理当前用户的 `~/.cf-probe/` 和 `systemd --user` 自启动项；root 执行卸载清理系统级安装。

Windows 请使用管理员权限打开 PowerShell：

```powershell
$script = "$env:TEMP\install-cf-probe.ps1"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.ps1" -OutFile $script -UseBasicParsing
PowerShell -ExecutionPolicy Bypass -File $script uninstall
```

卸载会清理当前 Go 版默认安装创建的固定位置和自启动项，不处理旧脚本或手动放置到其他路径的文件。

## 上报数据说明

Agent 会按 `REPORT_INTERVAL` 向 `WORKER_URL` 发起 `POST` 请求，`Content-Type` 为 `application/json`。为了兼容旧版接收端，`metrics` 内大多数基础指标仍以字符串上报；新增的 `disk` 磁盘 IO 对象使用数值类型。

完整上报结构如下：

```json
{
  "id": "SERVER_ID",
  "secret": "SECRET",
  "metrics": {
    "cpu": "0.00",
    "ram_total": "0",
    "ram_used": "0",
    "swap_total": "0",
    "swap_used": "0",
    "disk_total": "0",
    "disk_used": "0",
    "disk": {
      "read_bps": 0,
      "write_bps": 0,
      "read_iops": 0,
      "write_iops": 0,
      "await_ms": 0,
      "util": 0
    },
    "load_avg": "0 0 0",
    "boot_time": "0",
    "net_rx": "0",
    "net_tx": "0",
    "net_rx_monthly": "0",
    "net_tx_monthly": "0",
    "net_in_speed": "0",
    "net_out_speed": "0",
    "os": "Linux",
    "arch": "amd64",
    "kernel_version": "",
    "cpu_info": "",
    "cpu_cores": "0",
    "gpu_info": null,
    "processes": "0",
    "tcp_conn": "0",
    "udp_conn": "0",
    "ip_v4": "0",
    "ip_v6": "0",
    "ping_ct": false,
    "ping_cu": false,
    "ping_cm": false,
    "ping_bd": false,
    "loss_ct": false,
    "loss_cu": false,
    "loss_cm": false,
    "loss_bd": false
  },
  "collect_interval": 0,
  "report_interval": 60
}
```

当 `COLLECT_INTERVAL > 0` 时，上报体会额外包含 `samples`。`samples` 中只包含高频采样需要的轻量字段，不包含磁盘 IO：

```json
{
  "samples": [
    {
      "ts": 1720000000000,
      "metrics": {
        "cpu": "0.00",
        "ram_total": "0",
        "ram_used": "0",
        "swap_total": "0",
        "swap_used": "0",
        "net_in_speed": "0",
        "net_out_speed": "0"
      }
    }
  ]
}
```

顶层字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 服务器 ID，对应本地 `SERVER_ID` |
| `secret` | string | 服务器密钥，对应本地 `SECRET` |
| `metrics` | object | 当前上报周期的完整监控指标 |
| `samples` | array | 可选，仅 `COLLECT_INTERVAL > 0` 时存在 |
| `collect_interval` | number | 高频采样间隔，单位秒；`0` 表示不启用高频采样 |
| `report_interval` | number | 上报间隔，单位秒 |

`metrics` 字段：

| 字段 | 类型 | 单位/取值 | 说明 |
| --- | --- | --- | --- |
| `cpu` | string | `%` | CPU 使用率，保留 2 位小数 |
| `ram_total` | string | MiB | 物理内存总量 |
| `ram_used` | string | MiB | 物理内存已用量 |
| `swap_total` | string | MiB | Swap 总量；不支持的平台为 `0` |
| `swap_used` | string | MiB | Swap 已用量；不支持的平台为 `0` |
| `disk_total` | string | MiB | 过滤并去重后的本地磁盘总容量 |
| `disk_used` | string | MiB | 过滤并去重后的本地磁盘已用容量 |
| `disk` | object | 见下表 | 磁盘总 IO 信息，采样频率跟随 `REPORT_INTERVAL` |
| `load_avg` | string | `1m 5m 15m` | 系统负载；Windows 为 `0 0 0` |
| `boot_time` | string | ms | 系统启动时间，Unix 毫秒时间戳 |
| `net_rx` | string | bytes | 当前网卡累计接收字节数 |
| `net_tx` | string | bytes | 当前网卡累计发送字节数 |
| `net_rx_monthly` | string | bytes | 当前统计周期内累计下行流量 |
| `net_tx_monthly` | string | bytes | 当前统计周期内累计上行流量 |
| `net_in_speed` | string | bytes/s | 上报周期内平均下行速度 |
| `net_out_speed` | string | bytes/s | 上报周期内平均上行速度 |
| `os` | string | - | 操作系统名称 |
| `arch` | string | - | CPU 架构 |
| `kernel_version` | string | - | 内核或系统版本 |
| `cpu_info` | string | - | CPU 型号或架构兜底值 |
| `cpu_cores` | string | count | CPU 逻辑核心数 |
| `gpu_info` | array/null | - | GPU 信息数组；不可获取时为 `null` |
| `processes` | string | count | 进程数量 |
| `tcp_conn` | string | count | TCP 已建立连接数 |
| `udp_conn` | string | count | UDP 连接或端点数量 |
| `ip_v4` | string | IP/`0` | Cloudflare trace 获取到的 IPv4 |
| `ip_v6` | string | IP/`0` | Cloudflare trace 获取到的 IPv6 |
| `ping_ct` / `ping_cu` / `ping_cm` / `ping_bd` | string/boolean | ms/`false`/`"null"` | 电信、联通、移动、百度探测 RTT；节点未配置为 `false`，探测失败为字符串 `"null"` |
| `loss_ct` / `loss_cu` / `loss_cm` / `loss_bd` | string/boolean | `%`/`false` | 对应探测丢包率；节点未配置为 `false` |

`disk` 字段：

| 字段 | 类型 | 单位 | 说明 |
| --- | --- | --- | --- |
| `read_bps` | number | bytes/s | 上报周期内平均读取速率 |
| `write_bps` | number | bytes/s | 上报周期内平均写入速率 |
| `read_iops` | number | ops/s | 上报周期内平均读 IOPS |
| `write_iops` | number | ops/s | 上报周期内平均写 IOPS |
| `await_ms` | number | ms | 读写请求平均等待时间 |
| `util` | number | `%` | 过滤后磁盘集合的平均繁忙度，范围 `0-100` |

Linux 下磁盘 IO 使用 `/proc/diskstats` 计算，并复用磁盘容量统计的过滤和去重规则；Windows、macOS、FreeBSD 以及其他平台暂不上报复杂磁盘 IO，字段保留为 `0`。

`gpu_info` 数组元素结构如下：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | GPU 名称 |
| `info` | number/null | GPU 使用率或平台兜底值 |
| `id` | string | GPU 序号或平台标识 |

常规指标上报会携带以下 HTTP 头：

| Header | 说明 |
| --- | --- |
| `Content-Type: application/json` | 请求体格式 |
| `Accept: */*` | 接收任意响应格式 |
| `User-Agent: cfsm` | Agent 标识 |
| `X-Agent-Config-Schema` | 当前配置协议版本 |
| `X-Agent-Version` | 当前 Agent 版本 |
| `X-Agent-Config-Md5` | 本地保存的远端配置 MD5；为空时为 `none` |

当 Worker 下发 `rx_correction` 或 `tx_correction` 后，Agent 会额外发送一次流量校正确认：

```json
{
  "id": "SERVER_ID",
  "secret": "SECRET",
  "rx_correction": 0,
  "tx_correction": 0
}
```

其中 `rx_correction` 和 `tx_correction` 为 number，单位 GB。该确认请求只携带 `Content-Type`、`Accept` 和 `User-Agent` 头。

## 从源码构建

需要 Go `1.24` 或更新版本。

```bash
git clone https://github.com/huilang-me/cfsm-agent.git
cd cfsm-agent
go build -trimpath -ldflags "-s -w -X main.version=$(git describe --tags --always --dirty)" -o cf-probe ./cmd/cf-probe
```

构建后可直接安装：

```bash
./cf-probe install -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

前台调试运行：

```bash
./cf-probe run -config ./config.conf -debug=1
```

查看帮助：

```bash
./cf-probe help
```

## 致谢

- [komari-agent](https://github.com/komari-monitor/komari-agent)：本项目的部分监控指标统计口径参考了该项目的实现。
