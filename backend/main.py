from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from scripts.filter_users import filter_due_users
from scripts.send_sms import send_bulk_sms
import os
import logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://get-sms.vercel.app/"}}) 
logging.basicConfig(level=logging.INFO)

SHEET_URL = 'https://docs.google.com/spreadsheets/d/1UwJs99EHSAZl9d1YSmlWPABKrT6nzVU3QzJeirtkJwo/edit?gid=0#gid=0'
CREDENTIALS_FILE = 'config/credentials.json'

@app.errorhandler(Exception)
def handle_exception(e):
    logging.error(f"Error occurred: {str(e)}")
    return jsonify({"error": str(e)}), 500

@app.route('/api/due-users', methods=['GET'])
def get_due_users():
    users_due_soon = filter_due_users(SHEET_URL, CREDENTIALS_FILE)
    return jsonify(users_due_soon.to_dict(orient="records"))

@app.route('/api/send-sms', methods=['POST'])
def send_sms():
    users_due_soon = filter_due_users(SHEET_URL, CREDENTIALS_FILE)
    send_bulk_sms(users_due_soon)
    return jsonify({'message': 'SMS sent to all users due soon'})

@app.route('/api/export-csv', methods=['GET', 'POST'])  
def export_csv():
    users_due_soon = filter_due_users(SHEET_URL, CREDENTIALS_FILE)
    export_file_path = os.path.join(os.getcwd(), 'users_due_soon.csv')
    users_due_soon.to_csv(export_file_path, index=False)

    return send_file(
        export_file_path,
        mimetype='text/csv',
        as_attachment=True,
        download_name='users_due_soon.csv'
    )

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
