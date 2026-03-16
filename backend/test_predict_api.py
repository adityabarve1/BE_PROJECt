import requests

# Replace with actual backend URL and sample features
url_predict = "http://localhost:5001/api/prediction/predict"
url_explain = "http://localhost:5001/api/prediction/explain"

sample = {
    "student_name": "Test Student",
    "roll_no": 1,
    "feature1": 0,
    "feature2": 0
}

print("--- Predict Endpoint ---")
pred_resp = requests.post(url_predict, json=sample)
print(pred_resp.status_code)
print(pred_resp.json())

print("\n--- Explain Endpoint ---")
explain_resp = requests.post(url_explain, json=sample)
print(explain_resp.status_code)
print(explain_resp.json())
