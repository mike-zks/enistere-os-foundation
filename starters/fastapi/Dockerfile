FROM python:3.14-slim
WORKDIR /app
COPY requirements.runtime.lock .
RUN python -m pip install --no-cache-dir -r requirements.runtime.lock
COPY app app
USER 65532:65532
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
