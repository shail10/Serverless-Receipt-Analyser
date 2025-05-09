const admin = require('firebase-admin')
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager')

const generatePolicy = (principalId, effect, resource) => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      },
    ],
  },
})

let initialized = false
async function initializeFirebase() {
  const client = new SecretsManagerClient({ region: 'us-east-1' })
  const command = new GetSecretValueCommand({
    SecretId: 'firebase-secret-private',
  })
  const response = await client.send(command)
  const { firebaseKey } = JSON.parse(response.SecretString)

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'csci-5409-receiptify',
      clientEmail:
        'firebase-adminsdk-fbsvc@csci-5409-receiptify.iam.gserviceaccount.com',
      privateKey: firebaseKey.replace(/\\n/g, '\n'),
    }),
  })
  initialized = true
}

exports.handler = async (event, context, callback) => {
  const token = event.authorizationToken?.split('Bearer ')[1]

  if (!token) {
    return callback('Unauthorized')
  }

  try {
    if (!initialized) {
      await initializeFirebase()
    }

    const decodedToken = await admin.auth().verifyIdToken(token)
    const userId = decodedToken.uid

    return callback(null, generatePolicy(userId, 'Allow', event.methodArn))
  } catch (error) {
    console.error('Token verification failed', error)
    return callback('Unauthorized')
  }
}
