"""
Simple Residual TCN model (PyTorch) for sequence residual prediction.
This file defines a compact TCN that can be trained on sliding-window sequences of aggregated features.

Save as: app/models/tcn_residual.py
"""
import torch
import torch.nn as nn


class TCNBlock(nn.Module):
    def __init__(self, in_ch, out_ch, kernel_size=3, dilation=1):
        super().__init__()
        padding = dilation * (kernel_size - 1) // 2
        self.conv = nn.Conv1d(in_ch, out_ch, kernel_size, padding=padding, dilation=dilation)
        self.bn = nn.BatchNorm1d(out_ch)
        self.act = nn.ReLU()
    
    def forward(self, x):
        return self.act(self.bn(self.conv(x)))


class ResidualTCN(nn.Module):
    def __init__(self, in_channels, hidden=64, levels=4, kernel_size=3):
        """
        in_channels: number of feature channels
        hidden: hidden channel size
        levels: number of TCN blocks (increasing dilation)
        """
        super().__init__()
        blocks = []
        for i in range(levels):
            d = 2 ** i
            blocks.append(TCNBlock(in_channels if i==0 else hidden, hidden, kernel_size=kernel_size, dilation=d))
        self.net = nn.Sequential(*blocks)
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.head = nn.Linear(hidden, 1)  # predict residual (scalar per window)
    
    def forward(self, x):
        # expects x shape (B, T, C)
        b, t, c = x.shape
        x = x.permute(0,2,1)   # -> (B, C, T) for conv1d
        h = self.net(x)        # (B, hidden, T)
        h = self.pool(h).squeeze(-1)  # (B, hidden)
        out = self.head(h).squeeze(-1)
        return out

