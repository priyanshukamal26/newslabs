"""
NewsLabs NLP Training Script
============================
Trains a TF-IDF + Logistic Regression news classifier on the Momentum dataset.
Exports model artifacts as JSON for zero-dependency TypeScript inference.

Usage:
    python train_nlp.py                         # uses default paths
    python train_nlp.py --csv /path/to/data.csv # custom CSV path
    python train_nlp.py --out /path/to/out.json # custom output path

Output:
    nlp_model.json  —  TF-IDF vocab + IDF weights + LogReg coefficients
    nlp_meta.json   —  training metadata (accuracy, label list, timestamp)
"""

import sys
import os
import json
import argparse
import csv
import math
import re
from datetime import datetime, timezone
from collections import Counter

# Force UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── Check and import ML dependencies ──────────────────────────────────────────
try:
    import numpy as np
    import pandas as pd
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, accuracy_score
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.preprocessing import LabelEncoder
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    print("Install with: pip install scikit-learn numpy pandas")
    sys.exit(1)

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.dirname(SCRIPT_DIR)
PROJECT_ROOT = os.path.dirname(os.path.dirname(SERVER_DIR))

DEFAULT_CSV = os.path.join(PROJECT_ROOT, "datasets", "momentum_news_data.csv")
DEFAULT_OUT_DIR = os.path.join(SERVER_DIR, "data")
DEFAULT_MODEL_OUT = os.path.join(DEFAULT_OUT_DIR, "nlp_model.json")
DEFAULT_META_OUT = os.path.join(DEFAULT_OUT_DIR, "nlp_meta.json")

# ── Category mapping ───────────────────────────────────────────────────────────
# Maps Momentum dataset labels → final 9-category schema

FINAL_CATEGORIES = [
    "Technology",
    "Business & Finance",
    "World Affairs",
    "Science & Space",
    "Health",
    "Sports",
    "Entertainment",
    "Climate & Environment",
    "General",
]

# Momentum label → base target category
LABEL_MAP = {
    "Technology & Science":  None,           # split by keyword heuristics below
    "Business & Economy":    "Business & Finance",
    "Politics & Government": "World Affairs",
    "Sports":                "Sports",
    "Entertainment & Culture": "Entertainment",
    "Society & Lifestyle":   "General",
    "Crime & Law":           "World Affairs",
    "Environment & Climate": "Climate & Environment",
    "Health & Medicine":     "Health",
    "Education":             "General",
}

# Keywords that push "Technology & Science" → "Science & Space"
SCIENCE_SPACE_SIGNALS = {
    "space", "nasa", "spacex", "rocket", "satellite", "mars", "moon", "orbit",
    "astronaut", "galaxy", "asteroid", "launch", "cosmic", "starship", "isro",
    "chandrayaan", "jwst", "james webb", "hubble", "black hole", "supernova",
    "comet", "solar system", "exoplanet", "iss", "spacewalk", "lunar",
    "physics", "chemistry", "biology", "genome", "dna", "evolution",
    "experiment", "laboratory", "scientist", "quantum", "molecule", "fossil",
    "species", "organism", "neuroscience", "gene", "protein", "bacteria",
    "virus", "enzyme", "particle", "radiation", "element", "research study",
    "new research", "scientists found", "researchers discovered",
}

def classify_tech_vs_science(title: str) -> str:
    """Split 'Technology & Science' into Technology or Science & Space."""
    tl = title.lower()
    for signal in SCIENCE_SPACE_SIGNALS:
        if signal in tl:
            return "Science & Space"
    return "Technology"

def map_label(row) -> str:
    raw = str(row.get("topic", "")).strip()
    if raw == "Technology & Science":
        return classify_tech_vs_science(str(row.get("title", "")))
    return LABEL_MAP.get(raw, "General")

# ── Text cleaning ──────────────────────────────────────────────────────────────
def clean_text(text: str) -> str:
    if not text or not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s\-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

# ── Export helpers ─────────────────────────────────────────────────────────────
def export_model_json(pipeline: Pipeline, classes: list, out_path: str):
    """
    Export TF-IDF vectorizer + LogReg classifier as a JSON artifact
    that can be loaded and used in TypeScript without any Python dependency.
    
    Format:
    {
      "vocab": { word: feature_index },
      "idf": [ float, ... ],        # idf_ weights per feature
      "coef": [ [float...], ... ],  # shape: (n_classes, n_features)
      "intercept": [ float, ... ],  # shape: (n_classes,)
      "classes": [ str, ... ],      # label list
      "norm": "l2"                  # TF-IDF sublinear_tf, norm setting
    }
    """
    tfidf: TfidfVectorizer = pipeline.named_steps["tfidf"]
    clf: LogisticRegression = pipeline.named_steps["clf"]

    vocab = tfidf.vocabulary_                  # dict word -> index
    idf = tfidf.idf_.tolist()                  # list of floats
    coef = clf.coef_.tolist()                  # list of lists
    intercept = clf.intercept_.tolist()        # list of floats

    artifact = {
        "vocab": vocab,
        "idf": idf,
        "coef": coef,
        "intercept": intercept,
        "classes": list(classes),
        "sublinear_tf": True,
        "norm": "l2",
        "max_features": len(vocab),
    }

    class NumpyEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, np.integer):
                return int(obj)
            if isinstance(obj, np.floating):
                return float(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            return super().default(obj)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(artifact, f, separators=(",", ":"), cls=NumpyEncoder)

    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"  [✓] Model exported → {out_path} ({size_mb:.2f} MB)")


