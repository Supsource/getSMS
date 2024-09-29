import pandas as pd
from datetime import datetime, timedelta
import gspread
from oauth2client.service_account import ServiceAccountCredentials

def get_google_sheet(sheet_url, credentials_file):
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    credentials = ServiceAccountCredentials.from_json_keyfile_name(credentials_file, scope)
    client = gspread.authorize(credentials)

    sheet = client.open_by_url(sheet_url).sheet1
    data = sheet.get_all_records()
    df = pd.DataFrame(data)
    return df

def filter_due_users(sheet_url, credentials_file):
    df = get_google_sheet(sheet_url, credentials_file)
    df['pollutionDueDate'] = pd.to_datetime(df['pollutionDueDate'], errors='coerce', dayfirst=True)
    df['insuranceDueDate'] = pd.to_datetime(df['insuranceDueDate'], errors='coerce', dayfirst=True)
    
    today = datetime.now()
    due_soon_mask = (df['pollutionDueDate'].notnull() & (df['pollutionDueDate'] <= today + timedelta(days=30))) | \
                    (df['insuranceDueDate'].notnull() & (df['insuranceDueDate'] <= today + timedelta(days=30)))
    
    users_due_soon = df[due_soon_mask]
    return users_due_soon