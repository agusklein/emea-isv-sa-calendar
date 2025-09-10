import json
import requests
import boto3
from datetime import datetime
import re

def lambda_handler(event, context):
    """
    AWS Lambda function to fetch data from Quip and return formatted events
    """
    
    # Quip API configuration
    QUIP_TOKEN = "YOUR_QUIP_TOKEN"  # Store in AWS Secrets Manager
    QUIP_DOCUMENT_ID = "UtwbAwh5fZst"
    
    try:
        # Fetch data from Quip API
        headers = {
            'Authorization': f'Bearer {QUIP_TOKEN}',
            'Content-Type': 'application/json'
        }
        
        # Get document content from Quip
        url = f'https://platform.quip.com/1/threads/{QUIP_DOCUMENT_ID}'
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"Quip API error: {response.status_code}")
        
        quip_data = response.json()
        
        # Parse Quip document content
        events = parse_quip_content(quip_data)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': json.dumps({
                'events': events,
                'lastUpdated': datetime.now().isoformat(),
                'source': 'quip'
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'events': []
            })
        }

def parse_quip_content(quip_data):
    """
    Parse Quip document content to extract events
    """
    events = []
    
    # Extract HTML content from Quip response
    html_content = quip_data.get('html', '')
    
    # Parse table rows or structured content
    # This is a simplified parser - adjust based on actual Quip document structure
    lines = html_content.split('\n')
    
    for line in lines:
        # Look for patterns like "Activity | When | Comments"
        if 'OP2 Prep' in line or 'September 2025' in line:
            # Extract event data using regex or HTML parsing
            event = extract_event_from_line(line)
            if event:
                events.append(event)
    
    return events

def extract_event_from_line(line):
    """
    Extract event information from a line of Quip content
    """
    # This needs to be customized based on your Quip document format
    # Example implementation:
    
    # Remove HTML tags
    clean_line = re.sub('<[^<]+?>', '', line).strip()
    
    if not clean_line:
        return None
    
    # Parse based on your document structure
    parts = clean_line.split('|')  # Adjust delimiter as needed
    
    if len(parts) >= 3:
        title = parts[0].strip()
        when = parts[1].strip()
        description = parts[2].strip()
        
        # Parse month and year from "when" field
        month, year = parse_date_string(when)
        
        if month is not None and title:
            return {
                'title': title,
                'description': description,
                'month': month,
                'year': year,
                'type': 'meeting',
                'location': '',
                'originalWhen': when
            }
    
    return None

def parse_date_string(date_str):
    """
    Parse date string like "September 2025" to month index and year
    """
    months = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ]
    
    date_lower = date_str.lower().strip()
    
    for i, month in enumerate(months):
        if month in date_lower:
            # Extract year
            year_match = re.search(r'\b(20\d{2})\b', date_str)
            year = int(year_match.group(1)) if year_match else 2025
            return i, year
    
    return None, None