def export_meta_json(classes, accuracy_main, accuracy_nb, label_counts, out_path: str):
    meta = {
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "categories": classes,
        "accuracy": round(accuracy_main, 4),
        "naiveBayesAccuracy": round(accuracy_nb, 4),
        "labelCounts": label_counts,
        "modelType": "tfidf_logreg",
        "version": 1,
    }
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"  [✓] Metadata exported → {out_path}")


# ── Main training pipeline ─────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Train NewsLabs NLP classifier")
    parser.add_argument("--csv", default=DEFAULT_CSV, help="Path to momentum_news_data.csv")
    parser.add_argument("--out", default=DEFAULT_MODEL_OUT, help="Output path for nlp_model.json")
    parser.add_argument("--meta", default=DEFAULT_META_OUT, help="Output path for nlp_meta.json")
    parser.add_argument("--max-features", type=int, default=50000, help="Max TF-IDF vocabulary size")
    parser.add_argument("--test-size", type=float, default=0.15, help="Fraction for test split")
    parser.add_argument("--sample", type=int, default=0, help="Subsample N rows for quick tests (0=all)")
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"  NewsLabs NLP Training Script")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    # ── 1. Load dataset ──────────────────────────────────────────────────
    print(f"[1/5] Loading dataset from: {args.csv}")
    if not os.path.exists(args.csv):
        print(f"  [ERROR] File not found: {args.csv}")
        sys.exit(1)

    df = pd.read_csv(args.csv, encoding="utf-8", on_bad_lines="skip")
    print(f"  Loaded {len(df):,} rows. Columns: {list(df.columns)}")

    if args.sample > 0:
        df = df.sample(n=min(args.sample, len(df)), random_state=42)
        print(f"  Subsampled to {len(df):,} rows")

    # ── 2. Map labels ────────────────────────────────────────────────────
    print(f"\n[2/5] Mapping labels to 9-category schema...")
    df["label"] = df.apply(map_label, axis=1)
    df["text"] = df["title"].apply(clean_text)

    # Drop empty texts
    df = df[df["text"].str.len() > 5].reset_index(drop=True)

    label_counts = df["label"].value_counts().to_dict()
    print(f"  Label distribution:")
    for cat in FINAL_CATEGORIES:
        count = label_counts.get(cat, 0)
        bar = "#" * min(30, count // 200)
        print(f"    {cat:<25} {count:>6,}  {bar}")
    print(f"  Total usable samples: {len(df):,}")

    # ── 3. Train/test split ──────────────────────────────────────────────
    print(f"\n[3/5] Splitting data (test_size={args.test_size})...")
    X_train, X_test, y_train, y_test = train_test_split(
        df["text"].values,
        df["label"].values,
        test_size=args.test_size,
        random_state=42,
        stratify=df["label"].values,
    )
    print(f"  Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    # ── 4. Train models ──────────────────────────────────────────────────
    print(f"\n[4/5] Training TF-IDF + Logistic Regression...")

    pipeline_lr = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=args.max_features,
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=2,
            norm="l2",
            analyzer="word",
            strip_accents="unicode",
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            C=5.0,
            solver="lbfgs",
            class_weight="balanced",
            n_jobs=-1,
        )),
    ])

    pipeline_lr.fit(X_train, y_train)
    y_pred_lr = pipeline_lr.predict(X_test)
    acc_lr = accuracy_score(y_test, y_pred_lr)
    print(f"  LogReg Accuracy: {acc_lr:.4f} ({acc_lr*100:.1f}%)")

    print(f"\n  Training Naive Bayes baseline...")
    pipeline_nb = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=args.max_features,
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=2,
            norm="l2",
        )),
        ("clf", MultinomialNB(alpha=0.1)),
    ])

    # NB needs non-negative input; use a separate vectorizer without l2 norm
    pipeline_nb_raw = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=args.max_features,
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=2,
        )),
        ("clf", MultinomialNB(alpha=0.1)),
    ])
    pipeline_nb_raw.fit(X_train, y_train)
    y_pred_nb = pipeline_nb_raw.predict(X_test)
    acc_nb = accuracy_score(y_test, y_pred_nb)
    print(f"  NaiveBayes Accuracy: {acc_nb:.4f} ({acc_nb*100:.1f}%)")

    print(f"\n  Classification Report (LogReg):")
    classes_sorted = sorted(set(df["label"].values))
    report = classification_report(y_test, y_pred_lr, labels=classes_sorted, zero_division=0)
    for line in report.split("\n"):
        print(f"    {line}")

    # ── 5. Export ────────────────────────────────────────────────────────
    print(f"\n[5/5] Exporting model artifacts...")
    export_model_json(pipeline_lr, classes_sorted, args.out)
    export_meta_json(
        classes=classes_sorted,
        accuracy_main=acc_lr,
        accuracy_nb=acc_nb,
        label_counts={k: int(v) for k, v in label_counts.items()},
        out_path=args.meta,
    )

    print(f"\n{'='*60}")
    print(f"  Training complete!")
    print(f"  LogReg Accuracy:      {acc_lr*100:.1f}%")
    print(f"  NaiveBayes Accuracy:  {acc_nb*100:.1f}%")
    print(f"  Model → {args.out}")
    print(f"  Meta  → {args.meta}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
