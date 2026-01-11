"""
Data Preprocessing Module for Student Dropout Prediction
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os


class DropoutDataPreprocessor:
    """Preprocessing pipeline for student dropout data"""
    
    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_names = []
        
    def load_data(self, filepath):
        """Load data from CSV file"""
        df = pd.read_csv(filepath)
        return df
    
    def encode_categorical(self, df, categorical_columns):
        """Encode categorical variables"""
        df_encoded = df.copy()
        
        for col in categorical_columns:
            if col in df_encoded.columns:
                le = LabelEncoder()
                df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))
                self.label_encoders[col] = le
        
        return df_encoded
    
    def handle_missing_values(self, df):
        """Handle missing values in the dataset"""
        # Fill numeric columns with median
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            df[col].fillna(df[col].median(), inplace=True)
        
        # Fill categorical columns with mode
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            df[col].fillna(df[col].mode()[0], inplace=True)
        
        return df
    
    def normalize_features(self, X_train, X_test=None):
        """Normalize numerical features"""
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        if X_test is not None:
            X_test_scaled = self.scaler.transform(X_test)
            return X_train_scaled, X_test_scaled
        
        return X_train_scaled
    
    def prepare_data(self, df, target_column='dropout_risk', test_size=0.2, random_state=42):
        """Complete preprocessing pipeline"""
        # Load data if string path is provided
        if isinstance(df, str):
            df = pd.read_csv(df)
        
        # Handle missing values
        df = self.handle_missing_values(df)
        
        # Define categorical columns
        categorical_columns = ['gender', 'location', 'parent_occupation', 'class', 'income']
        
        # Encode categorical variables
        df_encoded = self.encode_categorical(df, categorical_columns)
        
        # Separate features and target
        # Drop student_name and roll_no as they are identifiers
        feature_columns = [col for col in df_encoded.columns 
                          if col not in [target_column, 'student_name', 'roll_no']]
        
        X = df_encoded[feature_columns]
        y = df_encoded[target_column]
        
        self.feature_names = feature_columns
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        # Normalize features
        X_train_scaled, X_test_scaled = self.normalize_features(X_train, X_test)
        
        return X_train_scaled, X_test_scaled, y_train.values, y_test.values
    
    def save_preprocessor(self, filepath):
        """Save preprocessor objects"""
        joblib.dump({
            'label_encoders': self.label_encoders,
            'scaler': self.scaler,
            'feature_names': self.feature_names
        }, filepath)
        print(f"Preprocessor saved to {filepath}")
    
    def load_preprocessor(self, filepath):
        """Load preprocessor objects"""
        data = joblib.load(filepath)
        self.label_encoders = data['label_encoders']
        self.scaler = data['scaler']
        self.feature_names = data['feature_names']
        print(f"Preprocessor loaded from {filepath}")
    
    def preprocess_single_sample(self, sample_dict):
        """Preprocess a single student record for prediction"""
        # Create DataFrame from dictionary
        df = pd.DataFrame([sample_dict])
        
        # Encode categorical variables
        for col, encoder in self.label_encoders.items():
            if col in df.columns:
                df[col] = encoder.transform(df[col].astype(str))
        
        # Select only feature columns in the correct order
        X = df[self.feature_names]
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        return X_scaled


def create_sample_data(output_path, n_samples=1000):
    """
    Create sample dataset for Jilha Parishad school students
    """
    np.random.seed(42)
    
    # Generate synthetic data
    data = {
        'student_name': [f'Student_{i}' for i in range(1, n_samples + 1)],
        'roll_no': [f'JP{i:05d}' for i in range(1, n_samples + 1)],
        'attendance': np.random.uniform(40, 100, n_samples),
        'marks': np.random.uniform(20, 100, n_samples),
        'income': np.random.choice(['Low', 'Medium', 'High'], n_samples, p=[0.6, 0.3, 0.1]),
        'gender': np.random.choice(['Male', 'Female'], n_samples),
        'class': np.random.choice(['5th', '6th', '7th', '8th', '9th', '10th'], n_samples),
        'parent_occupation': np.random.choice(
            ['Farmer', 'Labor', 'Small Business', 'Government Job', 'Daily Wage'], 
            n_samples, 
            p=[0.4, 0.3, 0.15, 0.05, 0.1]
        ),
        'location': np.random.choice(['Rural', 'Urban', 'City'], n_samples, p=[0.7, 0.2, 0.1])
    }
    
    df = pd.DataFrame(data)
    
    # Create dropout risk based on features (simulated logic)
    df['dropout_risk'] = 0  # 0: Low risk, 1: High risk
    
    # High risk conditions
    df.loc[(df['attendance'] < 60) | (df['marks'] < 40), 'dropout_risk'] = 1
    df.loc[(df['income'] == 'Low') & (df['attendance'] < 70), 'dropout_risk'] = 1
    df.loc[(df['location'] == 'Rural') & (df['marks'] < 50) & (df['attendance'] < 75), 'dropout_risk'] = 1
    
    # Save to CSV
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Sample dataset created with {n_samples} records at {output_path}")
    
    return df


if __name__ == "__main__":
    # Create sample dataset
    output_path = "../data/raw/student_data.csv"
    create_sample_data(output_path, n_samples=1000)
