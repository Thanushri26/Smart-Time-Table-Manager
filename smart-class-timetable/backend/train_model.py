import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pickle
import os

def train():
    df = pd.read_csv('attendance_data.csv')
    X = df[['hour','day_num','faculty_workload','prev_absent_count','subject_difficulty','is_afternoon']]
    y = df['attendance_risk']  # 0 = Low Risk, 1 = High Risk

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LogisticRegression()
    model.fit(X_train, y_train)

    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"Model Accuracy: {acc*100:.2f}%")

    with open('model.pkl','wb') as f:
        pickle.dump(model, f)
    print("model.pkl saved!")

if __name__ == '__main__':
    train()