@echo off
title Itemizador de Planilhas
echo.
echo ========================================
echo    ITEMIZADOR DE PLANILHAS
echo ========================================
echo.
echo Iniciando o aplicativo...
echo.
echo Se o navegador nao abrir automaticamente,
echo acesse: http://localhost:3000
echo.
echo Para parar o servidor, feche esta janela.
echo.
echo ========================================
echo.

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo.
    echo Para usar este app, voce precisa:
    echo 1. Instalar o Node.js: https://nodejs.org
    echo 2. Reiniciar o computador
    echo 3. Executar este arquivo novamente
    echo.
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo Instalando dependencias pela primeira vez...
    echo Isso pode demorar alguns minutos...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

REM Parar processos Node.js existentes para evitar conflitos
echo Parando processos anteriores...
taskkill /f /im node.exe >nul 2>&1

REM Aguardar um momento para liberar a porta
timeout /t 2 /nobreak >nul

REM Iniciar o aplicativo
echo Iniciando o servidor...
echo.
npm start

REM Se chegou aqui, houve algum erro
echo.
echo O servidor foi encerrado.
pause
