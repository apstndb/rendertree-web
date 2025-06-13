#!/bin/bash

if [ -f .dev-pid ]; then
  PID=$(cat .dev-pid)
  
  # Check if the process is still running
  if ps -p $PID > /dev/null; then
    echo "Stopping development server (PID: $PID)..."
    kill $PID
    
    # Also kill any child processes (like the Vite server)
    pkill -P $PID
    
    echo "Development server stopped."
  else
    echo "Development server is not running (PID: $PID not found)."
  fi
  
  # Remove the PID file
  rm .dev-pid
else
  echo "No development server PID file found."
fi