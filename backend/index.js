const express = require('express');
const cors = require('cors');
const passport = require('passport');
const loginRouter = require('./routes/login');

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use('/clients', loginRouter);

app.listen(8100, () => {
  console.log('server started');
});
