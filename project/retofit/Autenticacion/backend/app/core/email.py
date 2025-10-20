from fastapi_mail import FastMail, ConnectionConfig
from dotenv import load_dotenv
import os

load_dotenv()

email_config = ConnectionConfig(
    MAIL_USERNAME=os.getenv('MAIL_USERNAME'),
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
    MAIL_FROM=os.getenv('MAIL_FROM'),
    MAIL_PORT=int(os.getenv('MAIL_PORT', '587')),  # Valor por defecto
    MAIL_SERVER=os.getenv('MAIL_SERVER', 'smtp.gmail.com'),  # Valor por defecto
    MAIL_STARTTLS=os.getenv('MAIL_USE_TLS', 'true').lower() == 'true',
    MAIL_SSL_TLS=os.getenv('MAIL_USE_SSL', 'false').lower() == 'true',
    USE_CREDENTIALS=True
)

fastmail = FastMail(email_config)