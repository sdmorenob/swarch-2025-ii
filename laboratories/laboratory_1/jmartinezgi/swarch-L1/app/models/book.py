#book.py
from config import db

class Book(db.Model):
    __tablename__ = "books"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(120), nullable=False)
    published_year = db.Column(db.Integer, nullable=True)

    genre_id = db.Column(db.Integer, db.ForeignKey("literary_genres.id"), nullable=False)
    genre = db.relationship("LiteraryGenre", back_populates="books")

    def __repr__(self):
        return f"<Book {self.title} by {self.author}>"