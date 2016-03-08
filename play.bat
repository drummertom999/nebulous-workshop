@ECHO off
SET GAME_ROOT=%~dp0
set GAME_ROOT=%GAME_ROOT:~0,-1%

:: Add nodeJS to path
SET PATH=%GAME_ROOT%/enginejs/utils/nodejs/win64;%PATH%
SET NODE_PATH=%GAME_ROOT%/enginejs/utils/nodejs/node_modules
ECHO * NodeJS added to path

:: Start webserver
ECHO * Starting EngineJS development server
START node "%GAME_ROOT%/enginejs/tools/webserver/webserver.js" "%GAME_ROOT%"
START http://localhost:1234/index.htm