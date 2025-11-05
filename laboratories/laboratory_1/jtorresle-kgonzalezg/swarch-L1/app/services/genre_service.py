from repositories.genre_repository import GenreRepository

class GenreService:
    def __init__(self):
        self.repo = GenreRepository()

    def list_genres(self):
        return self.repo.list_all()

    def create_genre(self, name, description=""):
        if self.repo.get_by_name(name):
            raise ValueError("Genre already exists")
        return self.repo.create(name, description)