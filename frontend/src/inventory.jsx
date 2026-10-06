import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [message, setMessage] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [physicalQty, setPhysicalQty] = useState("");

  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const loadInventory = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/inventory/`,
        { headers }
      );

      setInventory(response.data);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Failed to load inventory"
      );
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const updateInventory = async (productId) => {
    setMessage("");

    try {
      await axios.patch(
        `${API_URL}/inventory/${productId}`,
        null,
        {
          params: {
            physical_qty: Number(physicalQty),
          },
          headers,
        }
      );

      setMessage(
        "Inventory updated successfully!"
      );

      setEditingProduct(null);
      setPhysicalQty("");

      await loadInventory();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Failed to update inventory"
      );
    }
  };

  return (
    <div>
      <h1>Inventory</h1>

      {message && (
        <div style={messageStyle}>
          {message}
        </div>
      )}

      <div style={sectionStyle}>
        <h2>Product Inventory</h2>

        {inventory.length === 0 ? (
          <p>No inventory records found.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Product</th>
                <th style={cellStyle}>SKU</th>
                <th style={cellStyle}>
                  Physical Quantity
                </th>
                <th style={cellStyle}>
                  Reserved Quantity
                </th>
                <th style={cellStyle}>
                  Available Quantity
                </th>
                {user.role === "ADMIN" && (
                  <th style={cellStyle}>Action</th>
                )}
              </tr>
            </thead>

            <tbody>
              {inventory.map((item) => (
                <tr key={item.product_id}>
                  <td style={cellStyle}>
                    {item.product_name}
                  </td>

                  <td style={cellStyle}>
                    {item.sku}
                  </td>

                  <td style={cellStyle}>
                    {editingProduct ===
                    item.product_id ? (
                      <input
                        type="number"
                        min={item.reserved_qty}
                        value={physicalQty}
                        onChange={(e) =>
                          setPhysicalQty(
                            e.target.value
                          )
                        }
                        style={quantityInputStyle}
                      />
                    ) : (
                      item.physical_qty
                    )}
                  </td>

                  <td style={cellStyle}>
                    {item.reserved_qty}
                  </td>

                  <td style={cellStyle}>
                    <strong>
                      {item.available_qty}
                    </strong>
                  </td>

                  {user.role === "ADMIN" && (
                    <td style={cellStyle}>
                      {editingProduct ===
                      item.product_id ? (
                        <>
                          <button
                            onClick={() =>
                              updateInventory(
                                item.product_id
                              )
                            }
                            style={saveButtonStyle}
                          >
                            Save
                          </button>

                          <button
                            onClick={() => {
                              setEditingProduct(null);
                              setPhysicalQty("");
                            }}
                            style={cancelButtonStyle}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingProduct(
                              item.product_id
                            );
                            setPhysicalQty(
                              item.physical_qty
                            );
                          }}
                          style={editButtonStyle}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={infoStyle}>
        <strong>Inventory rule:</strong>

        <p>
          Available Quantity = Physical Quantity -
          Reserved Quantity
        </p>

        <p>
          Reserved quantity increases when an accepted
          quotation is converted to a Sales Order.
        </p>

        <p>
          Physical and reserved quantities decrease
          when the Sales Order is dispatched.
        </p>
      </div>
    </div>
  );
}

const sectionStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "10px",
  marginBottom: "25px",
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.08)",
};

const messageStyle = {
  padding: "12px",
  marginBottom: "20px",
  background: "#dbeafe",
  borderRadius: "6px",
};

const infoStyle = {
  background: "#eff6ff",
  padding: "20px",
  borderRadius: "10px",
  marginTop: "20px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const cellStyle = {
  border: "1px solid #ddd",
  padding: "12px",
  textAlign: "left",
};

const quantityInputStyle = {
  width: "100px",
  padding: "7px",
  border: "1px solid #ccc",
  borderRadius: "5px",
};

const editButtonStyle = {
  padding: "7px 14px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const saveButtonStyle = {
  padding: "7px 12px",
  marginRight: "5px",
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const cancelButtonStyle = {
  padding: "7px 12px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default Inventory;
