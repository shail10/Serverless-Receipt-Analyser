const columns = [
  {
    title: 'Receipt ID',
    dataIndex: 'receipt_id',
    key: 'receipt_id',
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
  },
  {
    title: 'File',
    dataIndex: 's3_key',
    key: 's3_key',
  },
];

export default columns