# book_controller.py
from flask import Blueprint, render_template, request, redirect, flash
from services.book_service import BookService
from services.genre_service import GenreService

book_bp = Blueprint("book", __name__)
book_service = BookService()
genre_service = GenreService()

@book_bp.route("/")
def list_books():
    books = book_service.list_books()
    return render_template("book/list.html", books=books)

@book_bp.route("/create", methods=["GET", "POST"])
def create_book():
    genres = genre_service.list_genres()
    if request.method == "POST":
        title = request.form["title"]
        author = request.form["author"]
        published_year = request.form.get("published_year")
        genre_id = request.form["genre_id"]
        try:
            book_service.create_book(title, author, int(genre_id), published_year or None)
            flash("Book created successfully", "success")
            return redirect("/books/")
        except Exception as e:
            flash(str(e), "error")
    return render_template("book/create.html", genres=genres)
