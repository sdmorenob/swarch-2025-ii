import os
from datetime import datetime, UTC
from importlib import util
from app.core.database import db

history = db["migration_history"]

async def has_run(migration_id):
    g = await history.find_one({"migration_id": migration_id})
    return g is not None

def mark_as_run(migration_id):
    history.insert_one({"migration_id": migration_id, "run_at": datetime.now(UTC)})

def get_migration_files():
    current_dir = os.path.dirname(__file__)
    files = []

    for filename in sorted(os.listdir(current_dir)):
        if filename.endswith(".py") and filename.split('_')[0].isdigit() and filename != os.path.basename(__file__):
            files.append(filename)
            return files


async def run_migrations():
    for file in get_migration_files():
        migration_id = file.split(".")[0]
        if await has_run(migration_id):
            print(f"Skipping {migration_id}, already run.")
            continue

        path = os.path.join(os.path.dirname(__file__), file)
        spec = util.spec_from_file_location(migration_id, path)
        module = util.module_from_spec(spec)
        spec.loader.exec_module(module)

        if hasattr(module, "run"):
            print(f"Running {migration_id}...")
            module.run()
            mark_as_run(migration_id)
            print(f"Completed {migration_id}.")
        else:
            print(f"No run() function found in {migration_id}, skipping.")