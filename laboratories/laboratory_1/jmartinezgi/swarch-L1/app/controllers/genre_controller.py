# genre_controller.py
from flask import Blueprint, render_template, request, redirect, flash
from services.genre_service import GenreService

genre_bp = Blueprint("genre", __name__)
service = GenreService()

@genre_bp.route("/")
def list_genres():
    genres = service.list_genres()
    return render_template("genre/list.html", genres=genres)

@genre_bp.route("/create", methods=["GET", "POST"])
def create_genre():
    if request.method == "POST":
        name = request.form["name"]
        description = request.form.get("description", "")
        try:
            service.create_genre(name, description)
            flash("Genre created successfully", "success")
            return redirect("/genres/")
        except Exception as e:
            flash(str(e), "error")
    return render_template("genre/create.html")
