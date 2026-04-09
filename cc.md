# 一个路由一个页面慢慢实现，不要一次性生成完

# 书籍借阅页面实现计划

## Context（背景）
用户需要实现一个书籍借阅功能的前端页面，让普通读者可以浏览可借阅的书籍并提交借阅申请。后端接口已经完成，包括：
- `POST /borrowings/apply` - 借阅申请接口
- `GET /books` - 获取书籍列表接口
- 借阅规则：最多借5本、有逾期不能借新书、可借库存必须>0

当前项目使用：
- 前端：React + TanStack Router + TanStack Query + shadcn/ui + Tailwind CSS
- 后端：Hono + Drizzle ORM + PostgreSQL
- 认证：Better Auth（通过 `authClient.useSession()` 获取当前用户）
- API调用：Hono RPC Client（类型安全的API调用）

## 用户需求确认
根据多轮问答，用户明确了以下需求：
1. **功能范围**：只显示最基本的功能（书籍列表 + 借阅申请）
2. **书籍信息**：显示基础信息（书名、作者、ISBN、可借数量、借阅按钮）
3. **借阅交互**：点击借阅按钮后弹出确认对话框，再次确认后提交
4. **借阅记录**：使用单独页面，本次只完成书籍借阅页面

## 待确认问题
在开始实现前，还需要确认以下细节：

### 1. 搜索筛选功能
- **选项A（推荐）**：顶部搜索框，支持按书名、作者、ISBN搜索
- **选项B**：搜索 + 分类筛选 + 状态筛选 + 排序
- **选项C**：不需要搜索，直接展示所有书籍

### 2. 借阅规则提示
- **选项A（推荐）**：在页面顶部显示提示卡片，说明借阅规则（最多借5本、有逾期不能借等）
- **选项B**：不显示规则提示，违规时通过toast提示
- **选项C**：提供帮助按钮，点击后弹出详细规则

### 3. 书籍状态显示
- **选项A（推荐）**：显示可借数量，如果为0则禁用借阅按钮并显示"已借完"
- **选项B**：只显示"可借"或"已借完"的状态标签
- **选项C**：显示可借数量 + 总库存 + 书籍状态（可借阅/已借出/已丢失/已销毁）

### 4. 页面布局风格
- **选项A（推荐）**：使用Table组件展示书籍列表，简洁清晰（参考现有的BookListTable）
- **选项B**：使用Card卡片展示每本书，带封面图和详细信息
- **选项C**：列表形式，每行一本书，左侧封面右侧信息

## 最终确认方案

1. **搜索功能**：添加搜索框UI，但暂不实现搜索功能（先占位）
2. **规则提示**：不显示规则提示，违规时通过toast提示错误信息
3. **状态显示**：
   - 表格单独一列显示"可借数量"（数字）
   - 借阅按钮旁边显示"可借/已借完"状态标签
4. **页面布局**：表格布局，复用现有Table组件

## 实现计划（待用户确认后执行）

### 关键文件
- `/apps/client/src/app/main/book-borrowing/book-borrowing.tsx` - 主页面组件
- `/apps/client/src/api/borrowing.query.ts` - 新建，借阅相关的API查询和mutation
- `/apps/client/src/components/ui/dialog.tsx` - 确认对话框组件（可能需要新建）
- `/apps/client/src/components/ui/alert.tsx` - 提示卡片组件（可能需要新建）

### 实现步骤

#### 1. 创建借阅API查询文件 ✅
创建 `apps/client/src/api/borrowing.query.ts`：
- 复用 `listBooksQuery`（已存在于book.query.ts）
- 新增 `applyBorrowingMutation` - 调用 `POST /borrowings/apply` 接口
- **已完成**：通过判断返回json中是否有message字段来区分成功/失败

#### 2. 实现书籍借阅主页面 ✅
修改 `apps/client/src/app/main/book-borrowing/book-borrowing.tsx`：
- 使用 `authClient.useSession()` 获取当前用户ID
- 使用 `useQuery(listBooksQuery)` 获取书籍列表
- 添加搜索框UI（暂不实现搜索功能）
- 实现书籍列表Table，包含以下列：
  - 书名
  - 作者
  - ISBN
  - 可借数量（数字）
  - 操作列：借阅按钮 + 状态标签（可借/已借完）
    - 可借数量>0且状态为available时显示"可借"，按钮可用
    - 可借数量=0或状态不可借时显示"已借完"，按钮禁用
- **已完成**：页面布局、表格展示、状态判断逻辑

#### 3. 创建借阅确认对话框组件 ✅
- 使用 `npx shadcn@latest add alert-dialog` 安装组件
- 点击借阅按钮时弹出对话框，显示书籍信息和确认提示
- 确认后调用 `applyBorrowingMutation` 提交借阅申请
- 成功后显示toast提示（使用sonner），并刷新书籍列表
- **已完成**：AlertDialog组件已安装并集成到主页面

#### 4. 错误处理 ✅
- 处理借阅失败的情况（库存不足、已借5本、有逾期等）
- 通过toast显示友好的错误提示
- **已完成**：在mutation的onError中捕获错误并显示toast

### 技术实现细节

#### API调用方式
```typescript
// 使用Hono RPC Client
import { client } from '@/lib/rpc';

// 借阅申请
const res = await client.borrowings.apply.$post({
  json: { ISBN: 'xxx', userId: 'xxx' }
});
```

#### 状态管理
- 使用TanStack Query管理服务端状态
- 借阅成功后使用 `queryClient.invalidateQueries(['books'])` 刷新列表

#### 样式
- 复用现有的shadcn/ui组件和Tailwind CSS类
- 保持与BookInput页面一致的布局风格

## 验证方式
1. 页面正常渲染，显示书籍列表
2. 搜索功能正常工作（如果实现）
3. 点击借阅按钮弹出确认对话框
4. 确认后成功提交借阅申请，显示成功提示
5. 借阅失败时显示正确的错误提示
6. 可借数量为0或书籍状态不可借时，借阅按钮禁用

## 风险和注意事项
1. 需要确认shadcn/ui的Dialog和Alert组件是否已安装，如果没有需要先安装
2. 后端接口返回的错误信息需要正确处理并展示给用户
3. 借阅成功后需要刷新书籍列表，确保可借数量更新
4. 用户未登录时需要跳转到登录页面（应该已有路由守卫处理）
