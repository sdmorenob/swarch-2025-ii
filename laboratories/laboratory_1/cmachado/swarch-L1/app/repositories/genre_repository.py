from models.literary_genre import LiteraryGenre
from config import db
class GenreRepository:
    def list_all(self):
        return LiteraryGenre.query.all()
    def get_by_id(self, genre_id):
        return LiteraryGenre.query.get(genre_id)
    def get_by_name(self, name):
        return LiteraryGenre.query.filter_by(name=name).first()
    def create(self, name, description=""):
        genre = LiteraryGenre(name=name, description=description)
        db.session.add(genre)
        db.session.commit()
        return genre