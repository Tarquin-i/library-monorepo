import { client } from '@/lib/rpc';

export const listUsersQuery = {
  queryKey: ['users'],
  queryFn: async () => {
    const res = await client.users.$get();
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '获取用户列表失败');
    }
    return json.data;
  },
};

export const listRolesQuery = {
  queryKey: ['roles'],
  queryFn: async () => {
    const res = await client.roles.$get();
    const json = await res.json();
    // console.log('res--------------', res);
    // console.log('json--------------', json);
    if ('message' in json) {
      throw new Error(json.message || '获取角色列表失败');
    }
    return json.data;
  },
};

export const updateUserRoleMutation = {
  mutationFn: async ({
    userId,
    newRole,
  }: {
    userId: string;
    newRole: string;
  }) => {
    await client.users[':id'].role.$patch({
      param: { id: userId },
      json: { role: newRole },
    });
  },
};
