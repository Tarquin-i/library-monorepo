#!/bin/bash
# 方式一：直接用 bash 运行                                                                                                              
# bash shit.sh                                                                                                                            
                                                                                                                                          
# 方式二：先赋予执行权限，再运行                                                                                                        
# chmod +x shit.sh                                      
# ./shit.sh

# 输出颜色配置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

echo -e "${YELLOW}正在启动 PostgreSQL 容器...${NC}"

# 停止并删除已存在的容器
docker stop monorepo-postgres 2>/dev/null
docker rm monorepo-postgres 2>/dev/null

# 启动 PostgreSQL 容器
docker run --name monorepo-postgres \
  -e POSTGRES_PASSWORD=123654 \
  -p 5432:5432 \
  -d postgres:latest

# 等待 PostgreSQL 准备就绪
echo -e "${YELLOW}等待 PostgreSQL 准备就绪...${NC}"
sleep 5

# 检查容器是否正在运行
if ! docker ps | grep -q monorepo-postgres; then
  echo -e "${RED}启动 PostgreSQL 容器失败${NC}"
  exit 1
fi

# 等待 PostgreSQL 接受连接
echo -e "${YELLOW}检查 PostgreSQL 连接状态...${NC}"
for i in {1..30}; do
  if docker exec monorepo-postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "${GREEN}PostgreSQL 已准备就绪！${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}PostgreSQL 在 30 秒内启动失败${NC}"
    exit 1
  fi
  sleep 1
done

# 创建数据库和用户
echo -e "${YELLOW}正在创建数据库和用户...${NC}"
docker exec monorepo-postgres psql -U postgres -c "CREATE DATABASE monorepo_local;"
docker exec monorepo-postgres psql -U postgres -c "CREATE USER monorepo WITH PASSWORD '123654';"
docker exec monorepo-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE monorepo_local TO monorepo;"

# 授予用户对 public schema 的完整权限
echo -e "${YELLOW}正在配置用户权限...${NC}"
docker exec monorepo-postgres psql -U postgres -d monorepo_local -c "GRANT ALL ON SCHEMA public TO monorepo;"
docker exec monorepo-postgres psql -U postgres -d monorepo_local -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO monorepo;"
docker exec monorepo-postgres psql -U postgres -d monorepo_local -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO monorepo;"
docker exec monorepo-postgres psql -U postgres -d monorepo_local -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO monorepo;"
docker exec monorepo-postgres psql -U postgres -d monorepo_local -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO monorepo;"

# 创建必要的 PostgreSQL 扩展
echo -e "${YELLOW}正在创建 PostgreSQL 扩展...${NC}"
docker exec monorepo-postgres psql -U postgres -d monorepo_local -c "CREATE EXTENSION IF NOT EXISTS ltree;"

echo -e "${GREEN}PostgreSQL 设置完成！${NC}"
echo -e "${GREEN}容器名称: monorepo-postgres${NC}"
echo -e "${GREEN}数据库: monorepo_local${NC}"
echo -e "${GREEN}用户: monorepo${NC}"
echo -e "${GREEN}密码: 123654${NC}"
echo -e "${GREEN}端口: 5432${NC}"
echo ""
echo -e "${YELLOW}连接字符串: postgresql://monorepo:123654@localhost:5432/monorepo_local${NC}"
