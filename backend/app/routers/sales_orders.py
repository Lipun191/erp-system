from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Quotation,
    QuotationItem,
    SalesOrder,
    SalesOrderItem,
    Inventory,
    Dispatch,
    DispatchItem
)
from app.routers.auth import get_current_user, require_role


router = APIRouter(
    prefix="/sales-orders",
    tags=["Sales Orders"]
)


# ============================================================
# CONVERT ACCEPTED QUOTATION TO SALES ORDER
# ============================================================

@router.post("/convert/{quotation_id}")
def convert_quotation_to_sales_order(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    quotation = db.query(Quotation).filter(
        Quotation.id == quotation_id
    ).first()

    if not quotation:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found"
        )

    if quotation.status != "ACCEPTED":
        raise HTTPException(
            status_code=400,
            detail="Only ACCEPTED quotations can be converted to Sales Order"
        )

    existing_order = db.query(SalesOrder).filter(
        SalesOrder.quotation_id == quotation_id
    ).first()

    if existing_order:
        raise HTTPException(
            status_code=400,
            detail="Sales Order already exists for this quotation"
        )

    quotation_items = db.query(QuotationItem).filter(
        QuotationItem.quotation_id == quotation_id
    ).all()

    if not quotation_items:
        raise HTTPException(
            status_code=400,
            detail="Quotation has no items"
        )

    try:
        locked_inventory = {}

        for item in quotation_items:

            inventory = (
                db.query(Inventory)
                .filter(
                    Inventory.product_id == item.product_id
                )
                .with_for_update()
                .first()
            )

            if not inventory:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Inventory not found for product "
                        f"{item.product_id}"
                    )
                )

            available_qty = (
                inventory.physical_qty
                - inventory.reserved_qty
            )

            if item.quantity > available_qty:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Insufficient inventory for product "
                        f"{item.product_id}. "
                        f"Available: {available_qty}, "
                        f"Required: {item.quantity}"
                    )
                )

            locked_inventory[item.product_id] = inventory

        sales_order = SalesOrder(
            quotation_id=quotation.id,
            status="PENDING",
            subtotal=quotation.subtotal,
            discount=quotation.discount,
            gst=quotation.gst,
            total_amount=quotation.total_amount
        )

        db.add(sales_order)
        db.flush()

        for item in quotation_items:

            sales_order_item = SalesOrderItem(
                sales_order_id=sales_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price
            )

            db.add(sales_order_item)

            inventory = locked_inventory[item.product_id]

            inventory.reserved_qty += item.quantity

        db.commit()
        db.refresh(sales_order)

        return {
            "message": (
                "Quotation converted to Sales Order "
                "and inventory reserved successfully"
            ),
            "sales_order_id": sales_order.id,
            "quotation_id": quotation.id,
            "status": sales_order.status,
            "subtotal": sales_order.subtotal,
            "discount": sales_order.discount,
            "gst": sales_order.gst,
            "total_amount": sales_order.total_amount
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create Sales Order"
        )


# ============================================================
# GET ALL SALES ORDERS
# ============================================================

@router.get("/")
def get_sales_orders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    sales_orders = db.query(SalesOrder).all()

    result = []

    for order in sales_orders:

        items = db.query(SalesOrderItem).filter(
            SalesOrderItem.sales_order_id == order.id
        ).all()

        result.append({
            "id": order.id,
            "quotation_id": order.quotation_id,
            "status": order.status,
            "subtotal": order.subtotal,
            "discount": order.discount,
            "gst": order.gst,
            "total_amount": order.total_amount,
            "items": [
                {
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price
                }
                for item in items
            ]
        })

    return result


# ============================================================
# CONFIRM SALES ORDER
# ADMIN ONLY
# ============================================================

@router.post("/{sales_order_id}/confirm")
def confirm_sales_order(
    sales_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN"))
):
    sales_order = db.query(SalesOrder).filter(
        SalesOrder.id == sales_order_id
    ).first()

    if not sales_order:
        raise HTTPException(
            status_code=404,
            detail="Sales Order not found"
        )

    if sales_order.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=(
                f"Sales Order cannot be confirmed "
                f"from status {sales_order.status}"
            )
        )

    sales_order.status = "CONFIRMED"

    db.commit()
    db.refresh(sales_order)

    return {
        "message": "Sales Order confirmed successfully",
        "sales_order_id": sales_order.id,
        "status": sales_order.status
    }


# ============================================================
# DISPATCH SALES ORDER
# ADMIN ONLY
# ============================================================

@router.post("/{sales_order_id}/dispatch")
def dispatch_sales_order(
    sales_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("ADMIN"))
):
    sales_order = db.query(SalesOrder).filter(
        SalesOrder.id == sales_order_id
    ).first()

    if not sales_order:
        raise HTTPException(
            status_code=404,
            detail="Sales Order not found"
        )

    if sales_order.status != "CONFIRMED":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only CONFIRMED Sales Orders "
                "can be dispatched"
            )
        )

    existing_dispatch = db.query(Dispatch).filter(
        Dispatch.sales_order_id == sales_order_id
    ).first()

    if existing_dispatch:
        raise HTTPException(
            status_code=400,
            detail="Sales Order has already been dispatched"
        )

    order_items = db.query(SalesOrderItem).filter(
        SalesOrderItem.sales_order_id == sales_order_id
    ).all()

    if not order_items:
        raise HTTPException(
            status_code=400,
            detail="Sales Order has no items"
        )

    try:
        locked_inventory = {}

        for item in order_items:

            inventory = (
                db.query(Inventory)
                .filter(
                    Inventory.product_id == item.product_id
                )
                .with_for_update()
                .first()
            )

            if not inventory:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Inventory not found for "
                        f"product {item.product_id}"
                    )
                )

            if inventory.reserved_qty < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Reserved inventory is insufficient "
                        f"for product {item.product_id}"
                    )
                )

            if inventory.physical_qty < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Physical inventory is insufficient "
                        f"for product {item.product_id}"
                    )
                )

            locked_inventory[item.product_id] = inventory

        dispatch = Dispatch(
            sales_order_id=sales_order.id,
            status="DISPATCHED"
        )

        db.add(dispatch)
        db.flush()

        for item in order_items:

            inventory = locked_inventory[item.product_id]

            # Reduce physical stock
            inventory.physical_qty -= item.quantity

            # Release reserved stock
            inventory.reserved_qty -= item.quantity

            dispatch_item = DispatchItem(
                dispatch_id=dispatch.id,
                product_id=item.product_id,
                quantity=item.quantity
            )

            db.add(dispatch_item)

        sales_order.status = "DISPATCHED"

        db.commit()
        db.refresh(dispatch)

        return {
            "message": "Sales Order dispatched successfully",
            "sales_order_id": sales_order.id,
            "dispatch_id": dispatch.id,
            "status": sales_order.status
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to dispatch Sales Order"
        )