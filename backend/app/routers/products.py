from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product, Inventory
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.get("/")
def get_products(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    products = db.query(Product).all()

    result = []

    for product in products:
        inventory = db.query(Inventory).filter(
            Inventory.product_id == product.id
        ).first()

        available_qty = 0

        if inventory:
            available_qty = (
                inventory.physical_qty
                - inventory.reserved_qty
            )

        result.append({
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "unit_price": product.unit_price,
            "physical_qty": inventory.physical_qty if inventory else 0,
            "reserved_qty": inventory.reserved_qty if inventory else 0,
            "available_qty": available_qty
        })

    return result