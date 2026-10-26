import os
import json
import re
import urllib.request
import urllib.error
from flask import Flask, request, Response, send_from_directory, jsonify

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")

def find_supported_gemini_models(api_key):
    for ver in ["v1beta", "v1"]:
        try:
            url = f"https://generativelanguage.googleapis.com/{ver}/models?key={api_key}"
            req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
                models = []
                for m in data.get("models", []):
                    methods = m.get("supportedGenerationMethods", [])
                    if "generateContent" in methods:
                        name = m.get("name", "").replace("models/", "")
                        if name:
                            models.append(name)
                if models:
                    return models, ver
        except Exception:
            pass
    return [], "v1beta"

@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/api/data", methods=["GET"])
def get_data():
    data_type = request.args.get("type", "vazifalar")
    
    if data_type == "agent_memory" or data_type.endswith(".json") or request.args.get("format") == "json":
        filename = os.path.join(DATA_DIR, "agent_memory.json" if data_type == "agent_memory" else data_type)
        if not os.path.exists(filename):
            default_memory = {
                "profile": {
                    "name": "Foydalanuvchi",
                    "occupation": "Dasturchi / Mutaxassis",
                    "wakeTime": "05:00",
                    "sleepTime": "23:00",
                    "monthlySavingsGoal": 5000000,
                    "personalityTone": "coach",
                    "primaryGoal": "Shaxsiy unumdorlik va moliyaviy barqarorlik"
                },
                "learnedFacts": [
                    { "id": 1, "fact": "Ertalab soat 5:00 da uyg'onadi va Bomdod o'qiydi", "category": "kun_tartibi", "date": "2026-10-21" },
                    { "id": 2, "fact": "Odatda tushlik va ovqatlanish uchun kuniga 40 000 - 50 000 so'm xarajat qiladi", "category": "moliya", "date": "2026-10-21" },
                    { "id": 3, "fact": "Pomodoro fokus vaqti bilan ishlashni ma'qul ko'radi", "category": "unumdorlik", "date": "2026-10-21" }
                ],
                "coachingHistory": []
            }
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(default_memory, f, ensure_ascii=False, indent=2)
        
        with open(filename, "r", encoding="utf-8") as f:
            content = f.read()
        return Response(content, mimetype="application/json; charset=utf-8")

    filename = os.path.join(DATA_DIR, f"{data_type}.csv")
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            content = f.read()
        return Response(content, mimetype="text/csv; charset=utf-8")
    
    return Response(f"Fayl topilmadi: {data_type}.csv", status=404)

@app.route("/api/save", methods=["POST"])
def save_data():
    data_type = request.args.get("type", "vazifalar")
    post_body = request.get_data(as_text=True)
    
    if data_type == "agent_memory" or data_type.endswith(".json") or request.args.get("format") == "json":
        filename = os.path.join(DATA_DIR, "agent_memory.json" if data_type == "agent_memory" else data_type)
        with open(filename, "w", encoding="utf-8") as f:
            f.write(post_body)
        return jsonify({"status": "success", "file": os.path.basename(filename)})

    filename = os.path.join(DATA_DIR, f"{data_type}.csv")
    with open(filename, "w", encoding="utf-8", newline="") as f:
        f.write(post_body)
    return jsonify({"status": "success", "file": f"{data_type}.csv"})

@app.route("/api/gemini_proxy", methods=["POST"])
def gemini_proxy():
    try:
        data = request.get_json(force=True, silent=True) or {}
        api_key = data.get("apiKey", "") or os.environ.get("GEMINI_API_KEY", "")
        model = data.get("model", "gemini-4-argon")
        payload = data.get("payload", {})

        if not api_key:
            return jsonify({"error": "Gemini API kaliti kiritilmagan. Sozlamalarda API kalitni kiriting."}), 400

        models_to_try = []
        if model and model != "auto":
            clean = model.replace("models/", "")
            models_to_try.append(clean)

        m_lower = (model or "").lower()
        if "argon" in m_lower:
            fallbacks = ["gemini-4-argon", "gemini-4-argon-latest", "gemini-argon", "argon", "gemini-3.1-pro", "gemini-3.8-flash"]
        elif "pro" in m_lower or "3.1" in m_lower:
            fallbacks = ["gemini-3.1-pro", "gemini-3.1-pro-latest", "gemini-4-argon", "gemini-3.8-pro", "gemini-3.8-flash"]
        elif "lite" in m_lower or "3.5" in m_lower:
            fallbacks = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.1-pro"]
        else:
            fallbacks = ["gemini-4-argon", "gemini-3.1-pro", "gemini-3.8-flash", "gemini-3.5-flash-lite"]

        for f in fallbacks:
            if f not in models_to_try:
                models_to_try.append(f)

        last_err_body = None
        last_err_code = 500

        idx = 0
        while idx < len(models_to_try):
            candidate = models_to_try[idx]
            idx += 1

            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate}:generateContent?key={api_key}"
            req = urllib.request.Request(
                gemini_url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    resp_data = resp.read()
                    return Response(resp_data, mimetype="application/json; charset=utf-8")
            except urllib.error.HTTPError as he:
                last_err_code = he.code
                last_err_body = he.read().decode("utf-8")

                suggested_matches = re.findall(r'models/([a-zA-Z0-9.-]+)', last_err_body)
                for sm in suggested_matches:
                    if sm not in models_to_try and sm != candidate:
                        models_to_try.append(sm)

                if he.code in (404, 400) and ("not found" in last_err_body.lower() or "no longer available" in last_err_body.lower() or "update your code" in last_err_body.lower()):
                    continue
                else:
                    return Response(last_err_body, status=he.code, mimetype="application/json; charset=utf-8")

        # Try ModelService.ListModels
        available, ver = find_supported_gemini_models(api_key)
        if available:
            target = available[0]
            for m in available:
                if "argon" in m.lower() or "pro" in m.lower():
                    target = m
                    break
            gemini_url = f"https://generativelanguage.googleapis.com/{ver}/models/{target}:generateContent?key={api_key}"
            req = urllib.request.Request(
                gemini_url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    resp_data = resp.read()
                    return Response(resp_data, mimetype="application/json; charset=utf-8")
            except Exception:
                pass

        return Response(last_err_body or json.dumps({"error": "Model topilmadi"}), status=last_err_code, mimetype="application/json; charset=utf-8")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Catch-all route for static assets (style.css, app.js, images)
@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(BASE_DIR, filename)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print("=====================================================")
    print(f"Planner Dashboard (Flask/WSGI) ishga tushdi!")
    print(f"Brauzerda oching: http://localhost:{port}")
    print(f"Ma'lumotlar saqlanadi: {DATA_DIR}")
    print("=====================================================")
    app.run(host="0.0.0.0", port=port, debug=False)
