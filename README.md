## demo-monorepo

### 1. 安装依赖

```sh
bun install
```

### 2. 创建数据库

```sh
bash shit.sh
```

数据库连接：

```sh
postgresql://monorepo:123654@localhost:5432/monorepo_local
```

### 3. 复制环境变量

```sh
cp apps/client/.env.example apps/client/.env
cp apps/server/.env.example apps/server/.env
cp packages/db/.env.example packages/db/.env
```
### 4. 初始化并启动

```sh
bun run --cwd packages/db db:reset
bun dev
```

启动后访问：

- 前端：<http://localhost:3000>
- 后端：<http://localhost:3100>
