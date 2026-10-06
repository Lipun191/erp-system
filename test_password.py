from passlib.context import CryptContext
from sqlalchemy import text

from app.database import engine


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


with engine.connect() as connection:
    result = connection.execute(
        text("SELECT password_hash FROM users WHERE email = 'admin@erp.com'")
    )

    password_hash = result.scalar()


print("Password correct:", pwd_context.verify("Admin@123", password_hash))