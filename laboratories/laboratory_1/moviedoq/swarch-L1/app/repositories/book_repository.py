# book_repository.py
from models.book import Book
from config import db
class BookRepository:
    def list_all(self):
        return Book.query.all()
    def get_by_id(self, book_id):
        return Book.query.get(book_id)
    def create(self, title, author, genre, published_year=None):
        book = Book(title=title, author=author, genre=genre, published_year=published_year)
        db.session.add(book)
        db.session.commit()
        return book