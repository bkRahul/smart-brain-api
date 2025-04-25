const jwt = require('jsonwebtoken')
const redis = require('redis')
// Use promises for Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379', // Updated to reflect 'localhost' for non-Docker environment
})

redisClient.on('error', err => console.error('Redis Client Error', err))

async function redisConnect() {
  try {
    await redisClient.connect()
  } catch (err) {
    console.error('Error connecting to Redis:', err)
  }
}

redisConnect()

// handleSignin function to check if the user is authenticated
const handleSignin = (db, bcrypt, req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json('incorrect form submission')
  }

  return db
    .select('email', 'hash')
    .from('login')
    .where('email', '=', email)
    .then(data => {
      if (!data[0]) {
        return res.status(400).json('wrong credentials')
      }

      const isValid = bcrypt.compareSync(password, data[0].hash)

      if (isValid) {
        return db
          .select('*')
          .from('users')
          .where('email', '=', email)
          .then(user => user[0])
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        return res.status(400).json('wrong credentials')
      }
    })
    .catch(err => res.status(400).json('unable to process request'))
}

// Check if the user is authenticated
const signinAuthentication = (db, bcrypt) => async (req, res) => {
  const { authorization } = req.headers

  if (authorization) {
    return getAuthToken(authorization, res)
  }

  try {
    const data = await handleSignin(db, bcrypt, req, res)

    if (data && data.id && data.email) {
      const session = await createSession(data)
      return res.json(session)
    }

    return res.status(400).json('Authentication failed')
  } catch (err) {
    return res.status(400).json(err.message || 'An error occurred')
  }
}

// Create a session for the user and store the token in redis
const createSession = async user => {
  const token = createJWTToken(user.email)

  try {
    await setAuthToken(token, user.id)
    return { success: 'true', userId: user.id, token }
  } catch (err) {
    console.log(err)
    throw new Error('Session creation failed')
  }
}

// Create a JWT token for the user
const createJWTToken = email => {
  return jwt.sign({ id: email }, 'JWT_SECRET', {
    expiresIn: '5h',
  })
}

const setAuthToken = (key, value) => redisClient.set(key, value)

// If the user is authenticated, fetch the token from redis
const getAuthToken = async (authorization, res) => {
  try {
    const reply = await redisClient.get(authorization)
    if (!reply) {
      return res.status(401).json('Unauthorized')
    }
    return res.json({ success: 'true', id: reply })
  } catch (err) {
    return res.status(401).json('Unauthorized')
  }
}

module.exports = {
  signinAuthentication,
  redisClient,
}
