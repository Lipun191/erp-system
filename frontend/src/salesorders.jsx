import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function SalesOrders() {
  const [quotations, setQuotations] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const loadData = async () => {
    try {
      const [quotationResponse, orderResponse] =
        await Promise.all([
          axios.get(`${API_URL}/quotations/`, { headers }),
          axios.get(`${API_URL}/sales-orders/`, { headers }),
        ]);

      setQuotations(quotationResponse.data);
      setSalesOrders(orderResponse.data);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Failed to load sales order data"
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // CONVERT ACCEPTED QUOTATION TO SALES ORDER
  const convertToSalesOrder = async (quotationId) => {
    setMessage("");

    try {
      await axios.post(
        `${API_URL}/sales-orders/convert/${quotationId}`,
        null,
        { headers }
      );

      setMessage(
        "Sales Order created and inventory reserved successfully!"
      );

      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Failed to create Sales Order"
      );
    }
  };

  // CONFIRM SALES ORDER
  const confirmSalesOrder = async (salesOrderId) => {
    setMessage("");

    try {
      await axios.post(
        `${API_URL}/sales-orders/${salesOrderId}/confirm`,
        null,
        { headers }
      );

      setMessage("Sales Order confirmed successfully!");

      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Failed to confirm Sales Order"
      );
    }
  };

  // DISPATCH SALES ORDER
  const dispatchSalesOrder = async (salesOrderId) => {
    setMessage("");

    try {
      await axios.post(
        `${API_URL}/sales-orders/${salesOrderId}/dispatch`,
        null,
        { headers }
      );

      setMessage(
        "Sales Order dispatched successfully!"
      );

      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Failed to dispatch Sales Order"
      );
    }
  };

  return (
    <div>
      <h1>Sales Orders</h1>

      {message && (
        <div style={messageStyle}>
          {message}
        </div>
      )}

      {/* ACCEPTED QUOTATIONS */}
      <div style={sectionStyle}>
        <h2>Accepted Quotations</h2>

        {quotations.filter(
          (quotation) =>
            quotation.status === "ACCEPTED"
        ).length === 0 ? (
          <p>No accepted quotations available.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Quotation ID</th>
                <th style={cellStyle}>Enquiry ID</th>
                <th style={cellStyle}>Subtotal</th>
                <th style={cellStyle}>Discount</th>
                <th style={cellStyle}>GST</th>
                <th style={cellStyle}>Total</th>
                <th style={cellStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {quotations
                .filter(
                  (quotation) =>
                    quotation.status === "ACCEPTED"
                )
                .map((quotation) => {
                  const alreadyConverted =
                    salesOrders.some(
                      (order) =>
                        order.quotation_id ===
                        quotation.id
                    );

                  return (
                    <tr key={quotation.id}>
                      <td style={cellStyle}>
                        #{quotation.id}
                      </td>

                      <td style={cellStyle}>
                        #{quotation.enquiry_id}
                      </td>

                      <td style={cellStyle}>
                        ₹{quotation.subtotal}
                      </td>

                      <td style={cellStyle}>
                        ₹{quotation.discount}
                      </td>

                      <td style={cellStyle}>
                        ₹{quotation.gst}
                      </td>

                      <td style={cellStyle}>
                        <strong>
                          ₹{quotation.total_amount}
                        </strong>
                      </td>

                      <td style={cellStyle}>
                        {alreadyConverted ? (
                          <span style={successText}>
                            Sales Order Created
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              convertToSalesOrder(
                                quotation.id
                              )
                            }
                            style={buttonStyle}
                          >
                            Create Sales Order
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      {/* SALES ORDERS */}
      <div style={sectionStyle}>
        <h2>Sales Order List</h2>

        {salesOrders.length === 0 ? (
          <p>No Sales Orders found.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>ID</th>
                <th style={cellStyle}>Quotation</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle}>Subtotal</th>
                <th style={cellStyle}>Discount</th>
                <th style={cellStyle}>GST</th>
                <th style={cellStyle}>Total</th>
                <th style={cellStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {salesOrders.map((order) => (
                <tr key={order.id}>
                  <td style={cellStyle}>
                    #{order.id}
                  </td>

                  <td style={cellStyle}>
                    #{order.quotation_id}
                  </td>

                  <td style={cellStyle}>
                    <StatusBadge
                      status={order.status}
                    />
                  </td>

                  <td style={cellStyle}>
                    ₹{order.subtotal}
                  </td>

                  <td style={cellStyle}>
                    ₹{order.discount}
                  </td>

                  <td style={cellStyle}>
                    ₹{order.gst}
                  </td>

                  <td style={cellStyle}>
                    <strong>
                      ₹{order.total_amount}
                    </strong>
                  </td>

                  <td style={cellStyle}>
                    {order.status === "PENDING" && (
                      <button
                        onClick={() =>
                          confirmSalesOrder(order.id)
                        }
                        style={confirmButtonStyle}
                      >
                        Confirm
                      </button>
                    )}

                    {order.status === "CONFIRMED" && (
                      <button
                        onClick={() =>
                          dispatchSalesOrder(order.id)
                        }
                        style={dispatchButtonStyle}
                      >
                        Dispatch
                      </button>
                    )}

                    {order.status === "DISPATCHED" && (
                      <span style={successText}>
                        Dispatched ✓
                      </span>
                    )}
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

function StatusBadge({ status }) {
  let background = "#e5e7eb";

  if (status === "PENDING") {
    background = "#fef3c7";
  }

  if (status === "CONFIRMED") {
    background = "#dbeafe";
  }

  if (status === "DISPATCHED") {
    background = "#dcfce7";
  }

  return (
    <span
      style={{
        padding: "5px 10px",
        borderRadius: "15px",
        background,
        fontSize: "13px",
      }}
    >
      {status}
    </span>
  );
}

const sectionStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "10px",
  marginBottom: "30px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

const messageStyle = {
  padding: "12px",
  marginBottom: "20px",
  background: "#dbeafe",
  borderRadius: "6px",
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

const buttonStyle = {
  padding: "8px 14px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const confirmButtonStyle = {
  ...buttonStyle,
  background: "#16a34a",
};

const dispatchButtonStyle = {
  ...buttonStyle,
  background: "#7c3aed",
};

const successText = {
  color: "#16a34a",
  fontWeight: "bold",
};

export default SalesOrders;