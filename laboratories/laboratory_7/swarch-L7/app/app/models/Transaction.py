from datetime import datetime

from sqlalchemy import Integer, Column, Float, DateTime, Index

from app.core.database import Base


# Model definition
class Transaction(Base):
    __tablename__ = "transaction"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, index=True)  # Agregado: index=True
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)  # Cambiado: sin () y con index=True
    
    # Índice compuesto para queries que usan ambas columnas
    __table_args__ = (
        Index('idx_timestamp_amount', 'timestamp', 'amount'),
    )