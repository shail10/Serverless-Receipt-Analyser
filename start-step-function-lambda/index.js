const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn')

const stepFunctionsClient = new SFNClient({ region: 'us-east-1' })

function generateCorsErrorResponse(statusCode, errorMessage) {
  return {
    statusCode: statusCode,
    body: JSON.stringify({ error: errorMessage }),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    },
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

exports.handler = async (event) => {
  try {
    console.log('Start Step Function Lambda Invoked')

    let s3Key
    let body
    // const body = JSON.parse(event.body);
    // const s3Key = body.key;

    if (event.Records && event.Records[0]?.s3?.object?.key) {
      s3Key = event.Records[0].s3.object.key
    } else if (event.body) {
      body = JSON.parse(event.body)
      s3Key = body.key
    }

    if (!s3Key) {
      return generateCorsErrorResponse(400, "Missing 'key' in request body")
    }

    const stateMachineArn = process.env.STATE_MACHINE_ARN

    const input = {
      s3Key: s3Key,
      timestamp: new Date().toISOString(),
    }

    const command = new StartExecutionCommand({
      stateMachineArn,
      input: JSON.stringify(input),
    })

    const response = await stepFunctionsClient.send(command)

    console.log('Step Function Started Successfully')

    return generateCorsResponse(200, {
      message: 'Step Function started successfully',
      executionArn: response.executionArn,
    })
  } catch (error) {
    console.error('Error starting Step Function:', error)
    return generateCorsErrorResponse(500, {
      message: 'Failed to start Step Function',
      error: error.message,
    })
  }
}
