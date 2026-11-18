import pickle
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
model = None
try:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    print("ML Model Loaded")
except:
    print("model.pkl not found - Run train_model.py first. Using rule-based fallback.")
    model = None

# Mapping helpers
DAY_MAP = {'Monday':0,'Tuesday':1,'Wednesday':2,'Thursday':3,'Friday':4,'Saturday':5}
SUBJECT_DIFFICULTY = {'DBMS':2,'OS':2,'CN':3,'ML':3,'DSA':3,'Web Dev':1,'AI':3,'Cloud':2,'Maths':2,'English':1}

def extract_features(key, slot_data):
    # key = "Monday-9:00-10:00"
    try:
        day_str, time_str = key.split('-', 1)
        day_num = DAY_MAP.get(day_str, 0)
        hour = int(time_str.split(':')[0])
        is_afternoon = 1 if hour >= 13 else 0
    except:
        day_num, hour, is_afternoon = 0, 10, 0

    faculty_workload = 4 if slot_data.get('facultyId',0) > 4 else 2
    prev_absent = 1 if slot_data.get('attendance') == 'absent' else 0
    subject_diff = SUBJECT_DIFFICULTY.get(slot_data.get('subject','DBMS'), 2)
    return [[hour, day_num, faculty_workload, prev_absent, subject_diff, is_afternoon]]

def predict_risk(key, slot_data):
    features = extract_features(key, slot_data)
    if model is not None:
        pred = model.predict(features)[0]
        proba = model.predict_proba(features)[0]
        return "High Risk" if pred == 1 else "Low Risk", float(max(proba))
    else:
        # Fallback rule
        score = features[0][2]*0.1 + features[0][3]*0.4 + features[0][5]*0.3
        return ("High Risk", 0.75) if score > 0.5 else ("Low Risk", 0.85)