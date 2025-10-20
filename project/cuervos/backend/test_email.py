from pydantic import EmailStr, ValidationError

try:
    email = EmailStr('test@example.com')
    print('EmailStr works:', email)
except ValidationError as e:
    print('EmailStr error:', e)
