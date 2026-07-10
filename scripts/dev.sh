#!/usr/bin/env bash
# 로컬 개발 스택(MySQL + Go 백엔드 + Vite 프론트) 통합 관리 스크립트.
#   ./scripts/dev.sh start | stop | restart | status | logs [back|front]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER="$ROOT/server"
RUN="$ROOT/.dev"
mkdir -p "$RUN"

BACK_PORT=8080
FRONT_PORT=5173
DB_PORT=3307
COMPOSE="$ROOT/deploy/docker-compose.yml"
MYSQL_NAME=planforj-mysql

BACK_PID="$RUN/backend.pid";  BACK_LOG="$RUN/backend.log"
FRONT_PID="$RUN/frontend.pid"; FRONT_LOG="$RUN/frontend.log"

# --- 유틸 ---
is_alive()   { [[ -f "$1" ]] && kill -0 "$(cat "$1")" 2>/dev/null; }
free_port()  { lsof -ti "tcp:$1" 2>/dev/null | xargs kill -9 2>/dev/null || true; }
port_up()    { lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

db_up() {
  if docker ps --format '{{.Names}}' | grep -q "^${MYSQL_NAME}$"; then
    echo "• MySQL 이미 실행 중"
  else
    echo "• MySQL 기동..."
    docker compose -f "$COMPOSE" up -d
    for _ in $(seq 1 30); do
      if docker exec "$MYSQL_NAME" mysqladmin ping -h127.0.0.1 -uplanforj -pplanforj --silent 2>/dev/null; then
        echo "  MySQL 준비 완료"; return 0
      fi
      sleep 1
    done
    echo "  ⚠ MySQL 준비 확인 실패(그대로 진행)"
  fi
}

start_back() {
  if is_alive "$BACK_PID"; then echo "• 백엔드 이미 실행 중 (PID $(cat "$BACK_PID"))"; return; fi
  free_port "$BACK_PORT"
  echo "• 백엔드 빌드..."
  ( cd "$SERVER" && go build -o bin/api ./cmd/api )
  echo "• 백엔드 기동 (:$BACK_PORT)..."
  ( cd "$SERVER" && DB_PORT=$DB_PORT APP_PORT=$BACK_PORT nohup ./bin/api >"$BACK_LOG" 2>&1 & echo $! >"$BACK_PID" )
  sleep 1
  is_alive "$BACK_PID" && echo "  OK (PID $(cat "$BACK_PID"), 로그 $BACK_LOG)" || { echo "  ✗ 기동 실패 — $BACK_LOG 확인"; tail -5 "$BACK_LOG" || true; }
}

start_front() {
  if is_alive "$FRONT_PID"; then echo "• 프론트 이미 실행 중 (PID $(cat "$FRONT_PID"))"; return; fi
  free_port "$FRONT_PORT"
  echo "• 프론트 기동 (:$FRONT_PORT)..."
  ( cd "$ROOT" && nohup npm run dev >"$FRONT_LOG" 2>&1 & echo $! >"$FRONT_PID" )
  sleep 1
  is_alive "$FRONT_PID" && echo "  OK (PID $(cat "$FRONT_PID"), 로그 $FRONT_LOG)" || { echo "  ✗ 기동 실패 — $FRONT_LOG 확인"; tail -5 "$FRONT_LOG" || true; }
}

stop_one() { # 이름 pidfile 포트
  local name="$1" pf="$2" port="$3"
  if is_alive "$pf"; then echo "• $name 정지 (PID $(cat "$pf"))"; kill "$(cat "$pf")" 2>/dev/null || true; fi
  rm -f "$pf"
  free_port "$port"   # npm이 남긴 자식(vite) 등 포트 잔여 정리
}

cmd_start() {
  db_up
  start_back
  start_front
  echo ""
  echo "▶ 프론트  http://localhost:$FRONT_PORT"
  echo "▶ 백엔드  http://localhost:$BACK_PORT/api/health"
}

cmd_stop() {
  stop_one "프론트" "$FRONT_PID" "$FRONT_PORT"
  stop_one "백엔드" "$BACK_PID" "$BACK_PORT"
  echo "• (MySQL 컨테이너는 유지 — 완전 종료: docker compose -f deploy/docker-compose.yml down)"
}

cmd_status() {
  printf "%-8s %-6s %-8s\n" "구성" "포트" "상태"
  printf "%-8s %-6s %-8s\n" "MySQL" "$DB_PORT" "$(docker ps --format '{{.Names}}' | grep -q "^${MYSQL_NAME}$" && echo UP || echo DOWN)"
  printf "%-8s %-6s %-8s\n" "백엔드" "$BACK_PORT" "$(port_up "$BACK_PORT" && echo UP || echo DOWN)"
  printf "%-8s %-6s %-8s\n" "프론트" "$FRONT_PORT" "$(port_up "$FRONT_PORT" && echo UP || echo DOWN)"
}

cmd_logs() {
  case "${1:-both}" in
    back)  tail -f "$BACK_LOG" ;;
    front) tail -f "$FRONT_LOG" ;;
    *)     tail -f "$BACK_LOG" "$FRONT_LOG" ;;
  esac
}

case "${1:-}" in
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_stop; echo "---"; cmd_start ;;
  status)  cmd_status ;;
  logs)    cmd_logs "${2:-both}" ;;
  *) echo "사용법: $0 {start|stop|restart|status|logs [back|front]}"; exit 1 ;;
esac
