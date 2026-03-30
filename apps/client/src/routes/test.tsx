import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { authClient } from '@/lib/better-auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/test')({
  component: TestPage,
})

interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: string
  updatedAt: string
}

function TestPage() {
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    name: '',
  })

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  const { data: response, isLoading, error } = useQuery<{ data: User[] }>({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/v1/users'),
  })

  const users = response?.data || []

  const registerMutation = useMutation({
    mutationFn: async (data: typeof registerForm) => {
      return authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setRegisterForm({ email: '', password: '', name: '' })
      alert('注册成功！')
    },
    onError: (error) => {
      alert(`注册失败：${error.message}`)
    },
  })

  const loginMutation = useMutation({
    mutationFn: async (data: typeof loginForm) => {
      return authClient.signIn.email({
        email: data.email,
        password: data.password,
      })
    },
    onSuccess: () => {
      setLoginForm({ email: '', password: '' })
      alert('登录成功！')
    },
    onError: (error) => {
      alert(`登录失败：${error.message}`)
    },
  })

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    registerMutation.mutate(registerForm)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate(loginForm)
  }

  const handleLogout = async () => {
    await authClient.signOut()
    alert('已登出')
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">后端和数据库测试页面</h1>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">数据库连接测试</h2>
        {isLoading && <p>加载中...</p>}
        {error && (
          <p className="text-red-500">
            错误：{error instanceof Error ? error.message : '未知错误'}
          </p>
        )}
        {users && (
          <div>
            <p className="mb-2">用户列表（共 {users.length} 个用户）：</p>
            {users.length === 0 ? (
              <p className="text-gray-500">数据库为空</p>
            ) : (
              <ul className="space-y-2">
                {users.map((user) => (
                  <li key={user.id} className="border p-2 rounded">
                    <p>姓名：{user.name}</p>
                    <p>邮箱：{user.email}</p>
                    <p className="text-sm text-gray-500">
                      ID：{user.id}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">认证状态</h2>
        {session ? (
          <div>
            <p className="mb-2">已登录</p>
            <p>用户：{session.user.name}</p>
            <p>邮箱：{session.user.email}</p>
            <Button onClick={handleLogout} className="mt-4">
              登出
            </Button>
          </div>
        ) : (
          <p>未登录</p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">用户注册</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="register-name">姓名</Label>
            <Input
              id="register-name"
              value={registerForm.name}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="register-email">邮箱</Label>
            <Input
              id="register-email"
              type="email"
              value={registerForm.email}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, email: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="register-password">密码</Label>
            <Input
              id="register-password"
              type="password"
              value={registerForm.password}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, password: e.target.value })
              }
              required
            />
          </div>
          <Button type="submit" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? '注册中...' : '注册'}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">用户登录</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="login-email">邮箱</Label>
            <Input
              id="login-email"
              type="email"
              value={loginForm.email}
              onChange={(e) =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="login-password">密码</Label>
            <Input
              id="login-password"
              type="password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              required
            />
          </div>
          <Button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? '登录中...' : '登录'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

