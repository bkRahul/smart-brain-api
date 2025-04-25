const { redisClient } = require('./signin')

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers
  if (!authorization) {
    return res.status(401).json('Unauthorized')
  }

  try {
    const reply = await redisClient.get(authorization)
    console.log(reply)
    if (!reply) {
      return res.status(401).json('Unauthorized')
    }
    return next()
  } catch (err) {
    return res.status(401).json(err)
  }
}

module.exports = {
  requireAuth,
}
