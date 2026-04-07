import { Hono } from 'hono';
import userApp from './v1/user.handle';
import bookApp from './v1/book.handle';
import borrowingApp from './v1/borrowing.handle';
import renewalApp from './v1/renewal.handle';

const api = new Hono()
  .route('/v1', userApp)
  .route('/v1', bookApp)
  .route('/v1', borrowingApp)
  .route('/v1', renewalApp);
export default api;
