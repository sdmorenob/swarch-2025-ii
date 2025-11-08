#!/usr/bin/env python3
"""
Script para generar claves RSA para JWT RS256
"""

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import base64
import json

def generate_rsa_keys():
    """Generar par de claves RSA"""
    # Generar clave privada
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    
    # Obtener clave pública
    public_key = private_key.public_key()
    
    # Serializar clave privada en formato PEM
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Serializar clave pública en formato PEM
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return private_pem.decode('utf-8'), public_pem.decode('utf-8')

def main():
    print("Generando claves RSA para JWT RS256...")
    
    private_key, public_key = generate_rsa_keys()
    
    # Guardar claves en archivos
    with open('private_key.pem', 'w') as f:
        f.write(private_key)
    
    with open('public_key.pem', 'w') as f:
        f.write(public_key)
    
    print("✅ Claves generadas:")
    print("   - private_key.pem")
    print("   - public_key.pem")
    
    # Mostrar variables de entorno para docker-compose
    print("\n📋 Variables de entorno para docker-compose:")
    print("JWT_ALGORITHM=RS256")
    print("JWT_ISSUER=https://tasknotes-auth")
    print("JWT_AUDIENCE=tasknotes-api")
    print("JWT_KID=tasknotes-key-1")
    
    # Codificar claves para variables de entorno (opcional)
    private_b64 = base64.b64encode(private_key.encode()).decode()
    public_b64 = base64.b64encode(public_key.encode()).decode()
    
    print(f"JWT_PRIVATE_KEY={private_b64}")
    print(f"JWT_PUBLIC_KEY={public_b64}")

if __name__ == "__main__":
    main()