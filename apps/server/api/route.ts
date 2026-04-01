import { Hono } from 'hono';
import userApp from './v1/user.handle';
import bookApp from './v1/book.handle';

const api = new Hono()
  .route('/v1', userApp)
  .route('/v1', bookApp);

export default api;
