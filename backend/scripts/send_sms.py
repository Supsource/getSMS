from twilio.rest import Client
import pandas as pd

account_sid = 'ACa3d08e4914ac882115b65eb667eef762'
auth_token = '2964e9844a829fbaec0d673a708b9de5'
client = Client(account_sid, auth_token)

def send_sms(phone_number, message):
    try:
        message = client.messages.create(
            from_='+12167162316',
            to=phone_number,
            body=message
        )
        print(f"Message sent to {phone_number}: {message.sid}")
    except Exception as e:
        print(f"Failed to send message to {phone_number}: {e}")

def send_bulk_sms(users_due_soon):
    for _, row in users_due_soon.iterrows():
        phone_number = row['Contact Number']
        if not str(phone_number).startswith('+'):
            if len(str(phone_number)) == 10:
                phone_number = '+91' + str(phone_number)
        
        owner_name = row['ownerName']
        due_type, due_date = None, None
        
        if pd.notnull(row['pollutionDueDate']):
            due_date = row['pollutionDueDate']
            due_type = "pollution due date"
        elif pd.notnull(row['insuranceDueDate']):
            due_date = row['insuranceDueDate']
            due_type = "insurance due date"
        
        if due_date is not None:
            message = f"Hello {owner_name}, your {due_type} is on {due_date.strftime('%Y-%m-%d')}."
            send_sms(phone_number, message)
        else:
            print(f"No due dates found for {owner_name}.")