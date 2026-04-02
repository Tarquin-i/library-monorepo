import { client } from '@/lib/rpc';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const listUsersQuery = {
  queryKey: ['users'],
  queryFn: async () => {
    const res = await client.users.$get();
    const json = await res.json();
    return json.data;
  },
};

export const listRolesQuery = {
  queryKey: ['roles'],
  queryFn: async () => {
    const res = await client.roles.$get();
    const json = await res.json();
    return json.data;
  },
};

export const updateUserRoleMutation = {
  mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
    await client.users[':id'].role.$patch({
      param: { id: userId },
      json: { role: newRole },
    });
  },
};
