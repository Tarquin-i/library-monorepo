import { OpenAPIHono } from '@hono/zod-openapi';
import * as userRouter from '@tarquin/types/api/v1/user.type';
import * as listUserHandler from './v1/user.handle';


export function initOpenAPIRouter(app: OpenAPIHono) {
  const v1Router = new OpenAPIHono();

  v1Router.openapi(userRouter.listUsers, listUserHandler.listUsers);

  app.route('/api/v1', v1Router);
}
