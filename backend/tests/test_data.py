import os
import pandas as pd
import pytest

DATASET_PATH = "data/student_dropout_dataset_v3.csv"

def test_dataset_exists_and_rows():
    assert os.path.exists(DATASET_PATH), f"Dataset file must exist at {DATASET_PATH}"
    df = pd.read_csv(DATASET_PATH)
    assert len(df) == 10000, f"Expected 10,000 rows, found {len(df)}"
    assert "Dropout" in df.columns, "Target column 'Dropout' must be present"
    assert "Student_ID" in df.columns, "Identifier column 'Student_ID' must be present"

def test_target_distribution():
    df = pd.read_csv(DATASET_PATH)
    unique_vals = set(df["Dropout"].unique())
    assert unique_vals == {0, 1}, f"Target variable must be binary (0 and 1), found {unique_vals}"
    dropout_count = (df["Dropout"] == 1).sum()
    retained_count = (df["Dropout"] == 0).sum()
    assert dropout_count == 2354, f"Expected 2354 dropouts, got {dropout_count}"
    assert retained_count == 7646, f"Expected 7646 retained, got {retained_count}"

def test_feature_ranges():
    df = pd.read_csv(DATASET_PATH)
    assert (df["GPA"] >= 0.0).all() and (df["GPA"] <= 4.0).all()
    assert (df["Attendance_Rate"] >= 0.0).all() and (df["Attendance_Rate"] <= 100.0).all()
    assert (df["Assignment_Delay_Days"] >= 0).all()
    assert (df["Age"] >= 15.0).all()
