from sqlalchemy import Column, Integer, String, Boolean

from app.database import Base


# =========================
# User Model
# =========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)


# =========================
# Customer Model
# =========================

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=False)
    address = Column(String(255), nullable=True)

    # =========================
# Product Model
# =========================

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    unit_price = Column(Integer, nullable=False)


# =========================
# Inventory Model
# =========================

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, nullable=False, unique=True)
    physical_qty = Column(Integer, nullable=False, default=0)
    reserved_qty = Column(Integer, nullable=False, default=0)

    # =========================
# Enquiry Model
# =========================

class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="NEW")
    remarks = Column(String(500), nullable=True)


# =========================
# Enquiry Item Model
# =========================

class EnquiryItem(Base):
    __tablename__ = "enquiry_items"

    id = Column(Integer, primary_key=True, index=True)
    enquiry_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)

    # =========================
# Quotation Model
# =========================

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    enquiry_id = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="DRAFT")

    subtotal = Column(Integer, nullable=False, default=0)
    discount = Column(Integer, nullable=False, default=0)
    gst = Column(Integer, nullable=False, default=0)
    total_amount = Column(Integer, nullable=False, default=0)


# =========================
# Quotation Item Model
# =========================

class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Integer, nullable=False)

# =========================
# Sales Order Model
# =========================

class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, nullable=False, unique=True)
    status = Column(String(20), nullable=False, default="PENDING")

    subtotal = Column(Integer, nullable=False, default=0)
    discount = Column(Integer, nullable=False, default=0)
    gst = Column(Integer, nullable=False, default=0)
    total_amount = Column(Integer, nullable=False, default=0)


# =========================
# Sales Order Item Model
# =========================

class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Integer, nullable=False)

    # =========================
# Dispatch Model
# =========================

class Dispatch(Base):
    __tablename__ = "dispatches"

    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, nullable=False, unique=True)
    status = Column(String(20), nullable=False, default="DISPATCHED")


# =========================
# Dispatch Item Model
# =========================

class DispatchItem(Base):
    __tablename__ = "dispatch_items"

    id = Column(Integer, primary_key=True, index=True)
    dispatch_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)

    