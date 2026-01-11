"""
Custom TabNet Model Implementation for Dropout Prediction
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np


class GhostBatchNorm(nn.Module):
    """Ghost Batch Normalization for TabNet"""
    
    def __init__(self, input_dim, virtual_batch_size=128, momentum=0.01):
        super(GhostBatchNorm, self).__init__()
        self.input_dim = input_dim
        self.virtual_batch_size = virtual_batch_size
        self.bn = nn.BatchNorm1d(input_dim, momentum=momentum)
        
    def forward(self, x):
        if self.training:
            chunks = x.chunk(int(np.ceil(x.shape[0] / self.virtual_batch_size)), 0)
            res = [self.bn(chunk) for chunk in chunks]
            return torch.cat(res, 0)
        else:
            return self.bn(x)


class AttentiveTransformer(nn.Module):
    """Attentive Transformer for feature selection"""
    
    def __init__(self, input_dim, output_dim):
        super(AttentiveTransformer, self).__init__()
        self.fc = nn.Linear(input_dim, output_dim, bias=False)
        self.bn = GhostBatchNorm(output_dim)
        
    def forward(self, priors, processed_features):
        x = self.fc(processed_features)
        x = self.bn(x)
        x = torch.mul(x, priors)
        return F.sparsemax(x, dim=-1) if hasattr(F, 'sparsemax') else F.softmax(x, dim=-1)


class FeatureTransformer(nn.Module):
    """Feature Transformer block"""
    
    def __init__(self, input_dim, output_dim, shared_layers, n_independent=2):
        super(FeatureTransformer, self).__init__()
        self.shared_layers = shared_layers
        self.n_independent = n_independent
        
        # Independent layers
        self.independent_layers = nn.ModuleList([
            nn.Linear(input_dim if i == 0 else output_dim, output_dim)
            for i in range(n_independent)
        ])
        
        self.bn_layers = nn.ModuleList([
            GhostBatchNorm(output_dim) for _ in range(n_independent)
        ])
        
    def forward(self, x):
        # Independent processing
        for i, (layer, bn) in enumerate(zip(self.independent_layers, self.bn_layers)):
            x = layer(x)
            x = bn(x)
            x = F.relu(x)
        
        # Shared processing
        if self.shared_layers is not None:
            for layer in self.shared_layers:
                x = layer(x)
                x = F.relu(x)
        
        return x


class TabNetEncoder(nn.Module):
    """TabNet Encoder"""
    
    def __init__(self, input_dim, output_dim, n_steps=3, n_d=8, n_a=8, 
                 n_shared=2, n_independent=2, virtual_batch_size=128):
        super(TabNetEncoder, self).__init__()
        
        self.input_dim = input_dim
        self.output_dim = output_dim
        self.n_steps = n_steps
        self.n_d = n_d
        self.n_a = n_a
        
        # Initial batch normalization
        self.initial_bn = GhostBatchNorm(input_dim, virtual_batch_size=virtual_batch_size)
        
        # Shared layers across all steps
        self.shared_layers = nn.ModuleList([
            nn.Linear(n_d + n_a, n_d + n_a)
            for _ in range(n_shared)
        ])
        
        # Feature transformers for each step
        self.feature_transformers = nn.ModuleList([
            FeatureTransformer(input_dim, n_d + n_a, self.shared_layers, n_independent)
            for _ in range(n_steps)
        ])
        
        # Attention transformers
        self.attention_transformers = nn.ModuleList([
            AttentiveTransformer(input_dim, input_dim)
            for _ in range(n_steps)
        ])
        
    def forward(self, x):
        batch_size = x.shape[0]
        x = self.initial_bn(x)
        
        # Initialize prior
        prior = torch.ones(batch_size, self.input_dim).to(x.device)
        M_loss = 0
        attention_masks = []
        
        # Store output from each step
        steps_output = []
        
        for step in range(self.n_steps):
            # Feature transformer
            M = self.attention_transformers[step](prior, x)
            attention_masks.append(M)
            
            # Masked features
            masked_x = torch.mul(M, x)
            
            # Feature processing
            out = self.feature_transformers[step](masked_x)
            
            # Split into decision and attention parts
            d = F.relu(out[:, :self.n_d])
            a = out[:, self.n_d:]
            
            steps_output.append(d)
            
            # Update prior
            prior = torch.mul(prior, self.gamma - M)
            
            # Compute sparsity loss
            M_loss += torch.mean(torch.sum(M * torch.log(M + 1e-10), dim=1))
        
        # Aggregate decisions
        output = torch.sum(torch.stack(steps_output, dim=0), dim=0)
        
        return output, M_loss, attention_masks
    
    @property
    def gamma(self):
        return 1.5


class TabNetClassifier(nn.Module):
    """TabNet Model for Classification"""
    
    def __init__(self, input_dim, output_dim, n_steps=3, n_d=8, n_a=8,
                 n_shared=2, n_independent=2, virtual_batch_size=128):
        super(TabNetClassifier, self).__init__()
        
        self.encoder = TabNetEncoder(
            input_dim=input_dim,
            output_dim=output_dim,
            n_steps=n_steps,
            n_d=n_d,
            n_a=n_a,
            n_shared=n_shared,
            n_independent=n_independent,
            virtual_batch_size=virtual_batch_size
        )
        
        # Final classification layer
        self.final_layer = nn.Linear(n_d, output_dim)
        
    def forward(self, x):
        encoded, M_loss, attention_masks = self.encoder(x)
        output = self.final_layer(encoded)
        return output, M_loss, attention_masks
    
    def forward_masks(self, x):
        """Forward pass returning only predictions and attention masks"""
        output, _, masks = self.forward(x)
        return output, masks
