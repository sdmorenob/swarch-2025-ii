# book_service.py
from repositories.book_repository import BookRepository
from repositories.genre_repository import GenreRepository

class BookService:
    def __init__(self):
        self.book_repo = BookRepository()
        self.genre_repo = GenreRepository()

    def list_books(self):
        return self.book_repo.list_all()
    
    def create_book(self, title, author, genre_id, published_year=None):
        genre = self.genre_repo.get_by_id(genre_id)
        if not genre:
            raise ValueError("Invalid genre")
        return self.book_repo.create(title, author, genre, published_year)