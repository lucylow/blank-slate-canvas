# scripts/train_ae.py

"""
Train a small LSTM autoencoder on normal windows extracted from /mnt/data/sebring.zip
Saves model to models/seq_ae.h5
"""

import os
import zipfile
import json
import numpy as np
import pandas as pd
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, RepeatVector, TimeDistributed, Dense
from tensorflow.keras.callbacks import ModelCheckpoint
from pathlib import Path

ZIP_PATH = "/mnt/data/sebring.zip"   # <-- use your uploaded file (developer note: path used as file:// in UI)
OUT_MODEL = "models/seq_ae.h5"
FEATURE_COLUMNS = ["speed", "accx", "accy", "brake_pressure", "tire_temp"]  # adapt to your CSV


def extract_csv_samples(zip_path, max_samples=200000):
    # naive: choose largest csv from zip and load sample rows
    with zipfile.ZipFile(zip_path, 'r') as zf:
        cand = [n for n in zf.namelist() if n.lower().endswith('.csv')]
        if len(cand) == 0:
            raise FileNotFoundError("No CSV in zip")

        # pick largest
        infos = [(zf.getinfo(n).file_size, n) for n in cand]
        infos.sort(reverse=True)
        chosen = infos[0][1]
        print("Using", chosen)

        with zf.open(chosen) as fh:
            df = pd.read_csv(fh, low_memory=True)

    # keep only feature columns that exist
    fcols = [c for c in FEATURE_COLUMNS if c in df.columns]
    df = df[fcols].fillna(method='ffill').fillna(0)

    # build overlapping windows
    seq_len = 32
    X = []
    for i in range(0, max(0, len(df) - seq_len), seq_len // 2):
        win = df.iloc[i:i + seq_len].to_numpy()
        if win.shape[0] == seq_len:
            X.append(win)

    X = np.stack(X)
    return X


def build_model(timesteps, features, latent=64):
    inputs = Input(shape=(timesteps, features))
    x = LSTM(128, activation='relu', return_sequences=False)(inputs)
    x = Dense(latent, activation='relu')(x)
    x = RepeatVector(timesteps)(x)
    x = LSTM(128, activation='relu', return_sequences=True)(x)
    outputs = TimeDistributed(Dense(features))(x)
    model = Model(inputs, outputs)
    model.compile(optimizer='adam', loss='mse')
    return model


def main():
    Path("models").mkdir(exist_ok=True)
    X = extract_csv_samples(ZIP_PATH)
    print("Prepared windows:", X.shape)
    timesteps, features = X.shape[1], X.shape[2]
    model = build_model(timesteps, features)
    ckpt = ModelCheckpoint(OUT_MODEL, save_best_only=True, monitor='loss')
    model.fit(X, X, epochs=20, batch_size=64, callbacks=[ckpt])
    model.save(OUT_MODEL)
    print("Saved AE model to", OUT_MODEL)


if __name__ == "__main__":
    main()



