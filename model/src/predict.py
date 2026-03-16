"""
Prediction Module for Student Dropout Risk

Ensemble: Decision Tree + Logistic Regression + TabNet (Majority Voting)
Explainability: SHAP (TreeExplainer for DT + LinearExplainer for LR, averaged)
"""

import os
import torch
import numpy as np
import joblib

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("Warning: SHAP not installed. Falling back to feature-importance for explanations.")

from tabnet_model import TabNetClassifier
from data_preprocessing import DropoutDataPreprocessor
from ensemble_model import SklearnEnsemble


class DropoutPredictor:
    """
    Ensemble predictor: Decision Tree + Logistic Regression + TabNet.
    Final decision by majority vote (2-of-3).
    Explains predictions using SHAP (DT + LR averaged).
    """

    def __init__(self, model_path, preprocessor_path, sklearn_models_path=None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # ------------------------------------------------------------------ #
        # Preprocessor
        # ------------------------------------------------------------------ #
        self.preprocessor = DropoutDataPreprocessor()
        self.preprocessor.load_preprocessor(preprocessor_path)

        # ------------------------------------------------------------------ #
        # TabNet model
        # ------------------------------------------------------------------ #
        input_dim = len(self.preprocessor.feature_names)
        self.tabnet = TabNetClassifier(
            input_dim=input_dim,
            output_dim=2,
            n_steps=3,
            n_d=8,
            n_a=8,
        )
        checkpoint = torch.load(model_path, map_location=self.device)
        self.tabnet.load_state_dict(checkpoint["model_state_dict"])
        self.tabnet.to(self.device)
        self.tabnet.eval()

        # Keep old attribute name for any external reference
        self.model = self.tabnet

        # ------------------------------------------------------------------ #
        # Sklearn ensemble (Decision Tree + Logistic Regression)
        # ------------------------------------------------------------------ #
        self.sklearn_ensemble = None
        if sklearn_models_path is None:
            sklearn_models_path = os.path.join(
                os.path.dirname(model_path), "sklearn_models.pkl"
            )
        if os.path.exists(sklearn_models_path):
            self.sklearn_ensemble = SklearnEnsemble()
            self.sklearn_ensemble.load(sklearn_models_path)
        else:
            print(
                f"Warning: Sklearn models not found at {sklearn_models_path}. "
                "Ensemble will use TabNet only."
            )

        mode = (
            "Ensemble (DT + LR + TabNet, majority vote)"
            if self.sklearn_ensemble
            else "TabNet only"
        )
        print(f"Predictor ready | device={self.device} | mode={mode}")

    # ---------------------------------------------------------------------- #
    # Internal helpers
    # ---------------------------------------------------------------------- #

    def _tabnet_predict(self, X_tensor):
        """Run TabNet forward pass, return (class_label, risk_proba)."""
        with torch.no_grad():
            output, _ = self.tabnet.forward_masks(X_tensor)
            probs = torch.softmax(output, dim=1)
            pred  = torch.argmax(probs, dim=1).item()
            risk  = probs[0][1].item()
        return pred, risk, probs

    def _majority_vote(self, dt_pred, lr_pred, tabnet_pred):
        """Return 1 (dropout) if at least 2 of 3 models vote yes."""
        return 1 if (int(dt_pred) + int(lr_pred) + int(tabnet_pred)) >= 2 else 0

    # ---------------------------------------------------------------------- #
    # Public prediction API
    # ---------------------------------------------------------------------- #

    def predict_single(self, student_data):
        """
        Predict dropout risk for a single student.
        Returns a dict with dropout_risk, risk_score, confidence,
        model_votes, and recommendation.
        """
        X        = self.preprocessor.preprocess_single_sample(student_data)
        X_tensor = torch.FloatTensor(X).to(self.device)

        tabnet_pred, tabnet_risk, _ = self._tabnet_predict(X_tensor)

        if self.sklearn_ensemble is not None:
            dt_preds, lr_preds   = self.sklearn_ensemble.predict(X)
            dt_probas, lr_probas = self.sklearn_ensemble.predict_proba(X)

            dt_pred  = int(dt_preds[0])
            lr_pred  = int(lr_preds[0])
            dt_proba = float(dt_probas[0])
            lr_proba = float(lr_probas[0])

            final_pred  = self._majority_vote(dt_pred, lr_pred, tabnet_pred)
            avg_risk    = (dt_proba + lr_proba + tabnet_risk) / 3.0

            model_votes = {
                "decision_tree": {
                    "prediction": "High" if dt_pred else "Low",
                    "confidence": round(dt_proba, 4),
                },
                "logistic_regression": {
                    "prediction": "High" if lr_pred else "Low",
                    "confidence": round(lr_proba, 4),
                },
                "tabnet": {
                    "prediction": "High" if tabnet_pred else "Low",
                    "confidence": round(tabnet_risk, 4),
                },
            }
        else:
            final_pred  = tabnet_pred
            avg_risk    = tabnet_risk
            model_votes = {
                "tabnet": {
                    "prediction": "High" if tabnet_pred else "Low",
                    "confidence": round(tabnet_risk, 4),
                }
            }

        return {
            "dropout_risk":  "High" if final_pred == 1 else "Low",
            "risk_score":    round(float(avg_risk), 4),
            "confidence":    round(float(avg_risk if final_pred == 1 else 1 - avg_risk), 4),
            "model_votes":   model_votes,
            "recommendation": self._generate_recommendation(final_pred, student_data, avg_risk),
        }

    def predict_batch(self, student_data_list):
        """Predict dropout risk for a list of students."""
        return [self.predict_single(s) for s in student_data_list]

    # ---------------------------------------------------------------------- #
    # SHAP Explainability
    # ---------------------------------------------------------------------- #

    def _get_shap_from_dt(self, X):
        """Return SHAP values (class-1 / dropout) from Decision Tree."""
        explainer = shap.TreeExplainer(self.sklearn_ensemble.dt_model)
        raw = explainer.shap_values(X)
        # sklearn binary tree → list [class0_array, class1_array]
        if isinstance(raw, list) and len(raw) == 2:
            return np.array(raw[1]).flatten()
        # newer SHAP may return 3-D array (samples, features, classes)
        arr = np.array(raw)
        if arr.ndim == 3:
            return arr[0, :, 1]
        return arr.flatten()

    def _get_shap_from_lr(self, X):
        """Return SHAP values (class-1 / dropout) from Logistic Regression."""
        background = (
            self.sklearn_ensemble.X_background
            if self.sklearn_ensemble.X_background is not None
            else X
        )
        explainer = shap.LinearExplainer(self.sklearn_ensemble.lr_model, background)
        raw = explainer.shap_values(X)
        # binary LR → single 2-D array (samples × features)
        if isinstance(raw, list) and len(raw) == 2:
            return np.array(raw[1]).flatten()
        arr = np.array(raw)
        if arr.ndim == 2:
            return arr[0]
        return arr.flatten()

    def explain_prediction(self, student_data):
        """
        Return SHAP-based feature importances for one student.

        Uses TreeExplainer (Decision Tree) and LinearExplainer (Logistic
        Regression) and averages their SHAP values.  Falls back to Decision
        Tree feature_importances_ or TabNet attention masks when SHAP is not
        available or fails.
        """
        X = self.preprocessor.preprocess_single_sample(student_data)
        feature_names = self.preprocessor.feature_names

        shap_vals = None
        explanation_type = "Feature Importance (fallback)"

        # ---- SHAP path (preferred) ---- #
        if SHAP_AVAILABLE and self.sklearn_ensemble is not None:
            contributions = []

            try:
                dt_shap = self._get_shap_from_dt(X)
                contributions.append(dt_shap)
            except Exception as e:
                print(f"DT SHAP failed: {e}")

            try:
                lr_shap = self._get_shap_from_lr(X)
                contributions.append(lr_shap)
            except Exception as e:
                print(f"LR SHAP failed: {e}")

            if contributions:
                shap_vals = np.mean(contributions, axis=0)
                explanation_type = (
                    "SHAP – DT + LR Average"
                    if len(contributions) == 2
                    else "SHAP – DT only" if len(contributions) == 1 else "SHAP"
                )

        # ---- Fallback: DT feature_importances_ ---- #
        if shap_vals is None and self.sklearn_ensemble is not None:
            shap_vals = self.sklearn_ensemble.dt_model.feature_importances_
            explanation_type = "Decision Tree Feature Importance"

        # ---- Fallback: TabNet attention masks ---- #
        if shap_vals is None:
            X_tensor = torch.FloatTensor(X).to(self.device)
            with torch.no_grad():
                _, _, masks = self.tabnet(X_tensor)
            if masks:
                shap_vals = torch.stack(masks).mean(dim=0).squeeze().cpu().numpy()
            else:
                shap_vals = np.ones(len(feature_names)) / len(feature_names)
            explanation_type = "TabNet Attention Masks"

        # ---- Build result dict ---- #
        feature_importance = {
            fname: float(shap_vals[i])
            for i, fname in enumerate(feature_names)
        }

        top_factors = sorted(
            [
                {
                    "feature":    k,
                    "importance": round(v, 4),
                    "impact":     "increases dropout risk" if v > 0 else "decreases dropout risk",
                }
                for k, v in feature_importance.items()
            ],
            key=lambda x: abs(x["importance"]),
            reverse=True,
        )

        return {
            "feature_importance": {k: round(v, 4) for k, v in feature_importance.items()},
            "top_factors":        top_factors,
            "explanation_type":   explanation_type,
        }

    # ---------------------------------------------------------------------- #
    # Internal: recommendation generator
    # ---------------------------------------------------------------------- #

    def _generate_recommendation(self, prediction, student_data, risk_score):
        if prediction == 0:
            return "Student is performing well. Continue monitoring progress."

        recs = []
        if "attendance" in student_data and float(student_data.get("attendance", 100)) < 75:
            recs.append("Improve attendance – currently below 75%")
        if "marks" in student_data and float(student_data.get("marks", 100)) < 50:
            recs.append("Academic support needed – provide tutoring or extra classes")
        if student_data.get("income") == "Low":
            recs.append("Consider financial assistance programmes")
        if not recs:
            recs.append("Monitor closely and provide counselling support")

        return " | ".join(recs)


# --------------------------------------------------------------------------- #
# Quick smoke-test
# --------------------------------------------------------------------------- #

def example_usage():
    predictor = DropoutPredictor(
        model_path="../saved_models/best_model.pth",
        preprocessor_path="../saved_models/preprocessor.pkl",
    )

    student = {
        "attendance": 45.0,
        "marks":      38.0,
        "income":     "Low",
        "gender":     "Male",
        "class":      "8th",
        "parent_occupation": "Farmer",
        "location":   "Rural",
    }

    result = predictor.predict_single(student)
    print("\n--- Prediction ---")
    print(f"Dropout Risk : {result['dropout_risk']}")
    print(f"Risk Score   : {result['risk_score']:.4f}")
    print(f"Confidence   : {result['confidence']:.4f}")
    print(f"Model Votes  : {result['model_votes']}")
    print(f"Recommendation: {result['recommendation']}")

    explanation = predictor.explain_prediction(student)
    print(f"\n--- Explanation ({explanation['explanation_type']}) ---")
    for factor in explanation["top_factors"]:
        print(f"  {factor['feature']:20s} {factor['importance']:+.4f}  ({factor['impact']})")


if __name__ == "__main__":
    example_usage()
