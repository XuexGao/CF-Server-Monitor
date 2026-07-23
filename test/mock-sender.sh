#!/bin/bash
# macOS模拟数据发送脚本
# 用于测试 CF-Server-Monitor 工作原理
# bash test/mock-sender.sh 550e8400-e29b-41d4-a716-446655440001 123456 http://localhost:8787/update 10 1.3.0
# curl -k -i -X POST 'https://localhost:8787/update' \
#   -H 'Content-Type: application/json' \
#   -H 'X-Agent-Version: 1.2.0' \
#   -d '{"id":"550e8400-e29b-41d4-a716-446655440001","secret":"123456","metrics":{"cpu":"45.5","ram":"60.2","disk":"35.8"}}'

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

info() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step() { echo -e "${BLUE}[→]${NC} $1"; }

SERVER_ID="${1:-550e8400-e29b-41d4-a716-446655440001}"
SECRET="${2:-123456}"
WORKER_URL="${3:-https://localhost:8787/update}"
REPORT_INTERVAL="${4:-10}"
AGENT_VERSION="${5:-1.3.0}"

generate_random() {
    awk -v min="$1" -v max="$2" 'BEGIN{srand(); printf "%.2f", min + rand() * (max - min)}'
}

generate_int() {
    awk -v min="$1" -v max="$2" 'BEGIN{srand(); printf "%d", int(min + rand() * (max - min + 1))}'
}

escape_json() {
    local val="${1:-}"
    val="${val//\\/\\\\}"
    val="${val//\"/\\\"}"
    val="${val//$'\n'/ }"
    val="${val//$'\r'/}"
    printf '%s' "$val"
}

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     CF-Server-Monitor Mock Data Sender (macOS)   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""
info "服务器ID: $SERVER_ID"
info "上报地址: $WORKER_URL"
info "上报间隔: ${REPORT_INTERVAL}秒"
info "Agent版本: ${AGENT_VERSION}"
echo ""

RX_PREV=$(generate_int 0 100000000)
TX_PREV=$(generate_int 0 100000000)
PREV_LOOP_TIME=$(date +%s)

