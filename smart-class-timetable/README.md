# Smart Class Time Table Management System

## Features
- Auto Timetable Generation (Constraint + ML)
- Drag & Drop Faculty Replacement
- Editable Attendance
- Biometric Auto-Updation
- ML Attendance Prediction (Logistic Regression)
- Edit Subject / Room / Faculty
- Export JSON

## How to Run
1. Backend:
   cd backend
   pip install -r requirements.txt
   python train_model.py
   python app.py

2. Frontend:
   Open frontend/index.html in browser
   Or: cd frontend && python -m http.server 8000