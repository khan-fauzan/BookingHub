#!/usr/bin/env python3
"""
Test script to debug search-properties function
Run: python3 test-search.py
"""

import boto3
import json
from boto3.dynamodb.conditions import Key, Attr

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('hotel-booking-properties-dev')

def test_scan_by_city():
    """Test 1: Scan by City (Address.city)"""
    print('\n=== Test 1: Scan by City (Address.city) ===')

    try:
        response = table.scan(
            FilterExpression=Attr('EntityType').eq('Property') & Attr('Address.city').eq('Dubai'),
            Limit=5
        )

        items = response.get('Items', [])
        print(f'✓ Found {len(items)} items')

        if items:
            print('\nFirst item:')
            item = items[0]
            print(f"  PK: {item.get('PK')}")
            print(f"  SK: {item.get('SK')}")
            print(f"  Name: {item.get('Name')}")
            print(f"  EntityType: {item.get('EntityType')}")
            print(f"  Address: {json.dumps(item.get('Address'), indent=2)}")
            print(f"  GSI1PK: {item.get('GSI1PK')}")
        else:
            print('  No items returned!')

    except Exception as e:
        print(f'✗ Error: {str(e)}')
        print(f'Full error: {e}')


def test_scan_with_sk():
    """Test 2: Scan by City with SK filter"""
    print('\n=== Test 2: Scan by City with SK filter ===')

    try:
        response = table.scan(
            FilterExpression=Attr('SK').eq('METADATA') &
                           Attr('EntityType').eq('Property') &
                           Attr('Address.city').eq('Dubai'),
            Limit=5
        )

        items = response.get('Items', [])
        print(f'✓ Found {len(items)} items')

    except Exception as e:
        print(f'✗ Error: {str(e)}')


def test_query_with_gsi():
    """Test 3: Query with LocationIndex (GSI1PK)"""
    print('\n=== Test 3: Query with LocationIndex (GSI1PK) ===')

    try:
        response = table.query(
            IndexName='LocationIndex',
            KeyConditionExpression=Key('GSI1PK').eq('CITY#Dubai#UAE'),
            FilterExpression=Attr('EntityType').eq('Property'),
            Limit=5
        )

        items = response.get('Items', [])
        print(f'✓ Found {len(items)} items')

        if items:
            print('\nFirst item:')
            item = items[0]
            print(f"  PK: {item.get('PK')}")
            print(f"  Name: {item.get('Name')}")
            print(f"  GSI1PK: {item.get('GSI1PK')}")
            print(f"  Address: {json.dumps(item.get('Address'), indent=2)}")

    except Exception as e:
        print(f'✗ Error: {str(e)}')
        print(f'Full error: {e}')


def test_scan_all():
    """Test 4: Scan all METADATA items (no filters)"""
    print('\n=== Test 4: Scan all METADATA items (no filters) ===')

    try:
        response = table.scan(
            FilterExpression=Attr('SK').eq('METADATA'),
            Limit=3
        )

        items = response.get('Items', [])
        print(f'✓ Found {len(items)} items')

        if items:
            for idx, item in enumerate(items, 1):
                print(f'\nItem {idx}:')
                print(f"  PK: {item.get('PK')}")
                print(f"  EntityType: {item.get('EntityType')}")
                print(f"  Name: {item.get('Name')}")

                address = item.get('Address', {})
                print(f"  Address.city: {address.get('city')}")
                print(f"  Address.country: {address.get('country')}")
                print(f"  GSI1PK: {item.get('GSI1PK')}")
        else:
            print('  No items returned!')

    except Exception as e:
        print(f'✗ Error: {str(e)}')


def test_raw_scan():
    """Test 5: Raw scan to see actual data structure"""
    print('\n=== Test 5: Raw scan (first item) ===')

    try:
        response = table.scan(Limit=1)

        items = response.get('Items', [])
        if items:
            print('Raw item structure:')
            print(json.dumps(items[0], indent=2, default=str))
        else:
            print('  No items in table!')

    except Exception as e:
        print(f'✗ Error: {str(e)}')


def main():
    print('Starting DynamoDB search tests...\n')
    print(f'Table: hotel-booking-properties-dev')
    print(f'Region: us-east-1')

    test_raw_scan()
    test_scan_all()
    test_query_with_gsi()
    test_scan_by_city()
    test_scan_with_sk()

    print('\n=== Tests Complete ===\n')


if __name__ == '__main__':
    main()
