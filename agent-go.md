# cfsm-agent

`cfsm-agent` 是 CF-Server-Monitor 的 Go Probe Agent，安装后会以 `cf-probe` 服务运行，定时采集服务器资源、网络流量和探测数据，并上报到指定的 Worker 地址。

## 快速安装

从面板或后台获取以下 3 个参数：

- `SERVER_ID`：服务器 ID
- `SECRET`：服务器密钥
- `WORKER_URL`：Worker 上报地址，例如 `https://example.com`

Linux、OpenWrt、Synology DSM、FreeBSD、macOS 可使用安装脚本自动下载当前系统对应的最新 release：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sudo sh -s -- install -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

如果系统没有 `curl`，可使用 `wget`：

```bash
wget -O- https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sudo sh -s -- install -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

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
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sudo sh -s -- install --install-version=v1.0.0 -id=SERVER_ID -secret=SECRET -url=WORKER_URL
```

GitHub 下载较慢时，可以配置代理前缀：

```bash
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sudo sh -s -- install --install-ghproxy=https://gh-proxy.example.com -id=SERVER_ID -secret=SECRET -url=WORKER_URL
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

再次执行 `install` 时，如果本机已有配置文件且未传入完整的 `-id`、`-secret`、`-url`，程序会沿用已有配置。

自动更新默认关闭。安装时传入 `-auto_update=1` 后，Agent 启动时会检查 GitHub release，之后每 6 小时检查一次；稳定版按版本号更新，`Snapshot-` 版本会跟随最新可用 Snapshot prerelease。自动更新只由本地 `AUTO_UPDATE` 配置控制，不依赖面板返回 `update=1`。如果安装时配置了 `--install-ghproxy`，代理会写入本地配置并用于后续自动更新；该本地字段不参与远端配置 MD5 对比。

## 安装位置

| 系统 | 二进制默认位置 | 配置文件 | 日志 |
| --- | --- | --- | --- |
| Linux / Synology DSM | `/usr/local/bin/cf-probe` | `/etc/config/cf-probe/config.conf` | `/var/log/cf-probe.log` |
| OpenWrt | `/usr/bin/cf-probe` | `/etc/config/cf-probe/config.conf` | `/var/log/cf-probe.log` |
| FreeBSD | `/usr/local/bin/cf-probe` | `/etc/config/cf-probe/config.conf` | `/var/log/cf-probe.log` |
| macOS | `/usr/local/bin/cf-probe` | `/usr/local/etc/cf-probe/config.conf` | `/var/log/cf-probe.log` |
| Windows | `C:\Program Files\cf-probe\cf-probe.exe` | `C:\ProgramData\cf-probe\config.conf` | `C:\ProgramData\cf-probe\cf-probe.log` |

服务名固定为 `cf-probe`。服务会根据系统自动注册为 `systemd`、`OpenRC`、`procd`、`launchd`、Synology rc、Windows 计划任务，或在不支持服务管理器的环境中后台运行。

## 查看状态和日志

systemd 系统：

```bash
sudo systemctl status cf-probe
sudo journalctl -u cf-probe -f
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
curl -fsSL https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.sh | sudo sh -s -- uninstall
```

Windows 请使用管理员权限打开 PowerShell：

```powershell
$script = "$env:TEMP\install-cf-probe.ps1"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/huilang-me/cfsm-agent/main/install.ps1" -OutFile $script -UseBasicParsing
PowerShell -ExecutionPolicy Bypass -File $script uninstall
```

卸载会清理当前 Go 版默认安装创建的固定位置和自启动项，不处理旧脚本或手动放置到其他路径的文件。

## 从源码构建

需要 Go `1.24` 或更新版本。

```bash
git clone https://github.com/huilang-me/cfsm-agent.git
cd cfsm-agent
go build -trimpath -ldflags "-s -w -X main.version=$(git describe --tags --always --dirty)" -o cf-probe ./cmd/cf-probe
```

构建后可直接安装：

```bash
sudo ./cf-probe install -id=SERVER_ID -secret=SECRET -url=WORKER_URL
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
