import { createRoute, z } from '@hono/zod-openapi';

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listUsers = createRoute({
  method: 'get',
  path: '/users',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            data: z.array(userSchema),
          }),
        },
      },
      description: 'Retrieve the user',
    },
  },
});

export type ListUsers = typeof listUsers;