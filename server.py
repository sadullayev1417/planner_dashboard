import http.server
import socketserver
import os
import json
import re
import urllib.parse
import urllib.request

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

os.makedirs(DATA_DIR, exist_ok=True)

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
                print(f"[Gemini Proxy] Topilgan modellar ({ver}): {models}")
                if models:
                    return models, ver
        except urllib.error.HTTPError as he:
            err = he.read().decode("utf-8")
            print(f"[Gemini Proxy] ListModels xatosi ({ver}): {he.code} -> {err}")
        except Exception as e:
            print(f"[Gemini Proxy] ListModels istisno ({ver}): {e}")
    return [], "v1beta"

class PlannerHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == "/api/data":
            query = urllib.parse.parse_qs(parsed_url.query)
            data_type = query.get("type", ["vazifalar"])[0]
            
            if data_type == "agent_memory" or data_type.endswith(".json") or query.get("format", [""])[0] == "json":
                filename = os.path.join(DATA_DIR, "agent_memory.json" if data_type == "agent_memory" else data_type)
                if not os.path.exists(filename):
                    # Create default initial memory structure
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
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(content.encode("utf-8"))
                return

            filename = os.path.join(DATA_DIR, f"{data_type}.csv")
            if os.path.exists(filename):
                with open(filename, "r", encoding="utf-8") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/csv; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(content.encode("utf-8"))
            else:
                self.send_response(404)
                self.end_headers()
            return
        super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == "/api/save":
            query = urllib.parse.parse_qs(parsed_url.query)
            data_type = query.get("type", ["vazifalar"])[0]
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length).decode("utf-8")
            
            if data_type == "agent_memory" or data_type.endswith(".json") or query.get("format", [""])[0] == "json":
                filename = os.path.join(DATA_DIR, "agent_memory.json" if data_type == "agent_memory" else data_type)
                with open(filename, "w", encoding="utf-8") as f:
                    f.write(post_body)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "file": os.path.basename(filename)}).encode("utf-8"))
                return

            filename = os.path.join(DATA_DIR, f"{data_type}.csv")
            with open(filename, "w", encoding="utf-8", newline="") as f:
                f.write(post_body)
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "file": f"{data_type}.csv"}).encode("utf-8"))
            return
        if parsed_url.path == "/api/gemini_proxy":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(post_body)
                api_key = data.get("apiKey", "") or os.environ.get("GEMINI_API_KEY", "")
                model = data.get("model", "gemini-1.5-pro")
                payload = data.get("payload", {})

                if not api_key:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Gemini API kaliti kiritilmagan. Iltimos sozlamalarda API kalitni kiriting."}).encode("utf-8"))
                    return

                # Build model candidates list matching user's exact models (Argon, 3.1 Pro, 3.8 Flash, 3.5 Flash-Lite)
                models_to_try = []
                if model and model != "auto":
                    clean = model.replace("models/", "")
                    models_to_try.append(clean)
                
                m_lower = (model or "").lower()
                if "argon" in m_lower:
                    fallbacks = [
                        "gemini-4-argon",
                        "gemini-4-argon-latest",
                        "gemini-argon",
                        "argon",
                        "gemini-3.1-pro",
                        "gemini-3.8-flash"
                    ]
                elif "pro" in m_lower or "3.1" in m_lower:
                    fallbacks = [
                        "gemini-3.1-pro",
                        "gemini-3.1-pro-latest",
                        "gemini-4-argon",
                        "gemini-3.8-pro",
                        "gemini-3.8-flash"
                    ]
                elif "lite" in m_lower or "3.5" in m_lower:
                    fallbacks = [
                        "gemini-3.5-flash-lite",
                        "gemini-3.5-flash",
                        "gemini-3.8-flash",
                        "gemini-3.1-pro"
                    ]
                else:
                    fallbacks = [
                        "gemini-4-argon",
                        "gemini-3.1-pro",
                        "gemini-3.8-flash",
                        "gemini-3.5-flash-lite"
                    ]
                
                for f in fallbacks:
                    if f not in models_to_try:
                        models_to_try.append(f)

                success = False
                last_err_body = None
                last_err_code = 500

                # Use index-based iteration because we might append newly suggested models on the fly
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
                            self.send_response(200)
                            self.send_header("Content-Type", "application/json; charset=utf-8")
                            self.send_header("Access-Control-Allow-Origin", "*")
                            self.end_headers()
                            self.wfile.write(resp_data)
                            success = True
                            return
                    except urllib.error.HTTPError as he:
                        last_err_code = he.code
                        last_err_body = he.read().decode("utf-8")
                        print(f"[Gemini Proxy] {candidate} -> HTTP {he.code}: {last_err_body[:120]}")

                        # If Google suggested a newer model in the error message, append it immediately
                        suggested_matches = re.findall(r'models/([a-zA-Z0-9.-]+)', last_err_body)
                        for sm in suggested_matches:
                            if sm not in models_to_try and sm != candidate:
                                print(f"[Gemini Proxy] Tavsiya etilgan model qo'shildi: {sm}")
                                models_to_try.append(sm)

                        if he.code in (404, 400) and ("not found" in last_err_body.lower() or "no longer available" in last_err_body.lower() or "update your code" in last_err_body.lower()):
                            continue
                        else:
                            self.send_response(he.code)
                            self.send_header("Content-Type", "application/json; charset=utf-8")
                            self.send_header("Access-Control-Allow-Origin", "*")
                            self.end_headers()
                            self.wfile.write(last_err_body.encode("utf-8"))
                            return

                if not success:
                    # Query Google's ModelService to find exact models enabled for this key
                    available, ver = find_supported_gemini_models(api_key)
                    if available:
                        target = available[0]
                        for m in available:
                            if "pro" in m.lower():
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
                                self.send_response(200)
                                self.send_header("Content-Type", "application/json; charset=utf-8")
                                self.send_header("Access-Control-Allow-Origin", "*")
                                self.end_headers()
                                self.wfile.write(resp_data)
                                return
                        except urllib.error.HTTPError as he:
                            last_err_code = he.code
                            last_err_body = he.read().decode("utf-8")
                        except Exception:
                            pass

                    self.send_response(last_err_code)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    out = last_err_body.encode("utf-8") if isinstance(last_err_body, str) else json.dumps({"error": "Model topilmadi"}).encode("utf-8")
                    self.wfile.write(out)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), PlannerHTTPRequestHandler) as httpd:
        print("=====================================================")
        print(f"Planner & Moliya Dashboard Server ishga tushdi!")
        print(f"Brauzerda oching: http://localhost:{PORT}")
        print(f"Ma'lumotlar saqlanadi: {DATA_DIR}")
        print("=====================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer to'xtatildi.")
