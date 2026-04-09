const express = require('express');
const db = require('../models/index')

const bcrypt = require('bcrypt');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET || 'taxi-app-jwt-secret';

const {User} = db;

const router = express.Router();

passport.use(
    'clientLocal',
    new LocalStrategy((username, password, done) => {
      User.findOne({ where: { email: username }, raw: false })
        .then((user) => {
          if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
          }
          if (!bcrypt.compareSync(password, user.password)) {
            return done(null, false, { message: 'Incorrect password.' });
          }
          return done(null, user);
        })
        .catch((err) => (null, false, err));
    })
  );

passport.use(
  'clientJwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
    },
    (payload, done) => {
      User.findByPk(payload.id)
        .then((user) => {
          if (user) return done(null, user);
          return done(null, false);
        })
        .catch((err) => done(err, false));
    }
  )
);

router.get('/user',
  passport.authenticate('clientJwt', { session: false }),
  (req, res) => {
    res.json(req.user);
  }
);

router.post('/register', (req, res) => {
  if (req.body.username && req.body.password) {
    User.findOne({ where: { email: req.body.username }, raw: false })
      .then((user) => {
        if (user) {
          res.status(401).json({ message: 'Username already exists' });
        } else {
          const hash = bcrypt.hashSync(req.body.password, saltRounds);
          User.create({
            email: req.body.username,
            password: hash,
            name: req.body.name,
            phone: req.body.phone,
            type: 'client',
            stripeId: req.body.stripeId,
          })
          .then((userNew) => {
            const payload = { id: userNew.id };
            const token = jwt.sign(payload, jwtSecret);
            res.json({ token });
          });
        }
      });
  }
});

router.post('/login', (req, res, done) => {
  passport.authenticate('clientLocal', (err, user, info) => {
    if (!user) {
      return res.status(401).json({ success: false, info });
    }
    req.login(user, { session: false }, () => {
      const payload = { id: req.user.id };
      const token = jwt.sign(payload, jwtSecret);
      return res.json({ token });
    });
  })(req, res, done);
});

router.get(
  '/:id',
  passport.authenticate(['adminJwt','driverJwt'], { session:false }),
  (req,res)=>{
    const clientId=req.params.id;
    return User.findOne({
      where:{ id: clientId },
      raw:false
    }).then((result)=>{
      res.send(result);
    });
  }
);

module.exports = router;
