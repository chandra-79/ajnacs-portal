"""Run a small CPU-only llama.cpp decoding comparison on two local GGUFs."""
import argparse
import csv
from pathlib import Path
import re
import subprocess

PROMPT = "Explain why a service should log the outcome of a retry with a request identifier."
EVAL = re.compile(r"eval time =\s*([.\d]+) ms\s*/\s*(\d+) runs\s*\([^,]+,\s*([.\d]+) tokens per second\)")
MODELS = ("Gemma 4 E2B Q8_0", "Qwen3-Coder 30B")
ARGS = [
    "--device", "none", "--fit", "off", "--no-kv-offload", "--no-op-offload", "-ngl", "0",
    "-t", "3", "-c", "2048", "-n", "64", "--seed", "42", "--temp", "0", "--ignore-eos",
    "--no-warmup", "--simple-io", "--no-display-prompt", "-no-cnv",
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("gemma", type=Path, help="Path to the first GGUF")
    parser.add_argument("qwen", type=Path, help="Path to the second GGUF")
    parser.add_argument("output", type=Path, help="Destination CSV")
    args = parser.parse_args()
    version = subprocess.run(["llama-completion", "--version"], capture_output=True, text=True, check=True)
    build = re.search(r"version:\s*([^\r\n]+)", version.stdout + version.stderr)
    build_id = build.group(1).strip() if build else "version unavailable"
    rows = []
    for repeat in range(1, 4):
        for model, weight in zip(MODELS, (args.gemma, args.qwen)):
            run = subprocess.run(
                ["llama-completion", "-m", str(weight), *ARGS, "-p", PROMPT],
                stdin=subprocess.DEVNULL, capture_output=True, text=True, check=True, timeout=120,
            )
            result = EVAL.search(run.stderr)
            if not result:
                raise RuntimeError("llama.cpp did not return a per-token evaluation summary")
            rows.append((model, repeat, *result.groups(), build_id))
    with args.output.open("w", newline="") as file:
        writer = csv.writer(file, lineterminator="\n")
        writer.writerow(("model", "run", "decode_eval_ms", "decode_runs", "tokens_per_second", "llama_cpp_build"))
        writer.writerows(rows)


if __name__ == "__main__":
    main()
