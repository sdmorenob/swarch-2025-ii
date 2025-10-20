#!/usr/bin/env python3
"""
Database initialization script for TaskNotes
Uses SQLAlchemy to create tables directly
"""

import os
import sys
import time
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.database.postgres import engine, create_tables

def wait_for_database(max_retries=30, retry_delay=2):
    """Wait for database to be ready"""
    print("🔄 Waiting for database to be ready...")
    
    for attempt in range(max_retries):
        try:
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            return True
        except OperationalError as e:
            print(f"⚠️  Database not ready (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                print("❌ Database connection failed after all retries")
                return False

def main():
    """Main initialization function"""
    print("🚀 Starting database initialization...")
    print(f"📊 Database URL: {settings.postgres_url}")
    
    # Wait for database to be ready
    if not wait_for_database():
        print("❌ Cannot proceed without database connection")
        sys.exit(1)
    
    # Create tables using SQLAlchemy
    try:
        create_tables()
        print("✅ Database initialization completed successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
