from app.models import User, Customer, Product, Inventory
from app.routers.auth import pwd_context


def create_admin(db):
    admin = User(
        name="Test Admin",
        email="admin@test.com",
        password_hash=pwd_context.hash("Admin@123"),
        role="ADMIN",
        is_active=True
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return admin


def create_product(db):
    product = Product(
        name="Test Laptop",
        sku="TEST-LAP-001",
        unit_price=50000
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    inventory = Inventory(
        product_id=product.id,
        physical_qty=10,
        reserved_qty=0
    )

    db.add(inventory)
    db.commit()

    return product


# ============================================================
# TEST 1 — LOGIN
# ============================================================

def test_login(client, db):

    create_admin(db)

    response = client.post(
        "/auth/login",
        data={
            "username": "admin@test.com",
            "password": "Admin@123"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "ADMIN"


# ============================================================
# TEST 2 — INVALID LOGIN
# ============================================================

def test_invalid_login(client, db):

    create_admin(db)

    response = client.post(
        "/auth/login",
        data={
            "username": "admin@test.com",
            "password": "WrongPassword"
        }
    )

    assert response.status_code == 401


# ============================================================
# TEST 3 — PRODUCT API
# ============================================================

def test_get_products(client, db):

    create_admin(db)
    product = create_product(db)

    login_response = client.post(
        "/auth/login",
        data={
            "username": "admin@test.com",
            "password": "Admin@123"
        }
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/products/",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Test Laptop"
    assert data[0]["available_qty"] == 10


# ============================================================
# TEST 4 — ENQUIRY VALIDATION
# ============================================================

def test_enquiry_invalid_quantity(client, db):

    create_admin(db)

    customer = Customer(
        name="Test Customer",
        email="customer@test.com",
        phone="9876543210",
        address="Bhubaneswar"
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    product = create_product(db)

    login_response = client.post(
        "/auth/login",
        data={
            "username": "admin@test.com",
            "password": "Admin@123"
        }
    )

    token = login_response.json()["access_token"]

    response = client.post(
        "/enquiries/",
        params={
            "customer_id": customer.id,
            "product_id": product.id,
            "quantity": 0,
            "remarks": "Test"
        },
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 400

    assert response.json()["detail"] == (
        "Quantity must be greater than 0"
    )


# ============================================================
# TEST 5 — INVENTORY API
# ============================================================

def test_inventory(client, db):

    create_admin(db)
    create_product(db)

    login_response = client.post(
        "/auth/login",
        data={
            "username": "admin@test.com",
            "password": "Admin@123"
        }
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/inventory/",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["physical_qty"] == 10
    assert data[0]["reserved_qty"] == 0
    assert data[0]["available_qty"] == 10