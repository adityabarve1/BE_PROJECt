"""
Prediction Module for Student Dropout Risk
"""

import torch
import numpy as np
import joblib

from tabnet_model import TabNetClassifier
from data_preprocessing import DropoutDataPreprocessor


class DropoutPredictor:
    """Predictor class for student dropout risk"""
    
    def __init__(self, model_path, preprocessor_path):
        """
        Initialize predictor with trained model and preprocessor
        
        Args:
            model_path: Path to saved model checkpoint
            preprocessor_path: Path to saved preprocessor
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Load preprocessor
        self.preprocessor = DropoutDataPreprocessor()
        self.preprocessor.load_preprocessor(preprocessor_path)
        
        # Initialize and load model
        input_dim = len(self.preprocessor.feature_names)
        self.model = TabNetClassifier(
            input_dim=input_dim,
            output_dim=2,
            n_steps=3,
            n_d=8,
            n_a=8
        )
        
        checkpoint = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.to(self.device)
        self.model.eval()
        
        print(f"Model loaded from {model_path}")
        print(f"Using device: {self.device}")
    
    def predict_single(self, student_data):
        """
        Predict dropout risk for a single student
        
        Args:
            student_data: Dictionary containing student information
            
        Returns:
            Dictionary with prediction results
        """
        # Preprocess input
        X = self.preprocessor.preprocess_single_sample(student_data)
        X_tensor = torch.FloatTensor(X).to(self.device)
        
        # Make prediction
        with torch.no_grad():
            output, attention_masks = self.model.forward_masks(X_tensor)
            probabilities = torch.softmax(output, dim=1)
            prediction = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][prediction].item()
        
        # Prepare result
        result = {
            'dropout_risk': 'High' if prediction == 1 else 'Low',
            'risk_score': probabilities[0][1].item(),  # Probability of high risk
            'confidence': confidence,
            'recommendation': self._generate_recommendation(prediction, student_data, probabilities[0][1].item())
        }
        
        return result
    
    def predict_batch(self, student_data_list):
        """
        Predict dropout risk for multiple students
        
        Args:
            student_data_list: List of dictionaries containing student information
            
        Returns:
            List of prediction results
        """
        results = []
        for student_data in student_data_list:
            result = self.predict_single(student_data)
            results.append(result)
        
        return results
    
    def _generate_recommendation(self, prediction, student_data, risk_score):
        """Generate recommendations based on prediction and student data"""
        if prediction == 0:  # Low risk
            return "Student is performing well. Continue monitoring progress."
        
        # High risk - generate specific recommendations
        recommendations = []
        
        if 'attendance' in student_data and student_data['attendance'] < 75:
            recommendations.append("Improve attendance - currently below 75%")
        
        if 'marks' in student_data and student_data['marks'] < 50:
            recommendations.append("Academic support needed - provide tutoring or extra classes")
        
        if 'income' in student_data and student_data['income'] == 'Low':
            recommendations.append("Consider financial assistance programs")
        
        if not recommendations:
            recommendations.append("Monitor closely and provide counseling support")
        
        return " | ".join(recommendations)
    
    def explain_prediction(self, student_data):
        """
        Get feature importance for a prediction
        
        Args:
            student_data: Dictionary containing student information
            
        Returns:
            Dictionary with feature importance
        """
        # Preprocess input
        X = self.preprocessor.preprocess_single_sample(student_data)
        X_tensor = torch.FloatTensor(X).to(self.device)
        
        # Get attention masks
        with torch.no_grad():
            _, _, attention_masks = self.model(X_tensor)
        
        # Aggregate attention across steps
        attention_importance = torch.stack(attention_masks).mean(dim=0).squeeze().cpu().numpy()
        
        # Create feature importance dictionary
        feature_importance = {
            feature: float(importance) 
            for feature, importance in zip(self.preprocessor.feature_names, attention_importance)
        }
        
        # Sort by importance
        feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
        
        return feature_importance


def example_usage():
    """Example usage of the predictor"""
    # Initialize predictor
    predictor = DropoutPredictor(
        model_path='../saved_models/best_model.pth',
        preprocessor_path='../saved_models/preprocessor.pkl'
    )
    
    # Example student data
    student_data = {
        'attendance': 65.5,
        'marks': 45.0,
        'income': 'Low',
        'gender': 'Male',
        'class': '8th',
        'parent_occupation': 'Farmer',
        'location': 'Rural'
    }
    
    # Make prediction
    result = predictor.predict_single(student_data)
    
    print("\nPrediction Result:")
    print(f"Dropout Risk: {result['dropout_risk']}")
    print(f"Risk Score: {result['risk_score']:.4f}")
    print(f"Confidence: {result['confidence']:.4f}")
    print(f"Recommendation: {result['recommendation']}")
    
    # Get feature importance
    importance = predictor.explain_prediction(student_data)
    print("\nFeature Importance:")
    for feature, imp in list(importance.items())[:5]:
        print(f"{feature}: {imp:.4f}")


if __name__ == "__main__":
    example_usage()
