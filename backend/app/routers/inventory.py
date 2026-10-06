from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Inventory, Product
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


# ============================================================
# GET INVENTORY
# ============================================================

@router.get("/")
def get_inventory(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    inventory_records = db.query(Inventory).all()

    result = []

    for inventory in inventory_records:

        product = db.query(Product).filter(
            Product.id == inventory.product_id
        ).first()

        available_qty = (
            inventory.physical_qty
            - inventory.reserved_qty
        )

        result.append({
            "product_id": inventory.product_id,
            "product_name": product.name if product else None,
            "sku": product.sku if product else None,
            "physical_qty": inventory.physical_qty,
            "reserved_qty": inventory.reserved_qty,
            "available_qty": available_qty
        })

    return result


# ============================================================
# UPDATE PHYSICAL INVENTORY
# ============================================================

@router.patch("/{product_id}")
def update_inventory(
    product_id: int,
    physical_qty: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only ADMIN can manage inventory"
        )

    if physical_qty < 0:
        raise HTTPException(
            status_code=400,
            detail="Physical quantity cannot be negative"
        )

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    inventory = db.query(Inventory).filter(
        Inventory.product_id == product_id
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found"
        )

    if physical_qty < inventory.reserved_qty:
        raise HTTPException(
            status_code=400,
            detail=(
                "Physical quantity cannot be less "
                "than reserved quantity"
            )
        )

    inventory.physical_qty = physical_qty

    db.commit()
    db.refresh(inventory)

    return {
        "message": "Inventory updated successfully",
        "product_id": product_id,
        "physical_qty": inventory.physical_qty,
        "reserved_qty": inventory.reserved_qty,
        "available_qty": (
            inventory.physical_qty
            - inventory.reserved_qty
        )
    }