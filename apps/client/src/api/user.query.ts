import { client } from '@/lib/rpc';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// 获取用户列表
export async function listUsersQuery() {
  const res = await client.users.$get();
  const json = await res.json();
  return json.data;
}

// 获取角色列表
export async function listRolesQuery() {
  const res = await client.roles.$get();
  const json = await res.json();
  return json.data;
}

// 更新用户角色
export async function updateUserRoleMutation(userId: string, newRole: string) {
  await client.users[':id'].role.$patch({
    param: { id: userId },
    json: { role: newRole },
  });
}
