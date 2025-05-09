const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const s3Client = new S3Client()

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

exports.handler = async (event) => {
  try {
    console.log('Upload To S3 Lambda Invoked')
    const body = JSON.parse(event.body)
    const { filename } = body

    const userId = event.requestContext?.authorizer?.principalId
    console.log(userId)

    if (!filename) {
      return generateCorsErrorResponse(400, 'Filename is required')
    }

    const fileName = `${generateUUID()}-${filename}`
    const s3Key = `${userId}/${fileName}`

    const params = {
      Bucket: process.env.INPUT_BUCKET_NAME,
      Key: s3Key,
    }

    const command = new PutObjectCommand(params)
    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 })

    console.log('Presigned URL generated')
    return generateCorsResponse(200, {
      fileUrl: url,
    })
  } catch (error) {
    console.error('Error generating pre-signed URL:', error)
    return generateCorsErrorResponse(
      500,
      `Error generating pre-signed URL: ${error.message}`
    )
  }
}

function generateCorsResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(body),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    },
  }
}

function generateCorsErrorResponse(statusCode, errorMessage) {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      error: errorMessage,
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    },
  }
}