while true; do
    LOOP_START_TIME=$(date +%s)
    
    CPU=$(generate_random 5 85)
    GPU=$(generate_random 0 95)
    RAM=$(generate_random 20 80)
    RAM_TOTAL=$(generate_int 8 64)
    RAM_USED=$(awk -v total="$RAM_TOTAL" -v pct="$RAM" 'BEGIN{printf "%d", total * pct / 100}')
    SWAP_TOTAL=$(generate_int 0 32)
    SWAP_USED=$(generate_int 0 5)
    DISK=$(generate_random 30 75)
    DISK_TOTAL=$(generate_int 100 500)
    DISK_USED=$(awk -v total="$DISK_TOTAL" -v pct="$DISK" 'BEGIN{printf "%d", total * pct / 100}')
    
    LOAD_AVG=$(echo "$(generate_random 0.1 2.0) $(generate_random 0.1 1.8) $(generate_random 0.1 1.5)")
    
    BOOT_TIME=$(($(date +%s) - $(generate_int 3600 86400)))000
    
    OS="$(sw_vers -productName 2>/dev/null || echo "macOS") $(sw_vers -productVersion 2>/dev/null || echo "14.0")"
    ARCH=$(uname -m)
    CPU_INFO=$(sysctl -n machdep.cpu.brand_string 2>/dev/null | head -n1 || echo "$ARCH")
    GPU_INFO=$(system_profiler SPDisplaysDataType 2>/dev/null | awk -F': ' '/Chipset Model|GPU/{print $2; exit}' || echo "Mock GPU")
    [ -z "${GPU_INFO:-}" ] && GPU_INFO="Mock GPU"
    CPU_CORES=$(sysctl -n hw.ncpu 2>/dev/null || echo "4")
    PROCESSES=$(ps aux | wc -l | tr -d ' ')
    TCP_CONN=$(netstat -an -p tcp 2>/dev/null | grep -c ESTABLISHED || generate_int 10 100)
    UDP_CONN=$(generate_int 5 50)
    
    TIME_DELTA=$((LOOP_START_TIME - PREV_LOOP_TIME))
    [ "${TIME_DELTA}" -le 0 ] && TIME_DELTA=${REPORT_INTERVAL}
    
    RX_NOW=$((RX_PREV + $(generate_int 1000000 50000000)))
    TX_NOW=$((TX_PREV + $(generate_int 100000 5000000)))
    
    RX_DELTA=$((RX_NOW - RX_PREV))
    TX_DELTA=$((TX_NOW - TX_PREV))
    [ "${RX_DELTA}" -lt 0 ] && RX_DELTA=0
    [ "${TX_DELTA}" -lt 0 ] && TX_DELTA=0
    
    RX_SPEED=$((RX_DELTA / TIME_DELTA))
    TX_SPEED=$((TX_DELTA / TIME_DELTA))
    
    RX_PREV=${RX_NOW}
    TX_PREV=${TX_NOW}
    PREV_LOOP_TIME=${LOOP_START_TIME}
    
    IPV4=$(generate_int 0 1)
    IPV6=$(generate_int 0 1)
    PING_CT=$(generate_int 10 150)
    PING_CU=$(generate_int 20 200)
    PING_CM=$(generate_int 30 250)
    PING_BD=$(generate_int 50 300)
    LOSS_CT=$(generate_int 0 8)
    LOSS_CU=$(generate_int 0 12)
    LOSS_CM=$(generate_int 0 10)
    LOSS_BD=$(generate_int 0 15)
    
    NET_RX_MONTHLY=$(generate_int 100000000 1500000000)
    NET_TX_MONTHLY=$(generate_int 150000000 750000000)
    
    EOS=$(escape_json "${OS}")
    EARCH=$(escape_json "${ARCH}")
    ECPU=$(escape_json "${CPU_INFO}")
    EGPU=$(escape_json "${GPU_INFO}")
    
    PAYLOAD=$(cat <<EOF
{"id":"$SERVER_ID","secret":"$SECRET","metrics":{"cpu":"$CPU","gpu":"$GPU","gpu_info":"$EGPU","ram":"$RAM","ram_total":"$RAM_TOTAL","ram_used":"$RAM_USED","swap_total":"$SWAP_TOTAL","swap_used":"$SWAP_USED","disk":"$DISK","disk_total":"$DISK_TOTAL","disk_used":"$DISK_USED","load_avg":"$LOAD_AVG","boot_time":"$BOOT_TIME","net_rx":"$RX_NOW","net_tx":"$TX_NOW","net_rx_monthly":"$NET_RX_MONTHLY","net_tx_monthly":"$NET_TX_MONTHLY","net_in_speed":"$RX_SPEED","net_out_speed":"$TX_SPEED","os":"$EOS","arch":"$EARCH","cpu_info":"$ECPU","cpu_cores":"$CPU_CORES","processes":"$PROCESSES","tcp_conn":"$TCP_CONN","udp_conn":"$UDP_CONN","ip_v4":"$IPV4","ip_v6":"$IPV6","ping_ct":"$PING_CT","ping_cu":"$PING_CU","ping_cm":"$PING_CM","ping_bd":"$PING_BD","loss_ct":"$LOSS_CT","loss_cu":"$LOSS_CU","loss_cm":"$LOSS_CM","loss_bd":"$LOSS_BD"}}
EOF
)
    
    RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -H "X-Agent-Version: ${AGENT_VERSION}" -d "$PAYLOAD" -m 5 --connect-timeout 2 "$WORKER_URL" 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "201" ]; then
        info "[$(date '+%Y-%m-%d %H:%M:%S')] 数据上报成功 - CPU: ${CPU}% | GPU: ${GPU}% | Loss CT: ${LOSS_CT}% | RAM: ${RAM}% | Disk: ${DISK}%"
    else
        warn "[$(date '+%Y-%m-%d %H:%M:%S')] 数据上报失败 (HTTP: $RESPONSE)"
    fi
    
    LOOP_END_TIME=$(date +%s)
    EXEC_DURATION=$((LOOP_END_TIME - LOOP_START_TIME))
    SLEEP_TIME=$((REPORT_INTERVAL - EXEC_DURATION))
    [ "${SLEEP_TIME}" -le 0 ] && SLEEP_TIME=1
    
    sleep "${SLEEP_TIME}"
done
