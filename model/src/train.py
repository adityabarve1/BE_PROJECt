"""
Training Script for TabNet Dropout Prediction Model
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import os
import json
from datetime import datetime

from tabnet_model import TabNetClassifier
from data_preprocessing import DropoutDataPreprocessor


class TabNetTrainer:
    """Training pipeline for TabNet model"""
    
    def __init__(self, model, device='cpu', learning_rate=0.001, lambda_sparse=0.001):
        self.model = model.to(device)
        self.device = device
        self.lambda_sparse = lambda_sparse
        
        self.optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        self.criterion = nn.CrossEntropyLoss()
        
        self.train_losses = []
        self.val_losses = []
        self.train_accuracies = []
        self.val_accuracies = []
        
    def train_epoch(self, train_loader):
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        all_preds = []
        all_labels = []
        
        for batch_X, batch_y in train_loader:
            batch_X = batch_X.to(self.device)
            batch_y = batch_y.to(self.device)
            
            self.optimizer.zero_grad()
            
            # Forward pass
            output, M_loss, _ = self.model(batch_X)
            
            # Compute loss
            loss = self.criterion(output, batch_y)
            loss += self.lambda_sparse * M_loss  # Add sparsity regularization
            
            # Backward pass
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            
            # Get predictions
            preds = torch.argmax(output, dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(batch_y.cpu().numpy())
        
        avg_loss = total_loss / len(train_loader)
        accuracy = accuracy_score(all_labels, all_preds)
        
        return avg_loss, accuracy
    
    def validate(self, val_loader):
        """Validate the model"""
        self.model.eval()
        total_loss = 0
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for batch_X, batch_y in val_loader:
                batch_X = batch_X.to(self.device)
                batch_y = batch_y.to(self.device)
                
                # Forward pass
                output, M_loss, _ = self.model(batch_X)
                
                # Compute loss
                loss = self.criterion(output, batch_y)
                loss += self.lambda_sparse * M_loss
                
                total_loss += loss.item()
                
                # Get predictions
                preds = torch.argmax(output, dim=1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(batch_y.cpu().numpy())
        
        avg_loss = total_loss / len(val_loader)
        accuracy = accuracy_score(all_labels, all_preds)
        
        return avg_loss, accuracy, all_preds, all_labels
    
    def train(self, train_loader, val_loader, epochs=50, early_stopping_patience=10):
        """Complete training loop"""
        best_val_loss = float('inf')
        patience_counter = 0
        
        print("Starting training...")
        print("-" * 60)
        
        for epoch in range(epochs):
            # Train
            train_loss, train_acc = self.train_epoch(train_loader)
            self.train_losses.append(train_loss)
            self.train_accuracies.append(train_acc)
            
            # Validate
            val_loss, val_acc, _, _ = self.validate(val_loader)
            self.val_losses.append(val_loss)
            self.val_accuracies.append(val_acc)
            
            # Print progress
            print(f"Epoch [{epoch+1}/{epochs}] | "
                  f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f} | "
                  f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f}")
            
            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                # Save best model
                self.save_checkpoint('best_model')
            else:
                patience_counter += 1
                
            if patience_counter >= early_stopping_patience:
                print(f"\nEarly stopping triggered after {epoch+1} epochs")
                break
        
        print("-" * 60)
        print("Training completed!")
    
    def evaluate(self, test_loader):
        """Evaluate model on test set"""
        _, _, all_preds, all_labels = self.validate(test_loader)
        
        # Calculate metrics
        accuracy = accuracy_score(all_labels, all_preds)
        precision = precision_score(all_labels, all_preds, average='binary')
        recall = recall_score(all_labels, all_preds, average='binary')
        f1 = f1_score(all_labels, all_preds, average='binary')
        cm = confusion_matrix(all_labels, all_preds)
        
        print("\n" + "="*60)
        print("TEST SET EVALUATION")
        print("="*60)
        print(f"Accuracy:  {accuracy:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall:    {recall:.4f}")
        print(f"F1 Score:  {f1:.4f}")
        print("\nConfusion Matrix:")
        print(cm)
        print("="*60)
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'confusion_matrix': cm.tolist()
        }
    
    def save_checkpoint(self, filename='model'):
        """Save model checkpoint"""
        checkpoint_dir = '../saved_models'
        os.makedirs(checkpoint_dir, exist_ok=True)
        
        filepath = os.path.join(checkpoint_dir, f'{filename}.pth')
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'train_losses': self.train_losses,
            'val_losses': self.val_losses,
            'train_accuracies': self.train_accuracies,
            'val_accuracies': self.val_accuracies
        }, filepath)
        print(f"\nModel saved to {filepath}")


def main():
    """Main training function"""
    # Set random seeds for reproducibility
    torch.manual_seed(42)
    np.random.seed(42)
    
    # Device configuration
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Load and preprocess data
    print("\nLoading and preprocessing data...")
    preprocessor = DropoutDataPreprocessor()
    
    # Use absolute path or path relative to current working directory
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, '../data/raw/student_data.csv')
    X_train, X_test, y_train, y_test = preprocessor.prepare_data(data_path)
    
    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    print(f"Number of features: {X_train.shape[1]}")
    
    # Save preprocessor
    preprocessor_path = os.path.join(script_dir, '../saved_models/preprocessor.pkl')
    os.makedirs(os.path.dirname(preprocessor_path), exist_ok=True)
    preprocessor.save_preprocessor(preprocessor_path)
    
    # Create data loaders
    train_dataset = TensorDataset(
        torch.FloatTensor(X_train),
        torch.LongTensor(y_train)
    )
    test_dataset = TensorDataset(
        torch.FloatTensor(X_test),
        torch.LongTensor(y_test)
    )
    
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)
    
    # Initialize model
    print("\nInitializing TabNet model...")
    model = TabNetClassifier(
        input_dim=X_train.shape[1],
        output_dim=2,  # Binary classification
        n_steps=3,
        n_d=8,
        n_a=8,
        n_shared=2,
        n_independent=2
    )
    
    # Initialize trainer
    trainer = TabNetTrainer(
        model=model,
        device=device,
        learning_rate=0.001,
        lambda_sparse=0.001
    )
    
    # Train model
    trainer.train(train_loader, test_loader, epochs=50, early_stopping_patience=10)
    
    # Load best model and evaluate
    print("\nLoading best model for final evaluation...")
    model_path = os.path.join(script_dir, '../saved_models/best_model.pth')
    checkpoint = torch.load(model_path)
    model.load_state_dict(checkpoint['model_state_dict'])
    
    # Evaluate on test set
    metrics = trainer.evaluate(test_loader)
    
    # Save metrics
    metrics_path = '../saved_models/metrics.json'
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=4)
    print(f"\nMetrics saved to {metrics_path}")


if __name__ == "__main__":
    main()
