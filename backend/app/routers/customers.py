from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


@router.post("/")
def create_customer(
    name: str,
    email: str,
    phone: str,
    address: str = "",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    customer = Customer(
        name=name,
        email=email,
        phone=phone,
        address=address
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


@router.get("/")
def get_customers(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Customer).all()
