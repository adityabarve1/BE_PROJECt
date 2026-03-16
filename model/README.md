# Dropout Prediction Model

Custom TabNet implementation for predicting student dropout risk in Jilha Parishad schools.

## Project Structure

```
model/
├── data/
│   ├── raw/              # Raw dataset
│   └── processed/        # Processed data
├── saved_models/         # Trained models and preprocessors
├── notebooks/            # Jupyter notebooks for experiments
├── src/
│   ├── tabnet_model.py          # Custom TabNet implementation
│   ├── data_preprocessing.py    # Data preprocessing pipeline
│   ├── train.py                 # Training script
│   └── predict.py               # Prediction module
└── requirements.txt
```

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Generate sample dataset:
```bash
cd src
python data_preprocessing.py
```

3. Train the model:
```bash
python train.py
```

4. Make predictions:
```bash
python predict.py
```

## Features

- **Custom TabNet Architecture**: Attention-based tabular learning
- **Feature Importance**: Interpretable predictions with attention masks
- **Data Preprocessing**: Complete pipeline for handling categorical and numerical data
- **Model Persistence**: Save and load trained models
- **Batch Prediction**: Support for single and batch predictions

## Dataset Features

- Student Name
- Roll Number
- Attendance (%)
- Marks
- Family Income (Low/Medium/High)
- Gender
- Class
- Parent Occupation
- Location (Rural/Urban/City)
- Dropout Risk (Target)

## Model Architecture

TabNet with:
- 3 decision steps
- Ghost Batch Normalization
- Attentive Transformer for feature selection
- Sparsity regularization

## Usage

See `predict.py` for example usage of the trained model.
