import { Link, useNavigate } from '@tanstack/react-router';
import { useId, useState } from 'react';
import { toast } from 'sonner';
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
import { authClient } from '@/lib/better-auth';
import { cn } from '@/lib/utils';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const emailId = useId();
  const passwordId = useId();
  const [formData, setformData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    // 阻止默认表单提交行为
    e.preventDefault();
    setIsLoading(true);
    // 登录逻辑
    const { error } = await authClient.signIn.email({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      // 处理登录错误
      // console.error('登录失败:', error);
      toast.error('登录失败，请检查您的电子邮件和密码。');
    } else {
      // 登录成功，处理用户数据
      // console.log('登录成功:', data);
      toast.success('登录成功！即将跳转到主页。');
      navigate({ to: '/dashboard' });
    }

    setIsLoading(false);
  };
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>登录您的账户</CardTitle>
          <CardDescription>请输入您的电子邮件和密码以继续。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={emailId}>电子邮件</FieldLabel>
                <Input
                  id={emailId}
                  type='email'
                  placeholder='请输入您的电子邮件'
                  value={formData.email}
                  onChange={(e) =>
                    setformData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </Field>
              <Field>
                <div className='flex items-center'>
                  <FieldLabel htmlFor={passwordId}>密码</FieldLabel>
                </div>
                <Input
                  id={passwordId}
                  type='password'
                  placeholder='请输入您的密码'
                  value={formData.password}
                  onChange={(e) =>
                    setformData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </Field>
              <Field>
                <Button type='submit' disabled={isLoading}>
                  {isLoading ? '登录中...' : '登录'}
                </Button>
                <FieldDescription className='text-center'>
                  没有账户?
                  <Link to='/register'>注册</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
