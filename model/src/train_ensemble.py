"""
Train Ensemble: Decision Tree + Logistic Regression

Run once to generate  model/saved_models/sklearn_models.pkl

Usage (from repo root):
    cd model/src
    python train_ensemble.py
"""

import os
import sys
import json
import numpy as np

# Ensure model/src is on the path so relative imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_preprocessing import DropoutDataPreprocessor
from ensemble_model import SklearnEnsemble

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------
BASE_DIR             = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DATA_PATH            = os.path.join(BASE_DIR, "data", "raw", "student_data.csv")
PREPROCESSOR_PATH    = os.path.join(BASE_DIR, "saved_models", "preprocessor.pkl")
SKLEARN_MODELS_PATH  = os.path.join(BASE_DIR, "saved_models", "sklearn_models.pkl")
ENSEMBLE_METRICS_PATH = os.path.join(BASE_DIR, "saved_models", "ensemble_metrics.json")


def main():
    print("=" * 60)
    print("  Ensemble Training: Decision Tree + Logistic Regression")
    print("=" * 60)

    # ------------------------------------------------------------------
    # 1. Load & preprocess data
    #    Using the same DropoutDataPreprocessor so features are identical
    #    to what TabNet was trained on (same CSV + same random_state=42).
    # ------------------------------------------------------------------
    preprocessor = DropoutDataPreprocessor()
    X_train, X_test, y_train, y_test = preprocessor.prepare_data(DATA_PATH)

    print(f"\nDataset summary:")
    print(f"  Training samples : {len(X_train)}")
    print(f"  Testing  samples : {len(X_test)}")
    print(f"  Features         : {len(preprocessor.feature_names)}")
    print(f"  Feature names    : {preprocessor.feature_names}")
    print(f"  Class balance (train) - 0: {int(np.sum(y_train == 0))}, 1: {int(np.sum(y_train == 1))}")

    # ------------------------------------------------------------------
    # 2. Train
    # ------------------------------------------------------------------
    print()
    ensemble = SklearnEnsemble()
    ensemble.feature_names = preprocessor.feature_names
    ensemble.train(X_train, y_train)

    # ------------------------------------------------------------------
    # 3. Evaluate
    # ------------------------------------------------------------------
    metrics = ensemble.evaluate(X_test, y_test)

    print("\n" + "=" * 60)
    print("  Performance on Test Set")
    print("=" * 60)
    for model_name, m in metrics.items():
        print(f"\n  {model_name}:")
        print(f"    Accuracy  : {m['accuracy']:.4f}  ({m['accuracy']*100:.2f}%)")
        print(f"    Precision : {m['precision']:.4f}")
        print(f"    Recall    : {m['recall']:.4f}")
        print(f"    F1 Score  : {m['f1_score']:.4f}")

    # ------------------------------------------------------------------
    # 4. Save sklearn models
    # ------------------------------------------------------------------
    ensemble.save(SKLEARN_MODELS_PATH)

    # ------------------------------------------------------------------
    # 5. Save ensemble metrics
    # ------------------------------------------------------------------
    with open(ENSEMBLE_METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\n  Ensemble metrics saved to {ENSEMBLE_METRICS_PATH}")

    # ------------------------------------------------------------------
    # 6. Ensure preprocessor.pkl exists for serving predictions
    # ------------------------------------------------------------------
    if not os.path.exists(PREPROCESSOR_PATH):
        preprocessor.save_preprocessor(PREPROCESSOR_PATH)
        print(f"  Preprocessor saved to {PREPROCESSOR_PATH}")
    else:
        print(f"  Preprocessor already exists at {PREPROCESSOR_PATH} — not overwritten")

    print("\n" + "=" * 60)
    print("  Done! Files saved:")
    print(f"    {SKLEARN_MODELS_PATH}")
    print(f"    {ENSEMBLE_METRICS_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()
