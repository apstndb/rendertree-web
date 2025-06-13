#!/bin/bash

# Start npm run dev in the background
npm run dev &

# Save the process ID
echo $! > .dev-pid

echo "Development server started in the background (PID: $!)"
echo "To stop the server, run: ./stop-dev.sh"