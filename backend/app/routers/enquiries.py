from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Enquiry, EnquiryItem, Customer, Product
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/enquiries",
    tags=["Enquiries"]
)


# ============================================================
# CREATE ENQUIRY
# ============================================================

@router.post("/")
def create_enquiry(
    customer_id: int,
    product_id: int,
    quantity: int,
    remarks: str = "",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    try:
        enquiry = Enquiry(
            customer_id=customer_id,
            status="NEW",
            remarks=remarks
        )

        db.add(enquiry)
        db.flush()

        item = EnquiryItem(
            enquiry_id=enquiry.id,
            product_id=product_id,
            quantity=quantity
        )

        db.add(item)

        db.commit()

        db.refresh(enquiry)
        db.refresh(item)

        return {
            "message": "Enquiry created successfully",
            "enquiry_id": enquiry.id,
            "customer_id": customer_id,
            "product_id": product_id,
            "quantity": quantity,
            "status": enquiry.status
        }

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create enquiry"
        )


# ============================================================
# GET ALL ENQUIRIES
# ============================================================

@router.get("/")
def get_enquiries(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    enquiries = db.query(Enquiry).all()

    result = []

    for enquiry in enquiries:

        items = db.query(EnquiryItem).filter(
            EnquiryItem.enquiry_id == enquiry.id
        ).all()

        result.append({
            "id": enquiry.id,
            "customer_id": enquiry.customer_id,
            "status": enquiry.status,
            "remarks": enquiry.remarks,
            "items": [
                {
                    "product_id": item.product_id,
                    "quantity": item.quantity
                }
                for item in items
            ]
        })

    return result


# ============================================================
# UPDATE ENQUIRY STATUS
# ============================================================

@router.patch("/{enquiry_id}/status")
def update_enquiry_status(
    enquiry_id: int,
    new_status: str,
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

    new_status = new_status.upper()

    allowed_transitions = {
        "QUOTED": ["NEW"],
        "WON": ["QUOTED"],
        "LOST": ["NEW", "QUOTED"]
    }

    if new_status not in allowed_transitions:
        raise HTTPException(
            status_code=400,
            detail="Invalid enquiry status"
        )

    old_status = enquiry.status

    if old_status not in allowed_transitions[new_status]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot change enquiry from "
                f"{old_status} to {new_status}"
            )
        )

    enquiry.status = new_status

    db.commit()
    db.refresh(enquiry)

    return {
        "message": "Enquiry status updated successfully",
        "enquiry_id": enquiry.id,
        "previous_status": old_status,
        "status": enquiry.status
    }