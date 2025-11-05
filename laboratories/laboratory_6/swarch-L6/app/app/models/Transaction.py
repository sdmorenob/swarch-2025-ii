from datetime import datetime

from sqlalchemy import Integer, Column, Float, DateTime

from app.core.database import Base


# Model definition
class Transaction(Base):
    __tablename__ = "transaction"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow())