const handleDownloadCSV = (receipts) => {
  if (receipts.length === 0) {
    alert("No receipts available to download.");
    return;
  }

  // Define CSV headers
  const headers = [
    "Receipt ID",
    "Total Payment",
    "Products Bought",
    "Taxes",
    "Timestamp",
    "File"
  ];

  // Convert receipts data to CSV rows
  const rows = receipts.map(receipt => {
    const products = receipt.products_bought.map(p => `${p.product}: $${p.price}`).join("; ");
    const taxes = receipt.taxes && receipt.taxes.length > 0 
      ? receipt.taxes.map(t => `${t.type}: $${t.amount}`).join("; ") 
      : "None";
    return [
      receipt.receipt_id,
      `$${receipt.total_payment}`,
      `"${products}"`, // Wrap in quotes to handle semicolons
      `"${taxes}"`,   // Wrap in quotes to handle semicolons
      receipt.timestamp,
      receipt.s3_key
    ];
  });

  // Combine headers and rows into CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "receipts.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default handleDownloadCSV