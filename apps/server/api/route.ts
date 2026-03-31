import { Hono } from 'hono';
import userApp from './v1/user.handle';

const api = new Hono()
  .route('/v1', userApp);

export default api;
