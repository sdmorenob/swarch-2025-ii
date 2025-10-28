#!/usr/bin/env python3
"""
Database management script for TaskNotes
Simple commands to manage the database
"""

import os
import sys

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.postgres import create_tables, drop_tables, engine
from app.core.config import settings

def show_help():
    """Show help message"""
    print("""
🗄️  TaskNotes Database Manager

Usage: python manage_db.py [command]

Commands:
  create    - Create all database tables
  drop      - Drop all database tables (⚠️  DANGER!)
  reset     - Drop and recreate all tables (⚠️  DANGER!)
  status    - Show database connection status
  help      - Show this help message

Examples:
  python manage_db.py create
  python manage_db.py status
  python manage_db.py reset
""")

def check_connection():
    """Check database connection"""
    try:
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            print("✅ Database connection successful")
            print(f"📊 Database URL: {settings.postgres_url}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def main():
    """Main function"""
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1].lower()
    
    if command == "help":
        show_help()
    elif command == "status":
        check_connection()
    elif command == "create":
        if check_connection():
            create_tables()
    elif command == "drop":
        if check_connection():
            print("⚠️  WARNING: This will delete ALL data!")
            response = input("Are you sure? Type 'yes' to continue: ")
            if response.lower() == 'yes':
                drop_tables()
            else:
                print("❌ Operation cancelled")
    elif command == "reset":
        if check_connection():
            print("⚠️  WARNING: This will delete ALL data and recreate tables!")
            response = input("Are you sure? Type 'yes' to continue: ")
            if response.lower() == 'yes':
                drop_tables()
                create_tables()
            else:
                print("❌ Operation cancelled")
    else:
        print(f"❌ Unknown command: {command}")
        show_help()

if __name__ == "__main__":
    main()
