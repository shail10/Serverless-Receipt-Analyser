const {
  TextractClient,
  AnalyzeExpenseCommand,
} = require('@aws-sdk/client-textract')
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb')
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns')
const textractClient = new TextractClient({ region: 'us-east-1' })
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' })
const snsClient = new SNSClient({ region: 'us-east-1' })

function generateCorsErrorResponse(statusCode, errorMessage) {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      error: errorMessage,
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      'Access-Control-Allow-Headers': 'Content-Type',
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  }
}

exports.handler = async function (event, context) {
  // console.log(event)
  // console.log(process.env.INPUT_BUCKET_NAME)
  console.log('Process Image Lambda Invoked')

  const s3BucketName = process.env.INPUT_BUCKET_NAME
  const s3ObjectKey = event.s3Key
  const s3InputObjectUri = `s3://${s3BucketName}/${s3ObjectKey}`
  const userId = s3ObjectKey.split('/')[0]
  console.log('Input: ', s3InputObjectUri)

  try {
    // Step 1: Analyze the expense document synchronously
    const analyzeParams = {
      Document: {
        S3Object: {
          Bucket: s3BucketName,
          Name: s3ObjectKey,
        },
      },
    }

    const analyzeCommand = new AnalyzeExpenseCommand(analyzeParams)
    const analyzeResponse = await textractClient.send(analyzeCommand)
    const expenseDocs = analyzeResponse.ExpenseDocuments

    console.log('Textract Analysis Completed')

    let products_bought = []
    let total_payment = null
    let taxes = []
    let vendor_name = null
    let purchase_date = null

    expenseDocs.forEach((doc) => {
      // Line items (products)
      doc.LineItemGroups?.forEach((group) => {
        group.LineItems.forEach((item) => {
          let item_data = {}
          item.LineItemExpenseFields.forEach((field) => {
            if (field.Type.Text === 'ITEM')
              item_data.product = field.ValueDetection.Text
            if (field.Type.Text === 'PRICE')
              item_data.price = field.ValueDetection.Text
          })
          if (Object.keys(item_data).length) products_bought.push(item_data)
        })
      })

      // Total payment
      doc.SummaryFields?.forEach((field) => {
        const fieldType = field.Type.Text
        const fieldValue = field.ValueDetection.Text

        if (fieldType === 'TOTAL') {
          total_payment = fieldValue
        } else if (fieldType.includes('TAX')) {
          // Look for any tax-related fields
          taxes.push({
            type: fieldType, // e.g., "TAX", "SALES_TAX"
            amount: fieldValue,
          })
        } else if (fieldType === 'VENDOR_NAME') {
          vendor_name = fieldValue
        } else if (
          fieldType === 'INVOICE_RECEIPT_DATE' ||
          fieldType === 'DATE'
        ) {
          purchase_date = fieldValue
        }
      })
    })

    const simplifiedResult = {
      products_bought,
      total_payment,
      taxes: taxes.length > 0 ? taxes : null, // Return null if no taxes found
    }

    const receiptId = context.awsRequestId // Unique ID from Lambda execution
    await dynamoClient.send(
      new PutItemCommand({
        TableName: 'Receipts',
        Item: {
          receipt_id: { S: receiptId },
          total_payment: { S: simplifiedResult.total_payment || '0.00' }, // Default if null
          products_bought: {
            L: simplifiedResult.products_bought.map((p) => ({
              M: { product: { S: p.product }, price: { S: p.price } },
            })),
          },
          taxes: {
            L: simplifiedResult.taxes
              ? simplifiedResult.taxes.map((t) => ({
                  M: { type: { S: t.type }, amount: { S: t.amount } },
                }))
              : [],
          },
          timestamp: { S: new Date().toISOString() },
          s3_key: { S: s3ObjectKey }, // Track source file
          user_id: { S: userId },
          vendor_name: { S: vendor_name || 'Unknown' },
          purchase_date: { S: purchase_date || 'Unknown' },
        },
      })
    )
    console.log(`Stored receipt ${receiptId} in DynamoDB`)

    console.log(
      'Expense Analysis Result:',
      JSON.stringify(analyzeResponse.ExpenseDocuments, null, 2)
    )
    console.log('Simplified Result:', JSON.stringify(simplifiedResult, null, 2))

    // const snsMessage = JSON.stringify({
    //   message: "New receipt data available. Click 'Fetch Data' to view.",
    //   timestamp: new Date().toISOString(),
    // })

    // await snsClient.send(
    //   new PublishCommand({
    //     TopicArn: process.env.SNS_TOPIC_ARN,
    //     Message: snsMessage,
    //   })
    // )

    // Step 2: Return the result
    return generateCorsResponse(200, {
      Message: 'Expense analysis completed.',
      Result: analyzeResponse.ExpenseDocuments, // Contains the analyzed expense data
    })
  } catch (error) {
    console.error('Error in processing the document:', error)
    return generateCorsErrorResponse(500, {
      Message: 'Error processing the document',
      Error: error.message,
    })
  }
}
