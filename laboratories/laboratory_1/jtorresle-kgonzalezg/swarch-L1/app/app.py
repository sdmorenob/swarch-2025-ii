from flask import Flask
from config import Config, db, migrate
import time
import sys
from sqlalchemy.exc import OperationalError

from controllers.genre_controller import genre_bp
from controllers.book_controller import book_bp


def wait_for_db(app, max_retries=30, delay=2):
    """Wait for database to be available"""
    for attempt in range(max_retries):
        try:
            with app.app_context():
                db.create_all()
            print("Database connection successful!")
            return True
        except OperationalError as e:
            print(f"Database connection attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                print("Max retries reached. Database connection failed.")
                return False
    return False


def create_app():
    app = Flask(__name__)
    print(Config.SQLALCHEMY_DATABASE_URI)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    # Wait for database to be available
    if not wait_for_db(app):
        print("Failed to connect to database. Exiting...")
        sys.exit(1)

    # Register blueprints
    app.register_blueprint(genre_bp, url_prefix="/genres")
    app.register_blueprint(book_bp, url_prefix="/books")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", debug=True)