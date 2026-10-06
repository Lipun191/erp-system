import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function Quotations() {
  const [enquiries, setEnquiries] = useState([]);
  const [quotations, setQuotations] = useState([]);

  const [enquiryId, setEnquiryId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [gstPercent, setGstPercent] = useState(18);

  const [message, setMessage] = useState("");

  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const loadData = async () => {
    try {
      const [enquiriesResponse, quotationsResponse] =
        await Promise.all([
          axios.get(`${API_URL}/enquiries/`, { headers }),
          axios.get(`${API_URL}/quotations/`, { headers }),
        ]);

      setEnquiries(enquiriesResponse.data);
      setQuotations(quotationsResponse.data);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Failed to load quotation data"
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createQuotation = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post(
        `${API_URL}/quotations/`,
        null,
        {
          params: {
            enquiry_id: enquiryId,
            discount: Number(discount),
            gst_percent: Number(gstPercent),
          },
          headers,
        }
      );

      setMessage("Quotation created successfully!");

      setEnquiryId("");
      setDiscount(0);
      setGstPercent(18);

      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Failed to create quotation"
      );
    }
  };

  const updateStatus = async (quotationId, newStatus) => {
    setMessage("");

    try {
      await axios.patch(
        `${API_URL}/quotations/${quotationId}/status`,
        null,
        {
          params: {
            new_status: newStatus,
          },
          headers,
        }
      );

      setMessage(
        `Quotation status changed to ${newStatus}`
      );

      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Failed to update quotation status"
      );
    }
  };

  return (
    <div>
      <h1>Quotations</h1>

      {/* CREATE QUOTATION */}
      <div style={sectionStyle}>
        <h2>Create Quotation</h2>

        <form onSubmit={createQuotation}>
          <select
            value={enquiryId}
            onChange={(e) => setEnquiryId(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="">Select Enquiry</option>

            {enquiries
              .filter(
                (enquiry) =>
                  enquiry.status !== "LOST"
              )
              .map((enquiry) => (
                <option
                  key={enquiry.id}
                  value={enquiry.id}
                >
                  Enquiry #{enquiry.id} -{" "}
                  {enquiry.status}
                </option>
              ))}
          </select>

          <input
            type="number"
            min="0"
            placeholder="Discount"
            value={discount}
            onChange={(e) =>
              setDiscount(e.target.value)
            }
            style={inputStyle}
          />

          <input
            type="number"
            min="0"
            placeholder="GST %"
            value={gstPercent}
            onChange={(e) =>
              setGstPercent(e.target.value)
            }
            style={inputStyle}
          />

          <button
            type="submit"
            style={buttonStyle}
          >
            Create Quotation
          </button>
        </form>

        {message && (
          <p style={{ marginTop: "15px" }}>
            {message}
          </p>
        )}
      </div>

      {/* QUOTATION LIST */}
      <div style={sectionStyle}>
        <h2>Quotation List</h2>

        {quotations.length === 0 ? (
          <p>No quotations found.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>ID</th>
                <th style={cellStyle}>Enquiry</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle}>Subtotal</th>
                <th style={cellStyle}>Discount</th>
                <th style={cellStyle}>GST</th>
                <th style={cellStyle}>Total</th>
                <th style={cellStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {quotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td style={cellStyle}>
                    {quotation.id}
                  </td>

                  <td style={cellStyle}>
                    #{quotation.enquiry_id}
                  </td>

                  <td style={cellStyle}>
                    <StatusBadge
                      status={quotation.status}
                    />
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
                    {quotation.status === "DRAFT" && (
                      <button
                        onClick={() =>
                          updateStatus(
                            quotation.id,
                            "SENT"
                          )
                        }
                        style={smallButtonStyle}
                      >
                        Send
                      </button>
                    )}

                    {quotation.status === "SENT" && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus(
                              quotation.id,
                              "ACCEPTED"
                            )
                          }
                          style={acceptButtonStyle}
                        >
                          Accept
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              quotation.id,
                              "REJECTED"
                            )
                          }
                          style={rejectButtonStyle}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {quotation.status === "ACCEPTED" && (
                      <span>Ready for Sales Order</span>
                    )}

                    {quotation.status === "REJECTED" && (
                      <span>Rejected</span>
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
  return (
    <span
      style={{
        padding: "5px 10px",
        borderRadius: "15px",
        background: "#e5e7eb",
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

const smallButtonStyle = {
  padding: "7px 12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const acceptButtonStyle = {
  ...smallButtonStyle,
  background: "#16a34a",
  marginRight: "5px",
};

const rejectButtonStyle = {
  ...smallButtonStyle,
  background: "#dc2626",
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

export default Quotations;