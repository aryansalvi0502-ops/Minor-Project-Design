# Dataset Documentation: Student Dropout Early-Warning System

## 1. Dataset Provenance & Selection
- **Selected File:** `data/student_dropout_dataset_v3.csv`
- **Origin:** Downloaded from Kaggle (`c:\Users\ARYAN\Downloads\student_dropout_dataset_v3.csv`), verified as the latest complete version.
- **Row Count:** 10,000 records
- **Column Count:** 19 fields
- **Duplicates:** 0 duplicate rows detected.

## 2. Target Variable
- **Column Name:** `Dropout`
- **Definition:** Binary indicator where:
  - `0`: Retained (Enrolled / Graduate / Good Academic Standing) (7,646 rows, 76.46%)
  - `1`: Dropout / At-Risk of Discontinuation (2,354 rows, 23.54%)
- **Imbalance Ratio:** ~3.25:1 (Moderate class imbalance addressed via stratified splitting, balanced class weights, precision-recall AUC, and threshold calibration).

## 3. Schema & Feature Definitions
| Column Name | Data Type | Missing Count | Description / Allowed Range | Model Feature? |
|---|---|---|---|---|
| `Student_ID` | Integer | 0 | Unique institutional identifier (1 to 10000) | **NO** (Leakage / Identifier exclusion) |
| `Age` | Float | 0 | Student age in years (17.0 - 29.6) | Yes |
| `Gender` | String | 0 | Gender ('Female', 'Male') | Yes |
| `Family_Income` | Float | 500 (5.0%) | Annual household income in currency units ($25k - $316k) | Yes (Imputed: Median) |
| `Internet_Access` | String | 0 | Stable home internet access ('Yes', 'No') | Yes |
| `Study_Hours_per_Day` | Float | 500 (5.0%) | Daily self-study hours outside class (0.5 - 8.98) | Yes (Imputed: Median) |
| `Attendance_Rate` | Float | 0 | Class attendance percentage (38.2% - 100.0%) | Yes |
| `Assignment_Delay_Days` | Integer | 0 | Average assignment submission delay in days (0 - 8) | Yes |
| `Travel_Time_Minutes` | Float | 0 | Daily one-way campus commute time in minutes (5.0 - 74.9) | Yes |
| `Part_Time_Job` | String | 0 | Whether student works part-time ('Yes', 'No') | Yes |
| `Scholarship` | String | 0 | Financial scholarship recipient ('Yes', 'No') | Yes |
| `Stress_Index` | Float | 500 (5.0%) | Self-reported stress index (1.0 to 10.0 scale) | Yes (Imputed: Median) |
| `GPA` | Float | 0 | Current overall Grade Point Average (0.0 to 4.0) | Yes |
| `Semester_GPA` | Float | 0 | Most recent semester GPA (0.0 to 4.0) | Yes |
| `CGPA` | Float | 0 | Cumulative Grade Point Average (0.0 to 4.0) | Yes |
| `Semester` | String | 0 | Current academic level ('Year 1', 'Year 2', 'Year 3', 'Year 4') | Yes |
| `Department` | String | 0 | Faculty/Major ('Science', 'Arts', 'Business', 'CS', 'Engineering') | Yes |
| `Parental_Education` | String | 511 (5.11%) | Highest parental education ('High School', 'Bachelor', 'Master', 'PhD', or None/Missing) | Yes (Imputed: 'Missing') |
| `Dropout` | Integer | 0 | Ground-truth dropout label (0 or 1) | **Target** |

## 4. Leakage & Integrity Protocols
- `Student_ID` is strictly removed before feature preprocessing.
- All imputation statistics and categorical encoders are fitted **strictly on training splits** during 5-fold stratified cross-validation and 70/15/15 train/val/test splits.
- Predictions represent risk associations and probabilistic guidance, never fatalistic determinations.
