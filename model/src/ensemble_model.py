"""
Sklearn Ensemble Model for Student Dropout Prediction
Combines Decision Tree + Logistic Regression with majority voting alongside TabNet.
"""

import numpy as np
import joblib
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score


class SklearnEnsemble:
    """Decision Tree + Logistic Regression ensemble component."""

    def __init__(self):
        self.dt_model = DecisionTreeClassifier(
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
        )
        self.lr_model = LogisticRegression(
            max_iter=1000,
            C=1.0,
            solver='lbfgs',
            random_state=42,
        )
        self.feature_names = []
        # Mean of training data used as background for SHAP LinearExplainer
        self.X_background = None

    # ------------------------------------------------------------------
    # Training
    # ------------------------------------------------------------------

    def train(self, X_train, y_train):
        """Fit both sklearn models on training data."""
        print("Training Decision Tree...")
        self.dt_model.fit(X_train, y_train)
        print(f"  -> Depth used: {self.dt_model.get_depth()}")

        print("Training Logistic Regression...")
        self.lr_model.fit(X_train, y_train)
        print(f"  -> Iterations: {self.lr_model.n_iter_[0]}")

        # Store mean as SHAP background (shape: 1 × n_features)
        self.X_background = np.mean(X_train, axis=0, keepdims=True)

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------

    def predict(self, X):
        """Return (dt_pred_array, lr_pred_array) with class labels."""
        return self.dt_model.predict(X), self.lr_model.predict(X)

    def predict_proba(self, X):
        """Return (dt_proba_1, lr_proba_1) – probability of class 1 (dropout)."""
        return (
            self.dt_model.predict_proba(X)[:, 1],
            self.lr_model.predict_proba(X)[:, 1],
        )

    # ------------------------------------------------------------------
    # Evaluation
    # ------------------------------------------------------------------

    def evaluate(self, X_test, y_test):
        """Return per-model classification metrics dict."""
        metrics = {}
        for name, preds in [
            ("Decision Tree", self.dt_model.predict(X_test)),
            ("Logistic Regression", self.lr_model.predict(X_test)),
        ]:
            metrics[name] = {
                "accuracy":  round(float(accuracy_score(y_test, preds)), 4),
                "precision": round(float(precision_score(y_test, preds, average="binary", zero_division=0)), 4),
                "recall":    round(float(recall_score(y_test, preds, average="binary", zero_division=0)), 4),
                "f1_score":  round(float(f1_score(y_test, preds, average="binary", zero_division=0)), 4),
            }
        return metrics

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, filepath):
        joblib.dump(
            {
                "dt_model":    self.dt_model,
                "lr_model":    self.lr_model,
                "feature_names": self.feature_names,
                "X_background":  self.X_background,
            },
            filepath,
        )
        print(f"Sklearn ensemble saved to {filepath}")

    def load(self, filepath):
        data = joblib.load(filepath)
        self.dt_model     = data["dt_model"]
        self.lr_model     = data["lr_model"]
        self.feature_names = data.get("feature_names", [])
        self.X_background  = data.get("X_background", None)
        print(f"Sklearn ensemble loaded from {filepath}")
