import datetime
import os

"""
See https://www.youtube.com/watch?v=J5B9UGTuNoM for more information.
"""

# Créer un log avec timestamp
timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
log_entry = f"{timestamp} - PreToolUse hook executed\n"

# Écrire dans le fichier de log
logs_dir = "/Users/alain/Workspace/GitHub/revdisp/logs"
log_file = os.path.join(logs_dir, "pre_tool_use.log")

with open(log_file, "a") as f:
    f.write(log_entry)
