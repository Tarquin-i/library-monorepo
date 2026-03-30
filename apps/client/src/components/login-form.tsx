import { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/better-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authClient.signIn.email({
        email,
        password,
      });
      alert('登录成功！');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>登录您的账户</CardTitle>
          <CardDescription>
            输入您的邮箱地址以登录到您的账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className='mb-4 p-3 bg-red-100 text-red-700 rounded'>
                {error}
              </div>
            )}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={emailId}>邮箱地址</FieldLabel>
                <Input
                  id={emailId}
                  type='email'
                  placeholder='m@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className='flex items-center'>
                  <FieldLabel htmlFor={passwordId}>密码</FieldLabel>
                  <a
                    href='https://google.com'
                    className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
                  >
                    忘记密码？
                  </a>
                </div>
                <Input
                  id={passwordId}
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Button type='submit' disabled={isLoading}>
                  {isLoading ? '登录中...' : 'Login'}
                </Button>
                <Button variant='outline' type='button'>
                  Login with Google
                </Button>
                <FieldDescription className='text-center'>
                  没有账户？{' '}
                  <a href='https://google.com'>注册</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
