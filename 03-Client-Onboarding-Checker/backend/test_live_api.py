import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

c = Client()

print("=================================================================")
print(" SCALEZIX CLIENT ONBOARDING CHECKER — LIVE API VERIFICATION")
print("=================================================================")

# 1. Health check
print("\n[1] Health Check Endpoint: GET /api/health/")
res = c.get('/api/health/')
print(f"Status Code: {res.status_code}")
print(f"Response: {res.json()}")
assert res.status_code == 200

# 2. Dashboard Stats
print("\n[2] Dashboard Stats Endpoint: GET /api/dashboard/stats/")
res = c.get('/api/dashboard/stats/')
stats = res.json()
print(f"Status Code: {res.status_code}")
print(f"Total Onboarding Cases: {stats.get('total_cases')}")
print(f"Total Missing Items: {stats.get('total_missing_items')}")
print(f"Total Security Alerts: {stats.get('total_security_concerns')}")
print(f"Ready for Kickoff Cases: {stats.get('ready_cases_count')}")
assert res.status_code == 200

# 3. List Cases
print("\n[3] Cases Listing Endpoint: GET /api/cases/")
res = c.get('/api/cases/')
data = res.json()
cases = data.get('results', data) if isinstance(data, dict) else data
print(f"Status Code: {res.status_code}")
print(f"Total Cases Retrieved: {len(cases)}")
for case in cases:
    print(f"  * {case['project_name']} | Client: {case['client_company']} | Status: {case['status_display']} | Progress: {case['received_count']}/{case['total_submissions']}")
assert res.status_code == 200
assert len(cases) > 0

# 4. Templates
print("\n[4] Templates Blueprint Endpoint: GET /api/templates/")
res = c.get('/api/templates/')
tpl_data = res.json()
templates = tpl_data.get('results', tpl_data) if isinstance(tpl_data, dict) else tpl_data
print(f"Status Code: {res.status_code}")
print(f"Total Templates: {len(templates)}")
for t in templates:
    print(f"  * Blueprint: {t['name']} ({t['service_type']}) - {t.get('items_count')} requirements")
assert res.status_code == 200

# 5. Gap Analysis Action
case_id = cases[0]['id']
print(f"\n[5] Executing Gap Analysis: POST /api/cases/{case_id}/analyze/")
res = c.post(f'/api/cases/{case_id}/analyze/')
analysis = res.json()
print(f"Status Code: {res.status_code}")
print(f"Status: {analysis.get('status')}")
print(f"Findings Count: {analysis.get('findings_count')}")
print(f"Security Concerns Count: {analysis.get('security_concerns_count')}")
print(f"Readiness Score: {analysis.get('metrics', {}).get('readiness_percentage')}%")
assert res.status_code == 200
assert analysis['status'] == 'success'

# 6. Follow-up Message Generation Action
print(f"\n[6] Generating Client Follow-Up: POST /api/cases/{case_id}/generate_followup/")
res = c.post(f'/api/cases/{case_id}/generate_followup/')
fup = res.json()
print(f"Status Code: {res.status_code}")
print(f"Recipient: {fup.get('recipient_name')}")
print(f"Subject: {fup.get('subject')}")
print("--- Body Preview ---")
preview_lines = fup.get('body', '').splitlines()[:14]
for line in preview_lines:
    print(f"  {line}")
assert res.status_code == 200
assert 'subject' in fup

# 7. CSV Export Endpoints
print(f"\n[7] Testing CSV & Markdown Exports")
res_csv = c.get(f'/api/cases/{case_id}/export_csv/')
print(f"Checklist CSV Export Status: {res_csv.status_code}, Content-Type: {res_csv['Content-Type']}, Length: {len(res_csv.content)} bytes")
assert res_csv.status_code == 200

res_missing = c.get(f'/api/cases/{case_id}/export_missing_csv/')
print(f"Missing Items CSV Export Status: {res_missing.status_code}, Content-Type: {res_missing['Content-Type']}, Length: {len(res_missing.content)} bytes")
assert res_missing.status_code == 200

res_md = c.get(f'/api/cases/{case_id}/export_report_md/')
print(f"Review Report MD Export Status: {res_md.status_code}, Content-Type: {res_md['Content-Type']}, Length: {len(res_md.content)} bytes")
assert res_md.status_code == 200

print("\n=================================================================")
print(" ALL LIVE ENDPOINTS VERIFIED AND RETURNING 200 OK SUCCESSFULLY!")
print("=================================================================")
