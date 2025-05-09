const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb')
const client = new DynamoDBClient({ region: 'us-east-1' })

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

exports.handler = async function (event) {
  try {
    console.log('Lambda to fetch Data from DynamdoDB Invoked')

    const userId = event.requestContext?.authorizer?.principalId
    const scanCommand = new ScanCommand({ TableName: 'Receipts' })
    const response = await client.send(scanCommand)

    const filtered = response.Items.filter((item) => item.user_id?.S === userId)

    const receipts = filtered.map((item) => ({
      receipt_id: item.receipt_id.S,
      total_payment: item.total_payment.S,
      vendor_name: item.vendor_name?.S || 'Unknown',
      purchase_date: item.purchase_date?.S || 'Unknown',
      products_bought: item.products_bought.L.map((p) => ({
        product: p.M.product.S,
        price: p.M.price.S,
      })),
      taxes:
        item.taxes.L.length > 0
          ? item.taxes.L.map((t) => ({
              type: t.M.type.S,
              amount: t.M.amount.S,
            }))
          : null,
      timestamp: item.timestamp.S,
      s3_key: item.s3_key.S,
    }))

    console.log('Data Fetched Successfully!')
    return generateCorsResponse(200, receipts)
  } catch (error) {
    console.error('Error:', error)
    return generateCorsErrorResponse(500, { error: error.message })
  }
}
