# NewsLabs NLP: Category Classification Technical Report

This document provides a technical overview of the Natural Language Processing (NLP) system used in NewsLabs for article category classification. It serves as an academic proof of the model's design, training, and implementation.

## 1. Methodology

### 1.1 Model Selection
The classification system employs a **Logistic Regression** model trained on **TF-IDF** (Term Frequency-Inverse Document Frequency) features. This architecture was chosen for several reasons:
- **Interpretability**: Logistic Regression coefficients provide clear insights into which words (features) contribute to a specific classification.
- **Performance**: Given the text-heavy nature of news headlines, linear models with TF-IDF features often perform comparably to deep learning models while being significantly faster.
- **Portability**: The model can be represented as a simple matrix of coefficients and a vocabulary map, enabling zero-dependency inference in pure TypeScript.

> [!NOTE]
> **Terminology Clarification**: While it is called "Logistic Regression," it is a **classification** algorithm. The name "Regression" refers to the fact that the model initially predicts a continuous real-valued "score" (the log-odds), which is then mapped to a discrete probability using the Softmax function.

### 1.2 The Mathematical Bridge
To explain to an academic audience why we use a "Regression" model for "Classification," we look at the two-step process:

1. **The Regression Step**: For each class $k$, we calculate a linear score $z_k$ based on the input features $x$ (TF-IDF weights):
   $$z_k = \sum_{i=1}^{n} w_{ki}x_i + b_k$$
   This is a standard linear regression calculation.

2. **The Classification Step**: To convert these "regression scores" into a valid probability distribution where all values sum to 1, we apply the **Softmax Function**:
   $$P(y=k|x) = \frac{e^{z_k}}{\sum_{j=1}^{K} e^{z_j}}$$
   The class with the highest probability $P$ is chosen as the final category.

- **Normalization**: L2 normalization is applied to feature vectors to ensure consistency across varying article lengths.

## 2. Dataset and Preprocessing

### 2.1 The Momentum Dataset
The model is trained on the `momentum_news_data.csv` dataset, which contains tens of thousands of professionally labeled news articles.

### 2.2 Category Schema
We map original dataset labels to a refined 9-category schema:
- Technology
- Business & Finance
- World Affairs
- Science & Space
- Health
- Sports
- Entertainment
- Climate & Environment
- General

### 2.3 Science & Space Heuristic
To improve precision, articles originally labeled as "Technology & Science" are passed through a keyword heuristic filter (checking for terms like *NASA, SpaceX, quantum, physics*) to determine if they belong in **Technology** or **Science & Space**.

## 3. Implementation: "Zero-Dependency" Inference

A key innovation of the NewsLabs NLP system is its **pure-TypeScript inference engine**. 

### 3.1 The Export Process
During training (Python), the model's parameters are exported to a JSON artifact (`nlp_model.json`):
1. **Vocabulary**: A map of strings to feature indices.
2. **IDF Weights**: A vector of inverse document frequency values.
3. **Coefficients**: A weight matrix of shape `(n_classes, n_features)`.
4. **Intercepts**: A bias vector for each class.

### 3.2 The TypeScript Inference
The `NlpService` in `server/src/services/nlp.ts` loads this JSON and performs the following steps:
1. **Tokenization**: Cleans and splits input text into unigrams and bigrams.
2. **TF-IDF Transformation**: Converts tokens into a sparse feature vector using the loaded vocabulary and IDF weights.
3. **LogReg Prediction**: Calculates logits via a dot product of the feature vector and the coefficient matrix:
   $$\text{logits} = X \cdot W^T + b$$
4. **Softmax**: Converts logits into probabilities.

This approach eliminates the need for a Python runtime, specialized ML libraries (like TensorFlow.js), or external API calls during article ingestion, resulting in sub-millisecond classification times.

## 4. Evaluation Metrics

The model achieves the following performance on a held-out test set (15% split):

| Metric | Score |
| :--- | :--- |
| **Accuracy** | ~79% |
| **F1-Score (Macro)** | ~0.84 |
| **Inference Latency** | < 1ms |

Detailed per-category metrics and confusion matrices can be found in the [Jupyter Notebook](file:///c:/Projects/NewsLabs/newslabs/docs/nlp_classification_proof.ipynb).
