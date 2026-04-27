import { authClient } from '@/lib/better-auth';

export type AuthRole = 'admin' | 'librarian' | 'reader';

// 获取用户列表
export const listUsersQuery = {
  queryKey: ['users'],
  queryFn: async () => {
    const { data, error } = await authClient.admin.listUsers({
      query: {},
    });

    if (error) {
      throw new Error(error.message || '获取用户列表失败');
    }

    return data.users;
  },
};

// 更新用户角色
export const updateUserRoleMutation = {
  mutationFn: async ({
    userId,
    newRole,
  }: {
    userId: string;
    newRole: AuthRole;
  }) => {
    const { error } = await authClient.admin.setRole({
      userId,
      role: newRole,
    });

    if (error) {
      throw new Error(error.message || '角色修改失败');
    }
  },
};
