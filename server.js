const express = require('express')
const bodyParser = require('body-parser') // latest version of exressJS now comes with Body-Parser!
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const knex = require('knex')
const morgan = require('morgan') // log requests to API using morgan
const register = require('./controllers/register')
const signin = require('./controllers/signin')
const profile = require('./controllers/profile')
const image = require('./controllers/image')
const { requireAuth } = require('./controllers/authorization')

const db = knex({
  // connect to your own database here:
  client: 'pg',
  connection:
    process.env.POSTGRES_URI ||
    'postgres://postgres:1068@127.0.0.1:5432/smart-brain',
})

const app = express()

app.use(cors())
app.use(morgan('combined')) // log requests to API using morgan
app.use(express.json()) // latest version of exressJS now comes with Body-Parser!

app.get('/', (req, res) => {
  res.send(db.users)
})
app.post('/signin', signin.signinAuthentication(db, bcrypt))
app.post('/register', (req, res) => {
  register.handleRegister(req, res, db, bcrypt)
})
app.get('/profile/:id', requireAuth, (req, res) => {
  profile.handleProfileGet(req, res, db)
})
app.put('/profile/:id', requireAuth, (req, res) => {
  profile.handleProfileUpdate(req, res, db)
})
app.put('/image', requireAuth, (req, res) => {
  image.handleImage(req, res, db)
})
app.post('/imageurl', requireAuth, (req, res) => {
  image.handleApiCall(req, res)
})

app.listen(3000, () => {
  console.log('app is running on port 3000')
})
