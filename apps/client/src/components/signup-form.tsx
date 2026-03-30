import { useId } from 'react';
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

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>创建您的账户</CardTitle>
        <CardDescription>
          请输入您的信息以创建一个新账户
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={nameId}>用户名</FieldLabel>
              <Input id={nameId} type='text' placeholder='请输入您的用户名' required />
            </Field>
            <Field>
              <FieldLabel htmlFor={emailId}>邮箱地址</FieldLabel>
              <Input
                id={emailId}
                type='email'
                placeholder='请输入您的邮箱地址'
                required
              />
              <FieldDescription>
                我们将使用此邮箱与您联系。我们不会与任何人分享您的邮箱。
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
              <Input id={passwordId} type='password' required />
              <FieldDescription>
                必须在8个字符以上。
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor='confirm-password'>
                确认密码
              </FieldLabel>
              <Input id={confirmPasswordId} type='password' required />
              <FieldDescription>请确认您的密码。</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type='submit'>创建账户</Button>
                <Button variant='outline' type='button'>
                  使用 Google 注册
                </Button>
                <FieldDescription className='px-6 text-center'>
                  已有账户？{' '}
                  <a href='https://google.com'>Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
