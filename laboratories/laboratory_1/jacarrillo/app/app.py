from flask import Flask
from config import Config, db, migrate

from controllers.genre_controller import genre_bp
from controllers.book_controller import book_bp


def create_app():
    app = Flask(__name__)
    print(Config.SQLALCHEMY_DATABASE_URI)  # Para verificar conexión
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        db.create_all()

    # Registrar blueprints
    app.register_blueprint(genre_bp, url_prefix="/genres")
    app.register_blueprint(book_bp, url_prefix="/books")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", debug=True)
