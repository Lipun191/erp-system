from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app import models

from app.routers import auth
from app.routers import customers
from app.routers import products
from app.routers import enquiries
from app.routers import quotations
from app.routers import sales_orders
from app.routers import inventory



app = FastAPI(
    title="ERP System API",
    version="1.0.0",
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)



app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(enquiries.router)
app.include_router(quotations.router)
app.include_router(sales_orders.router)
app.include_router(inventory.router)



@app.get("/")
def home():
    return {
        "message": "ERP Backend is running"
    }



@app.get("/db-test")
def database_test():

    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT 1")
        )

    return {
        "database": "connected",
        "result": result.scalar()
    }