import React, { useEffect, useState } from 'react'
import axios from 'axios'

import { Tabs, Button, Table, Image } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { Spin } from 'antd'

import handleDownloadCSV from './helpers'

import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

import { toast } from 'react-toastify'

import './uploadImage.css' // Import the CSS file

const UploadImage = ({ user }) => {
  const [image, setImage] = useState(null)
  const [receipts, setReceipts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [imageUploadApiGateway, setImageUploadApiGatewayl] = useState(null)
  const [fetchResultsApiGateway, setFetchResultsApiGateway] = useState(null)
  // const [stepFunctionApiGateway, setStepFunctionApiGateway] = useState(null)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('user')
      window.location.reload()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const handleImageChange = (e) => {
    setImage(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!image) {
      alert('Please select an image before uploading.')
      return
    }

    try {
      const currentUser = auth.currentUser
      const token = await currentUser.getIdToken()
      console.log('Firebase Token:', token)
      setIsLoading(true)
      const apiUrltemp =
        'https://1rylbad6f5.execute-api.us-east-1.amazonaws.com/prod/upload'
      const response = await axios.post(
        imageUploadApiGateway,
        {
          filename: image.name,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const preSignedUrl = response.data.fileUrl

      const uploadResponse = await axios.put(preSignedUrl, image, {
        headers: {
          'Content-Type': image.type,
        },
      })

      setIsLoading(false)
      setImage(null)

      toast.success(
        'Receipt uploaded Successfuly. Fetch the results in few seconds!'
      )
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  const handleDataFetch = async () => {
    setIsLoading(true)
    const currentUser = auth.currentUser
    const token = await currentUser.getIdToken()
    const apiUrl =
      'https://1rylbad6f5.execute-api.us-east-1.amazonaws.com/prod/receipts'

    try {
      const response = await axios.post(
        fetchResultsApiGateway,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setReceipts(response.data)
      toast.success('Records fetched successfully!')
    } catch (error) {
      console.error('Error fetching receipts:', error)
    }
    setIsLoading(false)
  }

  const columns = [
    {
      title: 'Vendor',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      render: (text) => text.replace(/\n/g, ' '), // remove \n from vendor name
    },
    {
      title: 'Purchase Date',
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      render: (text) => {
        const date = new Date(text)
        return isNaN(date)
          ? text // fallback if invalid date string
          : date.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
      },
    },
    {
      title: 'Total Payment',
      dataIndex: 'total_payment',
      key: 'total_payment',
      render: (text) => `$${text}`,
    },
    {
      title: 'Products',
      key: 'products_bought',
      render: (_, record) => (
        <ul>
          {record.products_bought.map((p, i) => (
            <li key={i}>{`${p.product}: $${p.price}`}</li>
          ))}
        </ul>
      ),
    },
    {
      title: 'Taxes',
      key: 'taxes',
      render: (_, record) => (
        <ul>
          {record.taxes && record.taxes.length > 0 ? (
            record.taxes.map((t, i) => (
              <li key={i}>{`${t.type}: $${t.amount}`}</li>
            ))
          ) : (
            <li>None</li>
          )}
        </ul>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => {
        const date = new Date(text)
        return date.toLocaleString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      },
    },
  ]

  useEffect(() => {
    const initialize = async () => {
      try {
        const response = await axios.get('/config')

        setImageUploadApiGatewayl(response.data.imageUploadApiGateway)
        setFetchResultsApiGateway(response.data.fetchResultsApiGateway)
        // setStepFunctionApiGateway(response.data.stepFunctionApiGateway)

        // const fetchResponse = await axios.post(
        //   'https://lza7tdo756.execute-api.us-east-1.amazonaws.com/prod/receipts'
        // )

        // const data = fetchResponse.data
        // if (Array.isArray(data)) {
        //   setReceipts(data)
        // } else if (Array.isArray(data.receipts)) {
        //   setReceipts(data.receipts)
        // } else {
        //   throw new Error(
        //     'Invalid data format. Expected array or { receipts: [...] }.'
        //   )
        // }
      } catch (error) {
        console.error('Initialization error:', error)
      }
    }

    initialize()
  }, [])

  return (
    <div className='upload-container'>
      <div className='logo'>Receiptify</div>
      <Button
        onClick={handleLogout}
        style={{ float: 'right', marginBottom: '10px' }}
      >
        Logout
      </Button>
      <Tabs
        defaultActiveKey='1'
        centered
        items={[
          {
            label: 'Upload Image',
            key: '1',
            children: isLoading ? (
              <div className='upload-tab spinner-container'>
                <Spin tip='Uploading...' size='large' />
              </div>
            ) : (
              <div className='upload-tab'>
                <input
                  type='file'
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id='file-upload'
                />
                <label htmlFor='file-upload'>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() =>
                      document.getElementById('file-upload').click()
                    }
                  >
                    Select Image
                  </Button>
                </label>
                {image && (
                  <div className='image-preview'>
                    <Image
                      src={URL.createObjectURL(image)}
                      alt='Preview'
                      width={200}
                    />
                  </div>
                )}
                <Button
                  type='primary'
                  onClick={handleUpload}
                  style={{ marginTop: '16px' }}
                >
                  Upload
                </Button>
                {/* {error && <Alert message={error} type="error" showIcon style={{ marginTop: '16px' }} />} */}
              </div>
            ),
          },
          {
            label: 'Receipts',
            key: '2',
            children: isLoading ? (
              <div className='upload-tab spinner-container'>
                <Spin tip='Loading...' size='large' />
              </div>
            ) : (
              <div className='receipts-tab'>
                <div className='fetch-button-container'>
                  <Button
                    type='primary'
                    onClick={handleDataFetch}
                    style={{ marginBottom: '16px', marginRight: '16px' }}
                  >
                    Fetch Receipts
                  </Button>
                  <Button
                    type='default'
                    onClick={() => handleDownloadCSV(receipts)}
                    style={{ marginBottom: '16px' }}
                  >
                    Download as CSV
                  </Button>
                </div>
                {receipts.length > 0 ? (
                  <Table
                    dataSource={receipts}
                    columns={columns}
                    rowKey='receipt_id'
                    pagination={{ pageSize: 5 }}
                    scroll={{ y: 400 }}
                  />
                ) : (
                  <p>
                    No receipts available. Click "Fetch Receipts" to load data.
                  </p>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

export default UploadImage
