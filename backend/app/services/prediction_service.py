"""
Prediction service for dropout risk assessment
"""

import sys
import os

# Add model path to system path
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'model', 'src')
sys.path.append(MODEL_PATH)

from predict import DropoutPredictor
from config import Config


class PredictionService:
    """Service for handling dropout predictions"""
    
    def __init__(self):
        """Initialize the prediction service with the trained model"""
        try:
            self.predictor = DropoutPredictor(
                model_path=Config.MODEL_PATH,
                preprocessor_path=Config.PREPROCESSOR_PATH
            )
            print("Prediction service initialized successfully")
        except Exception as e:
            print(f"Error initializing prediction service: {e}")
            self.predictor = None
    
    def predict(self, student_data):
        """
        Predict dropout risk for a single student
        
        Args:
            student_data: Dictionary containing student information
            
        Returns:
            Dictionary with prediction results
        """
        if not self.predictor:
            raise Exception("Prediction model not initialized")
        
        return self.predictor.predict_single(student_data)
    
    def predict_batch(self, student_data_list):
        """
        Predict dropout risk for multiple students
        
        Args:
            student_data_list: List of dictionaries containing student information
            
        Returns:
            List of prediction results
        """
        if not self.predictor:
            raise Exception("Prediction model not initialized")
        
        return self.predictor.predict_batch(student_data_list)
    
    def explain(self, student_data):
        """
        Get feature importance for a prediction
        
        Args:
            student_data: Dictionary containing student information
            
        Returns:
            Dictionary with feature importance
        """
        if not self.predictor:
            raise Exception("Prediction model not initialized")
        
        return self.predictor.explain_prediction(student_data)
