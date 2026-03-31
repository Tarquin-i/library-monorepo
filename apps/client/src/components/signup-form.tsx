import { useId, useState } from 'react';
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
import { Link, useNavigate } from '@tanstack/react-router';
import { authClient } from '@/lib/better-auth';
import { toast } from 'sonner';

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不匹配，请重新输入。');
      setIsLoading(false);
      return;
    }
    // 这里可以添加表单验证和提交逻辑
    const { data, error } = await authClient.signUp.email({
      email: formData.email,
      password: formData.password,
      name: formData.name,
    });
    if (error) {
      // 处理注册错误
      console.error('注册失败:', error);
      toast.error('注册失败，请检查您的信息并重试。');
    } else {
      // 注册成功，处理用户数据
      console.log('注册成功:', data);
      toast.success('注册成功！即将跳转到主页。');
      navigation({ to: '/dashboard' });
    }
    setIsLoading(false);
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>创建您的账户</CardTitle>
        <CardDescription>请输入您的信息以创建一个新账户</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={nameId}>用户名</FieldLabel>
              <Input
                id={nameId}
                type='text'
                placeholder='请输入您的用户名'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={emailId}>邮箱地址</FieldLabel>
              <Input
                id={emailId}
                type='email'
                placeholder='请输入您的邮箱地址'
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <FieldDescription>
                我们将使用此邮箱与您联系。我们不会与任何人分享您的邮箱。
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={passwordId}>密码</FieldLabel>
              <Input
                id={passwordId}
                type='password'
                placeholder='请输入您的密码'
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                pattern='^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,}$'
              />
              <FieldDescription>
                必须在6个字符以上，且包含字母和数字。
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={confirmPasswordId}>确认密码</FieldLabel>
              <Input
                id={confirmPasswordId}
                type='password'
                placeholder='请再次输入您的密码'
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
              />
              <FieldDescription>请确认您的密码。</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type='submit' disabled={isLoading}>
                  {isLoading ? '创建账户中...' : '创建账户'}
                </Button>
                <FieldDescription className='px-6 text-center'>
                  已有账户？ <Link to='/login'>登录</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
