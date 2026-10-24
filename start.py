#!/usr/bin/env python3
"""
FelidLens Full-Stack Development Server Launcher
Starts both the FastAPI backend and Vite frontend concurrently with clean log prefixes and graceful termination.
"""

import os
import sys
import time
import signal
import shutil
import threading
import subprocess
from pathlib import Path

# ANSI Color Codes for terminal formatting
RESET = "\033[0m"
BOLD = "\033[1m"
MAGENTA = "\033[95m"
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"

def print_banner():
    banner = f"""
{MAGENTA}{BOLD}======================================================================
  🐾 FELIDLENS // FULL-STACK DEV RUNNER
======================================================================{RESET}
  {GREEN}➜ Backend API:{RESET}    http://127.0.0.1:8000
  {GREEN}➜ API Swagger:{RESET}    http://127.0.0.1:8000/docs
  {GREEN}➜ Frontend UI:{RESET}    http://localhost:5173
  {YELLOW}➜ Press Ctrl+C at any time to stop both servers{RESET}
{MAGENTA}{BOLD}======================================================================{RESET}
"""
    print(banner, flush=True)

def find_backend_python(backend_dir: Path) -> str:
    # 1. Virtual environment in backend/.venv
    if sys.platform == "win32":
        venv_py = backend_dir / ".venv" / "Scripts" / "python.exe"
    else:
        venv_py = backend_dir / ".venv" / "bin" / "python"
    
    if venv_py.exists():
        return str(venv_py)
    
    # 2. Virtual environment in root .venv
    root_venv = backend_dir.parent / ".venv"
    if sys.platform == "win32":
        root_py = root_venv / "Scripts" / "python.exe"
    else:
        root_py = root_venv / "bin" / "python"
    
    if root_py.exists():
        return str(root_py)

    # 3. Fallback to current python
    return sys.executable

def find_npm() -> str:
    if sys.platform == "win32":
        npm_cmd = shutil.which("npm.cmd")
        if npm_cmd:
            return npm_cmd
    npm = shutil.which("npm")
    if npm:
        return npm
    return "npm"

def kill_process_tree(proc):
    if proc is None or proc.poll() is not None:
        return
    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        else:
            proc.terminate()
            try:
                proc.wait(timeout=2)
            except subprocess.TimeoutExpired:
                proc.kill()
    except Exception:
        pass

def stream_output(pipe, prefix: str, color: str):
    try:
        for line in iter(pipe.readline, ""):
            if not line:
                break
            line_str = line.rstrip()
            if line_str:
                print(f"{color}{BOLD}[{prefix}]{RESET} {line_str}", flush=True)
    except Exception:
        pass
    finally:
        try:
            pipe.close()
        except Exception:
            pass

def main():
    # Configure UTF-8 encoding on Windows to prevent UnicodeEncodeError on cp1252
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
        os.system("")

    root_dir = Path(__file__).resolve().parent
    backend_dir = root_dir / "backend"
    frontend_dir = root_dir / "frontend"

    if not backend_dir.exists() or not frontend_dir.exists():
        print(f"{RED}Error: Expected backend and frontend directories in {root_dir}{RESET}")
        sys.exit(1)

    py_bin = find_backend_python(backend_dir)
    npm_bin = find_npm()

    print_banner()
    print(f"{BOLD}Using Python:{RESET} {py_bin}")
    print(f"{BOLD}Using NPM:{RESET}    {npm_bin}\n")

    backend_cmd = [
        py_bin,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload",
    ]

    frontend_cmd = [npm_bin, "run", "dev"]

    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = str(backend_dir)
    backend_env["PYTHONUNBUFFERED"] = "1"

    procs = []
    stop_event = threading.Event()

    try:
        # Launch backend
        print(f"{MAGENTA}{BOLD}>>> Starting FastAPI Backend...{RESET}")
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=str(backend_dir),
            env=backend_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        procs.append(backend_proc)

        # Launch frontend
        print(f"{CYAN}{BOLD}>>> Starting Vite Frontend...{RESET}\n")
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=str(frontend_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        procs.append(frontend_proc)

        # Start stream reader threads
        t1 = threading.Thread(
            target=stream_output,
            args=(backend_proc.stdout, "BACKEND", MAGENTA),
            daemon=True,
        )
        t2 = threading.Thread(
            target=stream_output,
            args=(frontend_proc.stdout, "FRONTEND", CYAN),
            daemon=True,
        )
        t1.start()
        t2.start()

        # Monitor processes
        while not stop_event.is_set():
            if backend_proc.poll() is not None:
                print(f"\n{RED}[BACKEND] Process exited with code {backend_proc.returncode}{RESET}")
                break
            if frontend_proc.poll() is not None:
                print(f"\n{RED}[FRONTEND] Process exited with code {frontend_proc.returncode}{RESET}")
                break
            time.sleep(0.5)

    except KeyboardInterrupt:
        print(f"\n{YELLOW}Received termination signal (Ctrl+C). Stopping services...{RESET}")
    finally:
        stop_event.set()
        for p in procs:
            kill_process_tree(p)
        print(f"{GREEN}All services stopped cleanly. Bye! 🐾{RESET}")

if __name__ == "__main__":
    main()
