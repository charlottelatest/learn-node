const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(storeController.getStores));
// GET /stores
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/pages/:page', catchErrors(storeController.getStores));
// GET /stores/add
router.get('/add', authController.isLoggedIn, storeController.addStore);
// POST stores
router.post(
  '/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
// PUT /stores
router.post(
  '/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);
// GET /stores/:id/edit
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
// GET /stores/:slug
router.get('/stores/:slug', catchErrors(storeController.getStoreBySlug));
// Get /tags
router.get('/tags', catchErrors(storeController.getStoresByTag));
// Get /tags/:tag
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));
// router.get('/reverse/:name', (req, res) => {
//   const reverse = [...req.params.name].reverse().join('');
//   res.send(reverse);
// });

router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);
router.post(
  '/register',
  userController.validateRegister,
  userController.register,
  authController.login
);
router.get('/logout', authController.logout);
router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
// https://localhost:7777/account/reset/983ab4d3e064f64b6c535bbc8fd1ee66501ea036
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post(
  '/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);
router.get('/map', storeController.mapPage);
router.get(
  '/hearts',
  authController.isLoggedIn,
  catchErrors(storeController.heartedStores)
);
router.post(
  '/reviews/:storeId',
  authController.isLoggedIn,
  catchErrors(reviewController.addReview)
);
router.get('/top', catchErrors(storeController.getTopStores));

/*
  API
*/

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;
