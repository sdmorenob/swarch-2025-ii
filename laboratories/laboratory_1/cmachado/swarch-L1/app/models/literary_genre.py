from config import db
class LiteraryGenre(db.Model):
    __tablename__ = "literary_genres"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    books = db.relationship("Book", back_populates="genre")
    