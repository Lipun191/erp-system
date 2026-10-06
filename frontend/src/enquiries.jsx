import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function Enquiries() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  // Customer form
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Enquiry form
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  const [message, setMessage] = useState("");

  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const loadData = async () => {
    try {
      const [customersResponse, productsResponse, enquiriesResponse] =
        await Promise.all([
          axios.get(`${API_URL}/customers/`, { headers }),
          axios.get(`${API_URL}/products/`, { headers }),
          axios.get(`${API_URL}/enquiries/`, { headers }),
        ]);

      setCustomers(customersResponse.data);
      setProducts(productsResponse.data);
      setEnquiries(enquiriesResponse.data);
    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Failed to load data"
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // CREATE CUSTOMER
  const createCustomer = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/customers/`,
        null,
        {
          params: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address: customerAddress,
          },
          headers,
        }
      );

      setMessage("Customer created successfully!");

      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerAddress("");

      await loadData();

      // Automatically select newly created customer
      setCustomerId(response.data.id);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Failed to create customer"
      );
    }
  };

  // CREATE ENQUIRY
  const createEnquiry = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post(
        `${API_URL}/enquiries/`,
        null,
        {
          params: {
            customer_id: customerId,
            product_id: productId,
            quantity: quantity,
            remarks: remarks,
          },
          headers,
        }
      );

      setMessage("Enquiry created successfully!");

      setCustomerId("");
      setProductId("");
      setQuantity("");
      setRemarks("");

      loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Failed to create enquiry"
      );
    }
  };

  return (
    <div>
      <h1>Customer Enquiries</h1>

      {/* CUSTOMER CREATION */}
      <div style={sectionStyle}>
        <h2>Create Customer</h2>

        <form onSubmit={createCustomer}>
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="Customer Email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>
            Create Customer
          </button>
        </form>
      </div>

      {/* CREATE ENQUIRY */}
      <div style={sectionStyle}>
        <h2>Create Enquiry</h2>

        <form onSubmit={createEnquiry}>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="">Select Customer</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.email}
              </option>
            ))}
          </select>

          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="">Select Product</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku}) - ₹{product.unit_price}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>
            Create Enquiry
          </button>
        </form>

        {message && (
          <p style={{ marginTop: "15px" }}>
            {message}
          </p>
        )}
      </div>

      {/* ENQUIRY LIST */}
      <div style={sectionStyle}>
        <h2>Enquiry List</h2>

        {enquiries.length === 0 ? (
          <p>No enquiries found.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>ID</th>
                <th style={cellStyle}>Customer ID</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle}>Product</th>
                <th style={cellStyle}>Quantity</th>
                <th style={cellStyle}>Remarks</th>
              </tr>
            </thead>

            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td style={cellStyle}>{enquiry.id}</td>

                  <td style={cellStyle}>
                    {enquiry.customer_id}
                  </td>

                  <td style={cellStyle}>
                    {enquiry.status}
                  </td>

                  <td style={cellStyle}>
                    {enquiry.items.map((item) => (
                      <div key={item.product_id}>
                        Product #{item.product_id}
                      </div>
                    ))}
                  </td>

                  <td style={cellStyle}>
                    {enquiry.items.map((item) => (
                      <div key={item.product_id}>
                        {item.quantity}
                      </div>
                    ))}
                  </td>

                  <td style={cellStyle}>
                    {enquiry.remarks || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const sectionStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "10px",
  marginBottom: "30px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  borderRadius: "6px",
};

const buttonStyle = {
  padding: "10px 20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const cellStyle = {
  border: "1px solid #ddd",
  padding: "10px",
  textAlign: "left",
};

export default Enquiries;