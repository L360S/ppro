from flask import Flask, jsonify, send_from_directory
from pathlib import Path
import sqlite3

# Absolute path to the folder containing server.py
BASE_DIR = Path(__file__).resolve().parent

# Serve HTML/CSS/JS/images from the same folder as server.py
app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path='')


def get_random_fighter():
    db_path = BASE_DIR / 'statindexs' / 'stats.db'

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM fighters ORDER BY RANDOM() LIMIT 1')
    row = cursor.fetchone()

    conn.close()

    if row:
        fighter = dict(row)

        # Remove field we don't need on the frontend
        fighter.pop('Profile URL', None)

        return fighter

    return None


@app.route('/')
def home():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/api/random-fighter', methods=['GET'])
def api_random_fighter():
    fighter_data = get_random_fighter()

    if fighter_data:
        return jsonify(fighter_data)

    return jsonify({"error": "No data found"}), 404


if __name__ == '__main__':
    app.run(port=5000, debug=True)