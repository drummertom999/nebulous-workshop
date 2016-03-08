GAME_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Add NodeJS to path
export PATH=$PATH:$GAME_ROOT/enginejs/utils/nodejs/linux64
export NODE_PATH=$GAME_ROOT/enginejs/utils/nodejs/node_modules
printf "* NodeJS added to path\n"

# Start webserver
printf "* Starting EngineJS development server\n"
xdg-open http://localhost:1234/index.htm &> /dev/null
node $GAME_ROOT/enginejs/tools/webserver/webserver.js $GAME_ROOT