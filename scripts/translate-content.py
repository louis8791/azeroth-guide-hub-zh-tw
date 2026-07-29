#!/usr/bin/env python3
"""Free local translation pipeline with replaceable providers."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
SOURCE_PATH = ROOT / "data" / "content-source.json"
GLOSSARY_PATH = ROOT / "data" / "translation-glossary.json"
CACHE_PATH = ROOT / "data" / "translation-cache.json"
OUTPUT_PATH = ROOT / "public" / "data" / "live-index.json"
MODEL_NAME = "facebook/m2m100_418M"
GENERIC_TITLES = {
    "view all",
    "guides",
    "guide",
    "learn more",
    "home",
    "news",
    "classes",
    "tools",
    "resources",
}
GENERIC_TRANSLATED_TITLES = {
    "指南",
    "全部查看",
    "開發者",
    "首頁",
    "資源",
    "新聞",
    "縮小字元",
}
GUIDE_TITLE_HINTS = re.compile(
    r"\b("
    r"guide|guides|raid|dungeon|mythic|keystone|pvp|class|profession|"
    r"achievement|battle pet|toy|transmog|weapon|secret|addon|ui|"
    r"leveling|recipe|knowledge|route|progress|ranking|log|simulation|"
    r"talent|build|gear|vault|delve|reputation|mount|lore|quest|housing|"
    r"weekly|hidden|macro|rotation|tier list"
    r")s?\b",
    re.IGNORECASE,
)

try:
    from opencc import OpenCC

    CONVERTER = OpenCC("s2twp")
except ImportError:
    CONVERTER = None


def read_json(path: Path, fallback: dict[str, Any]) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return fallback


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def cache_key(provider: str, text: str) -> str:
    return hashlib.sha256(f"{provider}\0{text}".encode()).hexdigest()


def apply_glossary(text: str, terms: dict[str, str]) -> str:
    value = text
    for source, target in sorted(terms.items(), key=lambda item: -len(item[0])):
        value = re.sub(re.escape(source), target, value, flags=re.IGNORECASE)
    return value


def normalize(text: str, terms: dict[str, str]) -> str:
    value = apply_glossary(text, terms)
    if CONVERTER is not None:
        value = CONVERTER.convert(value)
    value = re.sub(r"(?<=[\u3400-\u9fff])\s+(?=[\u3400-\u9fff])", "", value)
    value = re.sub(r"\s+([，。！？；：])", r"\1", value)
    return re.sub(r"\s{2,}", " ", value).strip()


def exact_glossary(text: str, terms: dict[str, str]) -> str | None:
    folded = text.strip().casefold()
    for source, target in terms.items():
        if source.casefold() == folded:
            return target
    return None


def is_useful_document(document: dict[str, Any]) -> bool:
    title = str(document.get("title", "")).strip()
    return (
        len(title) >= 4
        and title.casefold() not in GENERIC_TITLES
        and not re.fullmatch(r"[\W_]+", title)
    )


def is_publishable_topic(document: dict[str, Any], terms: dict[str, str]) -> bool:
    if str(document.get("id", "")).endswith(":home"):
        return True
    title = str(document.get("title", "")).strip()
    return exact_glossary(title, terms) is not None or bool(GUIDE_TITLE_HINTS.search(title))


def passes_publish_gate(original: str, translated: str) -> bool:
    if translated.strip() in GENERIC_TRANSLATED_TITLES:
        return False
    if len(original) >= 10 and len(translated.strip()) < 4:
        return False
    if re.search(r"[A-Za-z]{4,}", original) and not (
        re.search(r"[\u3400-\u9fff]", translated)
        or re.search(r"[A-Za-z]{3,}", translated)
    ):
        return False
    return True


class Translator:
    name = "fallback"

    def translate(self, texts: list[str]) -> list[str]:
        return texts


class M2M100Translator(Translator):
    name = "m2m100"

    def __init__(self) -> None:
        from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer

        self.tokenizer = M2M100Tokenizer.from_pretrained(MODEL_NAME)
        self.tokenizer.src_lang = "en"
        self.model = M2M100ForConditionalGeneration.from_pretrained(MODEL_NAME)
        self.model.eval()

    def translate(self, texts: list[str]) -> list[str]:
        encoded = self.tokenizer(
            texts,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=480,
        )
        generated = self.model.generate(
            **encoded,
            forced_bos_token_id=self.tokenizer.get_lang_id("zh"),
            max_new_tokens=480,
            num_beams=4,
            early_stopping=True,
        )
        return self.tokenizer.batch_decode(generated, skip_special_tokens=True)


class ArgosTranslator(Translator):
    name = "argos"

    def __init__(self) -> None:
        from argostranslate import translate

        languages = translate.get_installed_languages()
        source = next(language for language in languages if language.code == "en")
        target = next(language for language in languages if language.code == "zh")
        self.translation = source.get_translation(target)

    def translate(self, texts: list[str]) -> list[str]:
        return [self.translation.translate(text) for text in texts]


class OllamaTranslator(Translator):
    name = "ollama"

    def __init__(self, model: str, endpoint: str) -> None:
        self.model = model
        self.endpoint = endpoint.rstrip("/")

    def translate(self, texts: list[str]) -> list[str]:
        results = []
        for text in texts:
            payload = json.dumps(
                {
                    "model": self.model,
                    "stream": False,
                    "prompt": (
                        "忠實翻譯成台灣繁體中文，不增刪攻略意思，只輸出譯文：\n"
                        + text
                    ),
                }
            ).encode()
            request = urllib.request.Request(
                f"{self.endpoint}/api/generate",
                data=payload,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(request, timeout=180) as response:
                results.append(json.loads(response.read())["response"].strip())
        return results


def make_translator(provider: str) -> Translator:
    if provider == "argos":
        return ArgosTranslator()
    if provider == "m2m100":
        return M2M100Translator()
    if provider == "ollama":
        return OllamaTranslator(
            os.environ.get("OLLAMA_MODEL", "qwen3:8b"),
            os.environ.get("OLLAMA_ENDPOINT", "http://127.0.0.1:11434"),
        )
    return Translator()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--provider",
        choices=["argos", "m2m100", "ollama", "fallback"],
        default=os.environ.get("TRANSLATION_PROVIDER", "argos"),
    )
    args = parser.parse_args()

    source = read_json(SOURCE_PATH, {"generatedAt": None, "documents": []})
    glossary = read_json(GLOSSARY_PATH, {"terms": {}})
    cache = read_json(CACHE_PATH, {"translations": {}})
    terms: dict[str, str] = glossary.get("terms", {})
    translations: dict[str, str] = cache.get("translations", {})
    translator = make_translator(args.provider)
    pending: list[str] = []
    pending_keys: set[str] = set()

    source_documents = [
        document
        for document in source.get("documents", [])
        if is_useful_document(document)
    ]

    for document in source_documents:
        if str(document.get("locale", "")).lower().startswith("zh"):
            continue
        for field in ("title", "originalText"):
            text = str(document.get(field, "")).strip()
            if exact_glossary(text, terms):
                continue
            key = cache_key(translator.name, text)
            if text and key not in translations and key not in pending_keys:
                pending.append(text)
                pending_keys.add(key)

    for offset in range(0, len(pending), 8):
        batch = pending[offset : offset + 8]
        translated = translator.translate([apply_glossary(text, terms) for text in batch])
        for original, output in zip(batch, translated, strict=True):
            translations[cache_key(translator.name, original)] = normalize(output, terms)

    items = []
    blocked_count = 0
    for document in source_documents:
        if not is_publishable_topic(document, terms):
            blocked_count += 1
            continue
        original_title = str(document.get("title", ""))
        original_text = str(document.get("originalText", ""))
        is_zh = str(document.get("locale", "")).lower().startswith("zh")
        translated_title = (
            original_title
            if is_zh
            else exact_glossary(original_title, terms)
            or translations.get(cache_key(translator.name, original_title), original_title)
        )
        translated_text = (
            original_text
            if is_zh
            else exact_glossary(original_text, terms)
            or translations.get(cache_key(translator.name, original_text), original_text)
        )
        normalized_title = normalize(translated_title, terms)
        normalized_text = normalize(translated_text, terms)
        if str(document.get("id", "")).endswith(":home"):
            normalized_title = str(document.get("sourceName", normalized_title))
        if not passes_publish_gate(original_title, normalized_title):
            blocked_count += 1
            continue
        items.append(
            {
                "id": document.get("id"),
                "title": normalized_title,
                "summary": normalized_text,
                "originalTitle": original_title,
                "sourceName": document.get("sourceName"),
                "sourceUrl": document.get("url"),
                "group": document.get("group"),
                "categoryHints": document.get("categoryHints", []),
                "updatedAt": document.get("discoveredAt"),
                "fingerprint": document.get("fingerprint"),
            }
        )

    write_json(
        CACHE_PATH,
        {
            "schemaVersion": 1,
            "provider": translator.name,
            "translations": translations,
        },
    )
    write_json(
        OUTPUT_PATH,
        {
            "schemaVersion": 1,
            "generatedAt": source.get("generatedAt"),
            "provider": translator.name,
            "qualityGate": {
                "published": len(items),
                "heldForReview": blocked_count,
            },
            "items": items,
        },
    )
    print(
        f"Wrote {len(items)} live index items with provider {translator.name}; "
        f"held {blocked_count} for review."
    )


if __name__ == "__main__":
    main()
