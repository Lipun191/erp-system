from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Quotation,
    QuotationItem,
    Enquiry,
    EnquiryItem,
    Product
)
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/quotations",
    tags=["Quotations"]
)


# ============================================================
# CREATE QUOTATION
# ============================================================

@router.post("/")
def create_quotation(
    enquiry_id: int,
    discount: int = 0,
    gst_percent: int = 18,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    enquiry = db.query(Enquiry).filter(
        Enquiry.id == enquiry_id
    ).first()

    if not enquiry:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found"
        )

    if enquiry.status == "LOST":
        raise HTTPException(
            status_code=400,
            detail="Cannot create quotation for a lost enquiry"
        )

    enquiry_items = db.query(EnquiryItem).filter(
        EnquiryItem.enquiry_id == enquiry_id
    ).all()

    if not enquiry_items:
        raise HTTPException(
            status_code=400,
            detail="Enquiry has no items"
        )

    if discount < 0:
        raise HTTPException(
            status_code=400,
            detail="Discount cannot be negative"
        )

    if gst_percent < 0:
        raise HTTPException(
            status_code=400,
            detail="GST cannot be negative"
        )

    subtotal = 0
    quotation_items = []

    for item in enquiry_items:

        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found"
            )

        item_total = item.quantity * product.unit_price

        subtotal += item_total

        quotation_items.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "unit_price": product.unit_price
        })

    if discount > subtotal:
        raise HTTPException(
            status_code=400,
            detail="Discount cannot exceed subtotal"
        )

    taxable_amount = subtotal - discount

    gst = int(
        taxable_amount * gst_percent / 100
    )

    total_amount = taxable_amount + gst

    quotation = Quotation(
        enquiry_id=enquiry_id,
        status="DRAFT",
        subtotal=subtotal,
        discount=discount,
        gst=gst,
        total_amount=total_amount
    )

    db.add(quotation)
    db.commit()
    db.refresh(quotation)

    for item in quotation_items:

        quotation_item = QuotationItem(
            quotation_id=quotation.id,
            product_id=item["product_id"],
            quantity=item["quantity"],
            unit_price=item["unit_price"]
        )

        db.add(quotation_item)

    enquiry.status = "QUOTED"

    db.commit()

    return {
        "message": "Quotation created successfully",
        "quotation_id": quotation.id,
        "enquiry_id": quotation.enquiry_id,
        "status": quotation.status,
        "subtotal": quotation.subtotal,
        "discount": quotation.discount,
        "gst": quotation.gst,
        "total_amount": quotation.total_amount,
        "items": quotation_items
    }


# ============================================================
# GET ALL QUOTATIONS
# ============================================================

@router.get("/")
def get_quotations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    quotations = db.query(Quotation).all()

    result = []

    for quotation in quotations:

        items = db.query(QuotationItem).filter(
            QuotationItem.quotation_id == quotation.id
        ).all()

        result.append({
            "id": quotation.id,
            "enquiry_id": quotation.enquiry_id,
            "status": quotation.status,
            "subtotal": quotation.subtotal,
            "discount": quotation.discount,
            "gst": quotation.gst,
            "total_amount": quotation.total_amount,
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
# UPDATE QUOTATION STATUS
# ============================================================

@router.patch("/{quotation_id}/status")
def update_quotation_status(
    quotation_id: int,
    new_status: str,
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

    new_status = new_status.upper()

    allowed_transitions = {
        "SENT": ["DRAFT"],
        "ACCEPTED": ["SENT"],
        "REJECTED": ["SENT"]
    }

    if new_status not in allowed_transitions:
        raise HTTPException(
            status_code=400,
            detail="Invalid quotation status"
        )

    old_status = quotation.status

    if old_status not in allowed_transitions[new_status]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot change quotation from "
                f"{old_status} to {new_status}"
            )
        )

    quotation.status = new_status

    db.commit()
    db.refresh(quotation)

    return {
        "message": "Quotation status updated successfully",
        "quotation_id": quotation.id,
        "previous_status": old_status,
        "status": quotation.status
    }