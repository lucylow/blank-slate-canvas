# Edge Inference Guide

This document describes how to deploy PitWall AI models to edge devices (e.g., NVIDIA Jetson) for real-time inference.

## Overview

Edge inference enables low-latency predictions directly on the vehicle or track-side hardware, reducing dependency on cloud connectivity.

## Model Export

### 1. Export to ONNX

For PyTorch models:
```python
import torch
import torch.onnx

# Load your trained model
model = YourModel()
model.load_state_dict(torch.load("model.pth"))
model.eval()

# Create dummy input
dummy_input = torch.randn(1, input_size)

# Export to ONNX
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    opset_version=12,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch'}, 'output': {0: 'batch'}}
)
```

For scikit-learn models, use `skl2onnx`:
```python
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

initial_type = [('float_input', FloatTensorType([None, n_features]))]
onnx_model = convert_sklearn(model, initial_types=initial_type)
with open("model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())
```

### 2. Quantization (Optional)

Quantize the model to reduce size and improve inference speed:

```bash
# Using onnxruntime quantization
python -m onnxruntime.quantization.quantize \
    --input model.onnx \
    --output model_quant.onnx \
    --quantization_mode QLinearOps
```

Or use uint8 quantization:
```bash
python -m onnxruntime_tools.convert_float_to_uint8 \
    --input model.onnx \
    --output model_quant.onnx
```

## Deployment to Jetson

### 1. Setup Environment

On Jetson device:
```bash
# Install onnxruntime (CPU)
pip install onnxruntime

# Or for GPU acceleration
pip install onnxruntime-gpu

# For TensorRT optimization
pip install nvidia-tensorrt
```

### 2. Test Inference

```python
import onnxruntime as ort
import numpy as np

# Load model
session = ort.InferenceSession("model.onnx")

# Prepare input
input_data = np.array([[feature1, feature2, ...]], dtype=np.float32)

# Run inference
outputs = session.run(None, {"input": input_data})
prediction = outputs[0]
```

### 3. TensorRT Optimization (Optional)

For maximum performance on Jetson:
```python
import tensorrt as trt

# Convert ONNX to TensorRT engine
# (Use trtexec command-line tool or TensorRT Python API)
```

## Expected Latency

- **Jetson Nano**: 30-50ms for small models (TCN/LSTM)
- **Jetson TX2**: 15-30ms
- **Jetson Xavier**: <10ms
- **Jetson Orin**: <5ms

Actual latency depends on:
- Model complexity
- Input size
- Batch size
- TensorRT optimization

## Docker Runtime

Use NVIDIA container runtime for GPU support:

```dockerfile
FROM nvcr.io/nvidia/l4t-pytorch:r35.2.0-pth2.0-py3

WORKDIR /app
COPY model.onnx .
COPY inference.py .

RUN pip install onnxruntime-gpu

CMD ["python", "inference.py"]
```

Run with:
```bash
docker run --runtime=nvidia --rm your-image
```

## Integration with PitWall

1. Deploy model to edge device
2. Configure edge device to send predictions to PitWall backend via MQTT/WebSocket
3. Backend aggregates edge predictions with cloud predictions for ensemble

## References

- [ONNX Runtime](https://onnxruntime.ai/)
- [NVIDIA Jetson Documentation](https://developer.nvidia.com/embedded/jetson)
- [TensorRT](https://developer.nvidia.com/tensorrt)


